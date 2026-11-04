import { defineEntityStore } from '@entity-store/pinia'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, test } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

interface User {
  id: number
  name: string
}
const useUsers = defineEntityStore<User>('users')

const Users = defineComponent({
  setup() {
    // biome-ignore lint/correctness/useHookAtTopLevel: Vue setup(), not a React hook
    const users = useUsers()
    return () =>
      h(
        'ul',
        users.getAllArray().map((u) => h('li', u.name)),
      )
  },
})

async function render(pinia: ReturnType<typeof createPinia>) {
  const app = createSSRApp(Users).use(pinia)
  return renderToString(app)
}

describe('SSR with @entity-store/pinia', () => {
  test('server renders, state serializes, client pinia rehydrates identically', async () => {
    const server = createPinia()
    setActivePinia(server)
    useUsers().createMany([
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Bob' },
    ])
    const html = await render(server)
    expect(html).toBe('<ul><li>Ada</li><li>Bob</li></ul>')

    // What would be inlined in the page as window.__PINIA__
    const payload = JSON.stringify(server.state.value)

    const client = createPinia()
    client.state.value = JSON.parse(payload)
    setActivePinia(client)
    expect(useUsers().getAllIds()).toEqual([1, 2])
    expect(useUsers().getOne(2)?.$isDirty).toBe(false)
    expect(await render(client)).toBe(html)
  })

  test('requests do not leak state into each other', async () => {
    const a = createPinia()
    setActivePinia(a)
    useUsers().createOne({ id: 1, name: 'A' })
    const b = createPinia()
    setActivePinia(b)
    expect(useUsers().getIsEmpty()).toBe(true)
  })
})
