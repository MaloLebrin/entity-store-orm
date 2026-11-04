import { createEntityAtoms } from '@entity-store/jotai'
import { createEntityStore as createValtio } from '@entity-store/valtio'
import { createEntityStore as createZustand } from '@entity-store/zustand'
import { createStore, Provider as JotaiProvider, useAtomValue } from 'jotai'
import { renderToString } from 'react-dom/server'
import { useSnapshot } from 'valtio'
import { describe, expect, test } from 'vitest'
import { useStore } from 'zustand'

/**
 * Per-request SSR contract for the adapters other than redux/pinia:
 *  1. each request gets its own store (no state leaking between requests),
 *  2. the state survives JSON serialization, `current` and `active` included,
 *  3. a fresh store built from the payload renders the same HTML.
 */

interface User {
  id: number
  name: string
}
const seed: User[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Bob' },
]
const other: User[] = [{ id: 9, name: 'Zoe' }]

const html = (users: User[], current?: User) =>
  `<ul>${users.map((u) => `<li>${u.name}</li>`).join('')}</ul><p>${current?.name ?? ''}</p>`

type Entities = ReturnType<
  ReturnType<typeof createZustand<User>>['getState']
>['entities']

function ZustandList({
  store,
}: {
  store: ReturnType<typeof createZustand<User>>
}) {
  const entities = useStore(store, (s) => s.entities)
  return (
    <>
      <ul>
        {entities.allIds.map((id) => (
          <li key={id}>{entities.byId[id]?.name}</li>
        ))}
      </ul>
      <p>
        {entities.currentById === null
          ? ''
          : entities.byId[entities.currentById]?.name}
      </p>
    </>
  )
}

const atoms = createEntityAtoms<User>()
function JotaiList() {
  const getAllArray = useAtomValue(atoms.getters.getAllArray)
  const getCurrentById = useAtomValue(atoms.getters.getCurrentById)
  return (
    <>
      <ul>
        {getAllArray().map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
      <p>{getCurrentById()?.name}</p>
    </>
  )
}

const ValtioList = ({
  store,
}: {
  store: ReturnType<typeof createValtio<User>>
}) => {
  const snap = useSnapshot(store)
  return (
    <>
      <ul>
        {snap.entities.allIds.map((id) => (
          <li key={id}>{snap.entities.byId[id]?.name}</li>
        ))}
      </ul>
      <p>
        {snap.entities.currentById === null
          ? ''
          : snap.entities.byId[snap.entities.currentById]?.name}
      </p>
    </>
  )
}

describe('zustand: per-request store, serialize, hydrate', () => {
  const request = (users: User[], currentId?: number) => {
    const s = createZustand<User>()
    s.getState().createMany(users)
    if (currentId !== undefined) s.getState().setCurrentById(currentId)
    return s
  }

  test('requests do not share state', () => {
    const a = request(seed)
    const b = request(other)
    expect(a.getState().getAllArray()).toHaveLength(2)
    expect(b.getState().getAllArray()).toHaveLength(1)
  })

  test('JSON payload hydrates a fresh store with the same HTML', () => {
    const server = request(seed, 2)
    const serverHtml = renderToString(
      <ZustandList store={createZustand<User>(server.getState().entities)} />,
    )
    expect(serverHtml).toBe(html(seed, seed[1]))

    const payload = JSON.stringify(server.getState().entities)
    const client = createZustand<User>(JSON.parse(payload) as Entities)
    expect(renderToString(<ZustandList store={client} />)).toBe(serverHtml)
    expect(client.getState().entities).toEqual(server.getState().entities)
  })

  test('a hydrated store keeps working', () => {
    const client = createZustand<User>(
      JSON.parse(JSON.stringify(request(seed).getState().entities)),
    )
    client.getState().createOne({ id: 3, name: 'Cy' })
    expect(client.getState().getAllIds()).toEqual([1, 2, 3])
  })
})

describe('jotai: store per request, serialize, hydrate', () => {
  const render = (store: ReturnType<typeof createStore>) =>
    renderToString(
      <JotaiProvider store={store}>
        <JotaiList />
      </JotaiProvider>,
    )

  test('stores created from the same atoms do not share state', () => {
    const a = createStore()
    const b = createStore()
    a.set(atoms.actions.createMany, seed)
    b.set(atoms.actions.createMany, other)
    expect(a.get(atoms.state).entities.allIds).toEqual([1, 2])
    expect(b.get(atoms.state).entities.allIds).toEqual([9])
  })

  test('JSON payload hydrates a fresh store with the same HTML', () => {
    const server = createStore()
    server.set(atoms.actions.createMany, seed)
    server.set(atoms.actions.setCurrentById, 2)
    const serverHtml = render(server)
    expect(serverHtml).toBe(html(seed, seed[1]))

    const payload = JSON.stringify(server.get(atoms.state))
    const client = createStore()
    client.set(atoms.state, JSON.parse(payload))
    expect(render(client)).toBe(serverHtml)
  })
})

describe('valtio: proxy per request, serialize, hydrate', () => {
  test('proxies created per request do not share state', () => {
    const a = createValtio<User>()
    const b = createValtio<User>()
    a.createMany(seed)
    b.createMany(other)
    expect(a.getAllIds()).toEqual([1, 2])
    expect(b.getAllIds()).toEqual([9])
  })

  test('JSON payload hydrates a fresh proxy with the same HTML', () => {
    const server = createValtio<User>()
    server.createMany(seed)
    server.setCurrentById(2)
    const serverHtml = renderToString(<ValtioList store={server} />)
    expect(serverHtml).toBe(html(seed, seed[1]))

    const payload = JSON.stringify(server.entities)
    const client = createValtio<User>()
    const saved = JSON.parse(payload) as Entities
    client.createMany(saved.allIds.map((id) => saved.byId[id] as User))
    client.setCurrentById(saved.currentById as number)
    expect(renderToString(<ValtioList store={client} />)).toBe(serverHtml)
  })
})
