import type { WithId } from '@entity-store/core'
import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, test } from 'vitest'
import { createEntitySlice } from './index.js'

interface User extends WithId {
  name: string
  age: number
}

const ada: User = { id: 1, name: 'Ada', age: 36 }
const bob: User = { id: 2, name: 'Bob', age: 25 }

function setup() {
  const users = createEntitySlice<User>('users')
  const store = configureStore({ reducer: { users: users.reducer } })
  type Root = ReturnType<typeof store.getState>
  const select = users.getSelectors((root: Root) => root.users)
  return { users, store, select, a: users.actions }
}

describe('redux adapter', () => {
  test('initial state has the normalized shape', () => {
    const { store } = setup()
    expect(store.getState().users.entities).toEqual({
      byId: {},
      allIds: [],
      current: null,
      currentById: null,
      active: [],
    })
  })

  test('optimistic update: commit and rollback', () => {
    const { store, select, a } = setup()
    store.dispatch(a.createOne(ada))
    store.dispatch(
      a.optimisticUpdate({ id: 1, patch: { name: 'X' }, txId: 't1' }),
    )
    expect(select.isPending(store.getState(), 1)).toBe(true)
    store.dispatch(a.rollbackOptimistic({ id: 1, txId: 't1' }))
    expect(select.getOne(store.getState(), 1)).toMatchObject({
      name: 'Ada',
      $isDirty: false,
    })
    store.dispatch(
      a.optimisticUpdate({ id: 1, patch: { name: 'Y' }, txId: 't2' }),
    )
    store.dispatch(a.commitOptimistic({ id: 1, txId: 't2' }))
    expect(select.getOne(store.getState(), 1)?.name).toBe('Y')
    expect(select.isPending(store.getState(), 1)).toBe(false)
  })

  test('actions and selectors', () => {
    const { store, select, a } = setup()
    store.dispatch(a.createMany([ada, bob]))
    store.dispatch(a.updateField({ field: 'name', value: 'Ada L.', id: 1 }))
    store.dispatch(a.setActive(1))
    store.dispatch(a.setCurrentById(2))
    const root = store.getState()

    expect(select.getAllIds(root)).toEqual([1, 2])
    expect(select.getOne(root, 1)?.name).toBe('Ada L.')
    expect(select.isDirty(root, 1)).toBe(true)
    expect(select.getActive(root)).toEqual([1])
    expect(select.getCurrentById(root)?.name).toBe('Bob')
    expect(select.getWhereArray(root, (u) => u.age > 30)).toHaveLength(1)

    store.dispatch(a.deleteOne(1))
    expect(select.getAllIds(store.getState())).toEqual([2])
  })

  test('updateOne, current and dirty flags', () => {
    const { store, select, a } = setup()
    store.dispatch(a.createOne(ada))
    store.dispatch(a.updateOne({ id: 1, payload: { ...ada, age: 37 } }))
    store.dispatch(a.setCurrent(ada))
    expect(select.getOne(store.getState(), 1)?.$meta.changedFields).toEqual([
      'age',
    ])
    store.dispatch(a.setIsNotDirty(1))
    expect(select.isDirty(store.getState(), 1)).toBe(false)
    expect(select.getCurrent(store.getState())?.name).toBe('Ada')
  })

  test('state stays serializable and untouched entities keep their reference', () => {
    const { store, a } = setup()
    store.dispatch(a.createMany([ada, bob]))
    const before = store.getState().users.entities.byId[2]
    store.dispatch(a.updateField({ field: 'age', value: 99, id: 1 }))
    const after = store.getState().users
    expect(after.entities.byId[2]).toBe(before)
    expect(JSON.parse(JSON.stringify(after))).toEqual(after)
  })
})

describe('redux memoize option', () => {
  test('getAllArray selector is memoized by default and can be disabled', () => {
    for (const [memoize, same] of [
      [undefined, true],
      [false, false],
    ] as const) {
      const users = createEntitySlice<User>('users', { memoize })
      const store = configureStore({ reducer: { users: users.reducer } })
      store.dispatch(users.actions.createMany([ada, bob]))
      type Root = ReturnType<typeof store.getState>
      const select = users.getSelectors((r: Root) => r.users)
      const s = store.getState()
      const first = select.getAllArray(s)
      const second = select.getAllArray(s)
      expect(Object.is(first, second)).toBe(same)
    }
  })
})

describe('redux setAll / getSortedArray / getByField', () => {
  test('work through the slice and selectors', () => {
    const { store, select, a } = setup()
    store.dispatch(a.createMany([ada]))
    store.dispatch(a.setAll([bob, ada]))
    const root = store.getState()
    expect(select.getAllIds(root)).toEqual([2, 1])
    expect(
      select.getSortedArray(root, { orderBy: 'age' }).map((u) => u.id),
    ).toEqual([2, 1])
    expect(select.getByField(root, 'name', 'Ada').map((u) => u.id)).toEqual([1])
  })
})
