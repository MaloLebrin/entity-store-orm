import { describe, expect, test, vi } from 'vitest'
import { createEntityStore } from './index.js'

interface User {
  id: number
  name: string
}

describe('vanilla store', () => {
  test('notifies subscribers on change only', () => {
    const store = createEntityStore<User>()
    const listener = vi.fn()
    const off = store.subscribe(listener)
    store.actions.createOne({ id: 1, name: 'Ada' })
    expect(listener).toHaveBeenCalledTimes(1)
    store.actions.deleteOne(99) // unknown id: same state, no notification
    expect(listener).toHaveBeenCalledTimes(1)
    off()
    store.actions.createOne({ id: 2, name: 'Bob' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('getAllArray is stable between changes (useSyncExternalStore safe)', () => {
    const store = createEntityStore<User>()
    store.actions.createOne({ id: 1, name: 'Ada' })
    const a = store.getters.getAllArray()
    expect(store.getters.getAllArray()).toBe(a)
    store.actions.createOne({ id: 2, name: 'Bob' })
    expect(store.getters.getAllArray()).not.toBe(a)
  })

  test('seeds the initial state', () => {
    const first = createEntityStore<User>()
    first.actions.createOne({ id: 1, name: 'Ada' })
    const store = createEntityStore<User>(first.getState().entities)
    expect(store.getters.getAllIds()).toEqual([1])
    store.actions.removeAll()
    expect(store.getInitialState().entities.allIds).toEqual([1])
    expect(store.getters.getIsEmpty()).toBe(true)
  })
})
