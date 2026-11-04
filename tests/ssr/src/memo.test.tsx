import { createEntityStore } from '@entity-store/zustand'
import { renderToString } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { type StoreApi, useStore } from 'zustand'

interface User {
  id: number
  name: string
}

// Without memoization this selector returns a new array on every read, which
// useSyncExternalStore treats as a changing snapshot.
function List({
  store,
}: {
  store: StoreApi<ReturnType<ReturnType<typeof make>['getState']>>
}) {
  const users = useStore(store, (s) => s.getAllArray())
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}

const make = () => createEntityStore<User>()

describe('memoized getAllArray in React', () => {
  test('can be used directly as a zustand selector (stable snapshot)', () => {
    const store = make()
    store.getState().createMany([
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Bob' },
    ])
    expect(renderToString(<List store={store} />)).toBe(
      '<ul><li>Ada</li><li>Bob</li></ul>',
    )
    expect(store.getState().getAllArray()).toBe(store.getState().getAllArray())
  })
})
