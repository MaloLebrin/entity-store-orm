import type { WithId } from '@entity-store/core'
import { createStore } from 'jotai/vanilla'
import { describe, expect, test, vi } from 'vitest'
import { createEntityAtoms } from './index.js'

interface User extends WithId {
  name: string
  age: number
}

const ada: User = { id: 1, name: 'Ada', age: 36 }
const bob: User = { id: 2, name: 'Bob', age: 25 }

describe('jotai adapter', () => {
  test('initial state has the normalized shape', () => {
    const users = createEntityAtoms<User>()
    const store = createStore()
    expect(store.get(users.state).entities).toEqual({
      byId: {},
      allIds: [],
      current: null,
      currentById: null,
      active: [],
    })
  })

  test('actions and getters', () => {
    const users = createEntityAtoms<User>()
    const store = createStore()
    const { actions: a, getters: g } = users

    store.set(a.createMany, [ada, bob])
    store.set(a.updateField, 'name', 'Ada L.', 1)
    store.set(a.setActive, 1)
    store.set(a.setCurrentById, 2)

    expect(store.get(g.getAllIds)()).toEqual([1, 2])
    expect(store.get(g.getOne)(1)?.name).toBe('Ada L.')
    expect(store.get(g.isDirty)(1)).toBe(true)
    expect(store.get(g.getActive)()).toEqual([1])
    expect(store.get(g.getCurrentById)()?.name).toBe('Bob')
    expect(store.get(g.getWhereArray)((u) => u.age > 30)).toHaveLength(1)

    store.set(a.deleteOne, 1)
    expect(store.get(g.getAllIds)()).toEqual([2])
  })

  test('getter atoms notify subscribers when the state changes', () => {
    const users = createEntityAtoms<User>()
    const store = createStore()
    const listener = vi.fn()
    store.sub(users.getters.getAllIds, listener)

    store.set(users.actions.createOne, ada)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('each store gets isolated state', () => {
    const users = createEntityAtoms<User>()
    const s1 = createStore()
    const s2 = createStore()
    s1.set(users.actions.createOne, ada)
    expect(s2.get(users.getters.getIsEmpty)()).toBe(true)
  })
})

describe('jotai memoize option', () => {
  test('getAllArray is memoized by default and can be disabled', () => {
    for (const [memoize, same] of [
      [undefined, true],
      [false, false],
    ] as const) {
      const users = createEntityAtoms<User>({ memoize })
      const store = createStore()
      store.set(users.actions.createMany, [ada, bob])
      const getAll = store.get(users.getters.getAllArray)
      const first = getAll()
      const second = getAll()
      expect(Object.is(first, second)).toBe(same)
    }
  })
})
