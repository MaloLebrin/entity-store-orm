import type { WithId } from '@entity-store/core'
import { describe, expect, test, vi } from 'vitest'
import { createEntityStore } from './index.js'

interface User extends WithId {
  name: string
  age: number
}

const ada: User = { id: 1, name: 'Ada', age: 36 }
const bob: User = { id: 2, name: 'Bob', age: 25 }

describe('zustand adapter', () => {
  test('initial state has the normalized shape', () => {
    const { entities } = createEntityStore<User>().getState()
    expect(entities).toEqual({
      byId: {},
      allIds: [],
      current: null,
      currentById: null,
      active: [],
    })
  })

  test('actions and getters', () => {
    const store = createEntityStore<User>()
    const s = () => store.getState()

    s().createMany([ada, bob])
    s().updateField('name', 'Ada L.', 1)
    s().setActive(1)
    s().setCurrentById(2)

    expect(s().getAllIds()).toEqual([1, 2])
    expect(s().getOne(1)?.name).toBe('Ada L.')
    expect(s().isDirty(1)).toBe(true)
    expect(s().getActive()).toEqual([1])
    expect(s().getCurrentById()?.name).toBe('Bob')
    expect(s().getWhereArray((u) => u.age > 30)).toHaveLength(1)

    s().deleteOne(1)
    expect(s().getAllIds()).toEqual([2])
  })

  test('notifies subscribers with immutable updates', () => {
    const store = createEntityStore<User>()
    const listener = vi.fn()
    store.subscribe(listener)
    const before = store.getState().entities

    store.getState().createOne(ada)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getState().entities).not.toBe(before)
    expect(before.allIds).toEqual([])
  })

  test('no-op actions do not produce a new entities reference', () => {
    const store = createEntityStore<User>()
    store.getState().createOne(ada)
    const before = store.getState().entities
    store.getState().setActive(99)
    expect(store.getState().entities).toBe(before)
  })
})
