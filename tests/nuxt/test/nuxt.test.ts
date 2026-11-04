import { type ChildProcess, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const entry = fileURLToPath(
  new URL('../.output/server/index.mjs', import.meta.url),
)
const PORT = 3917
const base = `http://127.0.0.1:${PORT}`
let server: ChildProcess

// Optional: needs Playwright + a Chromium binary (present locally, not on every CI).
const require = createRequire(import.meta.url)
const hasPlaywright = (() => {
  try {
    require.resolve('playwright')
    return true
  } catch {
    return false
  }
})()

beforeAll(async () => {
  if (!existsSync(entry))
    throw new Error('Run `pnpm build` (nuxt build) before the tests')
  server = spawn('node', [entry], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
    stdio: 'ignore',
  })
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base)).ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('Nuxt server did not start')
})

afterAll(() => {
  server?.kill()
})

describe('Nuxt + @entity-store/pinia', () => {
  it('renders entities created during SSR', async () => {
    const html = await (await fetch(base)).text()
    expect(html).toContain('<li>Ada</li>')
    expect(html).toContain('<li>Grace</li>')
    expect(html).toContain('<p id="count">2</p>')
  })

  it('serializes the entity state into the Nuxt payload', async () => {
    const html = await (await fetch(base)).text()
    // Pinia state is shipped in the devalue payload; ids/names must be in there.
    expect(html).toContain('id="__NUXT_DATA__"')
    expect(html).toContain('Ada')
    expect(html).toContain('Grace')
  })

  it('does not leak state between requests', async () => {
    const a = await (await fetch(base)).text()
    const b = await (await fetch(base)).text()
    expect(a.match(/<li>/g)?.length).toBe(2)
    expect(b.match(/<li>/g)?.length).toBe(2)
  })

  it.skipIf(!hasPlaywright)(
    'hydrates in a browser and stays reactive',
    async () => {
      const { chromium } = require('playwright') as typeof import('playwright')
      const browser = await chromium.launch({ args: ['--no-sandbox'] })
      try {
        const page = await browser.newPage()
        const errors: string[] = []
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
        page.on('pageerror', (e) => errors.push(String(e)))
        await page.goto(base)
        await page.waitForTimeout(500)
        expect(await page.locator('#users li').count()).toBe(2)
        await page.click('#add')
        await page.waitForFunction(
          () => document.querySelectorAll('#users li').length === 3,
        )
        expect(await page.textContent('#count')).toBe('3')
        expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([])
      } finally {
        await browser.close()
      }
    },
  )
})
