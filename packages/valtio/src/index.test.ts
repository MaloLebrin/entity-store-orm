import type { WithId } from '@entity-store/core'
import { snapshot, subscribe } from 'valtio/vanilla'
import { describe, expect, test, vi } from 'vitest'
import { createEntityStore } from './index.js'

interface User extends WithId {
  name: string
  age: number
}

const ada: User = { id: 1, name: 'Ada', age: 36 }
const bob: User = { id: 2, name: 'Bob', age: 25 }

describe('valtio adapter', () => {
  test('initial state has the normalized shape', () => {
    expect(createEntityStore<User>().entities).toEqual({
      byId: {},
      allIds: [],
      current: null,
      currentById: null,
      active: [],
    })
  })

  test('actions and getters', () => {
    const s = createEntityStore<User>()
    s.createMany([ada, bob])
    s.updateField('name', 'Ada L.', 1)
    s.setActive(1)
    s.setCurrentById(2)

    expect(s.getAllIds()).toEqual([1, 2])
    expect(s.getOne(1)?.name).toBe('Ada L.')
    expect(s.isDirty(1)).toBe(true)
    expect(s.getActive()).toEqual([1])
    expect(s.getCurrentById()?.name).toBe('Bob')
    expect(s.getWhereArray((u) => u.age > 30)).toHaveLength(1)

    s.deleteOne(1)
    expect(s.getAllIds()).toEqual([2])
  })

  test('subscribers are notified and snapshots are immutable', async () => {
    const s = createEntityStore<User>()
    const listener = vi.fn()
    subscribe(s, listener)
    const before = snapshot(s).entities

    s.createOne(ada)
    await Promise.resolve()

    expect(listener).toHaveBeenCalled()
    expect(snapshot(s).entities).not.toBe(before)
    expect(before.allIds).toEqual([])
  })

  test('untouched entities keep their reference', () => {
    const s = createEntityStore<User>()
    s.createMany([ada, bob])
    const bobBefore = s.getOne(2)
    s.updateField('age', 99, 1)
    expect(s.getOne(2)).toBe(bobBefore)
  })
})

describe('valtio memoize option', () => {
  test('getAllArray is memoized by default and can be disabled', () => {
    const on = createEntityStore<User>()
    on.createMany([ada, bob])
    expect(on.getAllArray()).toBe(on.getAllArray())

    const off = createEntityStore<User>({ memoize: false })
    off.createMany([ada, bob])
    expect(off.getAllArray()).not.toBe(off.getAllArray())
  })
})
