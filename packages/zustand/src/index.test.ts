import { type WithId, withOptimisticUpdate } from '@entity-store/core'
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

  test('optimistic update: rollback and withOptimisticUpdate', async () => {
    const store = createEntityStore<User>()
    const s = () => store.getState()
    s().createOne(ada)
    s().optimisticUpdate(1, { name: 'Ada L.' }, 'tx')
    expect(s().isPending(1)).toBe(true)
    s().rollbackOptimistic(1, 'tx')
    expect(s().getOne(1)).toMatchObject({ name: 'Ada', $isDirty: false })

    await expect(
      withOptimisticUpdate(s(), 1, { name: 'x' }, () =>
        Promise.reject(new Error('no')),
      ),
    ).rejects.toThrow('no')
    expect(s().getOne(1)?.name).toBe('Ada')
    await withOptimisticUpdate(s(), 1, { name: 'y' }, async () => {})
    expect(s().getOne(1)?.name).toBe('y')
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

  test('can be seeded with initial entities', () => {
    const seeded = createEntityStore<User>()
    seeded.getState().createMany([ada, bob])
    const store = createEntityStore<User>(seeded.getState().entities)
    expect(store.getInitialState().getAllIds()).toEqual([1, 2])
    expect(store.getState().getOne(2)?.name).toBe('Bob')
  })
})

describe('zustand memoize option', () => {
  test('getAllArray is memoized by default and can be disabled', () => {
    const on = createEntityStore<User>()
    on.getState().createMany([ada, bob])
    expect(on.getState().getAllArray()).toBe(on.getState().getAllArray())

    const off = createEntityStore<User>(undefined, { memoize: false })
    off.getState().createMany([ada, bob])
    expect(off.getState().getAllArray()).not.toBe(off.getState().getAllArray())
  })
})

describe('zustand setAll / getSortedArray / getByField', () => {
  test('work through the store', () => {
    const s = createEntityStore<User>().getState
    s().createMany([ada])
    s().setAll([bob, ada])
    expect(s().getAllIds()).toEqual([2, 1])
    expect(
      s()
        .getSortedArray({ orderBy: 'age' })
        .map((u) => u.id),
    ).toEqual([2, 1])
    expect(
      s()
        .getByField('name', 'Ada')
        .map((u) => u.id),
    ).toEqual([1])
  })
})

describe('zustand object filters', () => {
  test('memoized by value through the store', () => {
    const s = createEntityStore<User>().getState
    s().createMany([ada, bob, { id: 3, name: 'Cy', age: 25 }])
    expect(
      s()
        .getWhereArray({ age: 25 })
        .map((u) => u.id),
    ).toEqual([2, 3])
    expect(s().getWhereArray({ age: 25 })).toBe(s().getWhereArray({ age: 25 }))
    expect(s().getFirstWhere({ name: 'Cy', age: 25 })?.id).toBe(3)
    expect(Object.keys(s().getWhere({ age: 36 }))).toEqual(['1'])
  })
})
