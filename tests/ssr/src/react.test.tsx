import { createEntityAtoms } from '@entity-store/jotai'
import { createEntitySlice } from '@entity-store/redux'
import { createEntityStore as createValtio } from '@entity-store/valtio'
import {
  createEntityStore as createZustand,
  type EntityStore,
} from '@entity-store/zustand'
import { configureStore } from '@reduxjs/toolkit'
import { createStore, Provider as JotaiProvider, useAtomValue } from 'jotai'
import { renderToString } from 'react-dom/server'
import { Provider, useSelector } from 'react-redux'
import { useSnapshot } from 'valtio'
import { describe, expect, test } from 'vitest'
import { type StoreApi, useStore } from 'zustand'

interface User {
  id: number
  name: string
}
const seed: User[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Bob' },
]
const EXPECTED = '<ul><li>Ada</li><li>Bob</li></ul>'

function ZustandList({ store }: { store: StoreApi<EntityStore<User>> }) {
  const users = useStore(store, (s) => s.entities.byId)
  return (
    <ul>
      {Object.values(users).map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}

const slice = createEntitySlice<User>('users')
const makeReduxStore = (preloaded?: ReturnType<typeof slice.reducer>) =>
  configureStore({
    reducer: { users: slice.reducer },
    preloadedState: preloaded ? { users: preloaded } : undefined,
  })
type Root = ReturnType<ReturnType<typeof makeReduxStore>['getState']>
const select = slice.getSelectors((r: Root) => r.users)
function ReduxList() {
  const users = useSelector((r: Root) => select.getAllArray(r))
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}

const atoms = createEntityAtoms<User>()
function JotaiList() {
  const getAllArray = useAtomValue(atoms.getters.getAllArray)
  return (
    <ul>
      {getAllArray().map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}

const valtioStore = createValtio<User>()
function ValtioList() {
  const snap = useSnapshot(valtioStore)
  return (
    <ul>
      {snap.getAllArray().map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}

describe('React SSR (renderToString)', () => {
  test('zustand', () => {
    // Zustand renders its *initial* state on the server: seed at creation,
    // one store per request.
    const tmp = createZustand<User>()
    tmp.getState().createMany(seed)
    const store = createZustand<User>(tmp.getState().entities)
    expect(renderToString(<ZustandList store={store} />)).toBe(EXPECTED)
  })

  test('redux, and the serialized state can preload a fresh store', () => {
    const server = makeReduxStore()
    server.dispatch(slice.actions.createMany(seed))
    const payload = JSON.stringify(server.getState().users)

    const client = makeReduxStore(JSON.parse(payload))
    expect(
      renderToString(
        <Provider store={client}>
          <ReduxList />
        </Provider>,
      ),
    ).toBe(EXPECTED)
  })

  test('jotai (store per request)', () => {
    const store = createStore()
    store.set(atoms.actions.createMany, seed)
    expect(
      renderToString(
        <JotaiProvider store={store}>
          <JotaiList />
        </JotaiProvider>,
      ),
    ).toBe(EXPECTED)
  })

  test('valtio', () => {
    valtioStore.createMany(seed)
    expect(renderToString(<ValtioList />)).toBe(EXPECTED)
  })
})
