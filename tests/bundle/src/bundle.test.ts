import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build as esbuild } from 'esbuild'
import { describe, expect, test } from 'vitest'
import webpack from 'webpack'

const here = resolve(import.meta.dirname)
const out = mkdtempSync(join(tmpdir(), 'bundle-'))
const entry = (name: string) => join(here, `${name}.js`)

async function withEsbuild(name: string) {
  const outfile = join(out, `${name}.esbuild.js`)
  await esbuild({
    entryPoints: [entry(name)],
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' },
    outfile,
    logLevel: 'silent',
  })
  return readFileSync(outfile, 'utf8')
}

function withWebpack(name: string): Promise<string> {
  const filename = `${name}.webpack.js`
  return new Promise((ok, fail) => {
    webpack(
      {
        mode: 'production',
        entry: entry(name),
        output: { path: out, filename },
        target: 'web',
        performance: { hints: false },
      },
      (err, stats) => {
        if (err) return fail(err)
        if (stats?.hasErrors())
          return fail(new Error(stats.toString('errors-only')))
        ok(readFileSync(join(out, filename), 'utf8'))
      },
    )
  })
}

describe('bundling the built packages', () => {
  test('esbuild: importing one core action tree-shakes the rest', async () => {
    const code = await withEsbuild('entry-core-one')
    expect(code.length).toBeLessThan(2_000)
    expect(code).not.toContain('orderBy') // sorting/getters not reachable
    expect(code).not.toContain('RegExp') // search not reachable
  })

  test('webpack: importing one core action tree-shakes the rest', async () => {
    const code = await withWebpack('entry-core-one')
    expect(code.length).toBeLessThan(2_000)
    expect(code).not.toContain('orderBy')
    expect(code).not.toContain('RegExp')
  })

  test.each([
    ['esbuild', withEsbuild],
    ['webpack', withWebpack],
  ])('%s: a single adapter stays small', async (_n, bundle) => {
    const code = await bundle('entry-zustand')
    expect(code.length).toBeLessThan(15_000)
  })

  test.each([
    ['esbuild', withEsbuild],
    ['webpack', withWebpack],
  ])('%s: every package resolves and bundles together', async (_n, bundle) => {
    const code = await bundle('entry-all')
    expect(code.length).toBeGreaterThan(1_000)
  })
})
