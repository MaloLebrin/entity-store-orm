import { describe, expect, test } from 'vitest'
import {
  createMany,
  setActive,
  setCurrent,
  setCurrentById,
  updateField,
} from './actions.js'
import createState from './createState.js'
import * as g from './getters.js'
import type { WithId } from './types/WithId.js'

interface User extends WithId {
  name: string
  email: string
  age: number
}

const users: User[] = [
  { id: 1, name: 'John', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 },
  { id: 3, name: 'Bob', email: 'bob@test.org', age: 40 },
]

const state = createMany(createState<User>(), users)

describe('basic getters', () => {
  test('collections', () => {
    expect(g.getAllIds(state)).toEqual([1, 2, 3])
    expect(Object.keys(g.getAll(state))).toHaveLength(3)
    expect(g.getAllArray(state).map((u) => u.name)).toEqual([
      'John',
      'Jane',
      'Bob',
    ])
    expect(g.getIsEmpty(state)).toBe(false)
    expect(g.getIsNotEmpty(state)).toBe(true)
    expect(g.getIsEmpty(createState<User>())).toBe(true)
  })

  test('getOne / getMany', () => {
    expect(g.getOne(state, 2)?.name).toBe('Jane')
    expect(g.getOne(state, 99)).toBeUndefined()
    expect(g.getMany(state, [3, 99, 1]).map((u) => u.id)).toEqual([3, 1])
    expect(g.getMany(state, undefined as unknown as number[])).toEqual([])
  })

  test('current / currentById / active', () => {
    let s = setCurrent(state, users[0]!)
    s = setCurrentById(s, 2)
    s = setActive(setActive(s, 3), 1)
    expect(g.getCurrent(s)?.name).toBe('John')
    expect(g.getCurrentById(s)?.name).toBe('Jane')
    expect(g.getActive(s)).toEqual([3, 1])
    expect(g.getFirstActive(s)).toBe(3)
    expect(g.getCurrentById(state)).toBeNull()
    expect(g.getFirstActive(state)).toBeUndefined()
  })

  test('isAlreadyInStore / isAlreadyActive / isDirty', () => {
    expect(g.isAlreadyInStore(state, 1)).toBe(true)
    expect(g.isAlreadyInStore(state, 9)).toBe(false)
    expect(g.isAlreadyActive(setActive(state, 1), 1)).toBe(true)
    expect(g.isDirty(state, 1)).toBe(false)
    expect(g.isDirty(updateField(state, 'age', 31, 1), 1)).toBe(true)
    expect(g.isDirty(state, 99)).toBe(false)
  })
})

describe('filtering', () => {
  test('getWhere returns a dictionary', () => {
    const r = g.getWhere(state, (u) => u.age > 26)
    expect(Object.keys(r)).toEqual(['1', '3'])
    expect(g.getWhere(state)).toBe(state.entities.byId)
  })

  test('getWhereArray filters and sorts', () => {
    expect(g.getWhereArray(state, (u) => u.age > 26).map((u) => u.id)).toEqual([
      1, 3,
    ])
    expect(
      g.getWhereArray(state, () => true, { orderBy: 'age' }).map((u) => u.id),
    ).toEqual([2, 1, 3])
    expect(
      g
        .getWhereArray(state, () => true, { orderBy: 'age', sortBy: 'desc' })
        .map((u) => u.id),
    ).toEqual([3, 1, 2])
    expect(
      g
        .getWhereArray(state, () => true, { orderBy: (u) => u.name })
        .map((u) => u.name),
    ).toEqual(['Bob', 'Jane', 'John'])
    expect(g.getWhereArray(state)).toHaveLength(3)
  })

  test('getFirstWhere', () => {
    expect(g.getFirstWhere(state, (u) => u.age < 30)?.name).toBe('Jane')
    expect(g.getFirstWhere(state, (u) => u.age > 100)).toBeUndefined()
    expect(g.getFirstWhere(state)?.id).toBe(1)
  })

  test('search is case-insensitive over string fields', () => {
    expect(g.search(state, 'JOHN').map((u) => u.id)).toEqual([1])
    expect(g.search(state, 'test.org').map((u) => u.id)).toEqual([3])
    expect(g.search(state, 'zzz')).toEqual([])
  })
})

describe('missing', () => {
  test('getMissingIds dedupes unless asked', () => {
    expect(g.getMissingIds(state, [1, 7, 7, 8])).toEqual([7, 8])
    expect(g.getMissingIds(state, [1, 7, 7], true)).toEqual([7, 7])
    expect(g.getMissingIds(state, [])).toEqual([])
  })

  test('getMissingEntities', () => {
    const extra = { id: 9, name: 'X', email: 'x', age: 1 }
    expect(g.getMissingEntities(state, [users[0]!, extra])).toEqual([extra])
    expect(g.getMissingEntities(state, [])).toEqual([])
  })
})
