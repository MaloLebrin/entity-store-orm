import { describe, expect, test, vi } from 'vitest'
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

describe('getAllArray memoization', () => {
  test('same array while byId and allIds are unchanged', () => {
    const first = g.getAllArray(state)
    expect(g.getAllArray(state)).toBe(first)
    // current / active changes do not invalidate it
    const s2 = setActive(setCurrent(state, users[0] as User), 2)
    expect(g.getAllArray(s2)).toBe(first)
  })

  test('new array after an entity changes', () => {
    const first = g.getAllArray(state)
    const s2 = createMany(state, [{ id: 4, name: 'Zed', email: 'z', age: 1 }])
    const next = g.getAllArray(s2)
    expect(next).not.toBe(first)
    expect(next).toHaveLength(4)
    expect(first).toHaveLength(3)
    const s3 = updateField(state, 'name', 'Johnny', 1)
    expect(g.getAllArray(s3)).not.toBe(first)
    expect(g.getAllArray(s3)[0]?.name).toBe('Johnny')
  })

  test('{ memoize: false } rebuilds the array every time', () => {
    const a = g.getAllArray(state, { memoize: false })
    expect(g.getAllArray(state, { memoize: false })).not.toBe(a)
    expect(a).toEqual(g.getAllArray(state))
  })

  test('unfiltered getWhereArray shares the memoized array', () => {
    expect(g.getWhereArray(state)).toBe(g.getAllArray(state))
    // filtered / sorted results are always new arrays
    expect(g.getWhereArray(state, () => true)).not.toBe(g.getAllArray(state))
  })

  test('uncachedGetters never return the shared array', () => {
    expect(g.uncachedGetters.getAllArray(state)).not.toBe(g.getAllArray(state))
    expect(g.uncachedGetters.getWhereArray(state)).not.toBe(
      g.getAllArray(state),
    )
  })

  test('the shared array is frozen outside production', () => {
    const all = g.getAllArray(state)
    expect(Object.isFrozen(all)).toBe(true)
    expect(() => all.sort()).toThrow(TypeError)
    expect(() => all.push(all[0] as never)).toThrow(TypeError)
    // opting out yields a plain, mutable array
    expect(Object.isFrozen(g.getAllArray(state, { memoize: false }))).toBe(
      false,
    )
    // copying then sorting is the supported way
    expect([...all].sort(() => 0)).toHaveLength(3)
  })

  test('the array is not frozen in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    try {
      const prod = await import('./getters.js')
      expect(Object.isFrozen(prod.getAllArray(state))).toBe(false)
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})

describe('getSortedArray', () => {
  test('sorts by field or function and is memoized per ordering', () => {
    const byAge = g.getSortedArray(state, { orderBy: 'age' })
    expect(byAge.map((u) => u.id)).toEqual([2, 1, 3])
    expect(g.getSortedArray(state, { orderBy: 'age' })).toBe(byAge)
    const desc = g.getSortedArray(state, { orderBy: 'age', sortBy: 'desc' })
    expect(desc.map((u) => u.id)).toEqual([3, 1, 2])
    expect(desc).not.toBe(byAge)
    expect(g.getSortedArray(state, { orderBy: 'age' })).toBe(byAge)
    // the shared source array is untouched
    expect(g.getAllArray(state).map((u) => u.id)).toEqual([1, 2, 3])
  })

  test('invalidated by a change, inline functions never hit, no orderBy = getAllArray', () => {
    const first = g.getSortedArray(state, { orderBy: 'name' })
    const s2 = createMany(state, [{ id: 4, name: 'Al', email: 'a', age: 1 }])
    const next = g.getSortedArray(s2, { orderBy: 'name' })
    expect(next).not.toBe(first)
    expect(next.map((u) => u.name)).toEqual(['Al', 'Bob', 'Jane', 'John'])
    const fn = (u: { age: number }) => u.age
    expect(g.getSortedArray(state, { orderBy: fn })).toBe(
      g.getSortedArray(state, { orderBy: fn }),
    )
    expect(g.getSortedArray(state, { orderBy: (u) => u.age })).not.toBe(
      g.getSortedArray(state, { orderBy: (u) => u.age }),
    )
    expect(g.getSortedArray(state, {})).toBe(g.getAllArray(state))
  })

  test('keeps at most 4 orderings per collection and can be uncached', () => {
    const keys = ['id', 'name', 'email', 'age', 'id'] as const
    const first = g.getSortedArray(state, { orderBy: 'id', sortBy: 'desc' })
    for (const k of keys) g.getSortedArray(state, { orderBy: k })
    expect(g.getSortedArray(state, { orderBy: 'id', sortBy: 'desc' })).toEqual(
      first,
    )
    const u = g.uncachedGetters.getSortedArray(state, { orderBy: 'age' })
    expect(u).not.toBe(
      g.uncachedGetters.getSortedArray(state, { orderBy: 'age' }),
    )
    expect(Object.isFrozen(u)).toBe(false)
  })
})

describe('getByField', () => {
  const s = createMany(state, [
    { id: 4, name: 'Jane', email: 'jane2@example.com', age: 25 },
  ])

  test('returns matching entities in allIds order, via a memoized index', () => {
    const janes = g.getByField(s, 'name', 'Jane')
    expect(janes.map((u) => u.id)).toEqual([2, 4])
    expect(g.getByField(s, 'name', 'Jane')).toBe(janes)
    expect(g.getByField(s, 'age', 25).map((u) => u.id)).toEqual([2, 4])
    expect(g.getByField(s, 'age', 99)).toEqual([])
    expect(g.getByField(s, 'age', 99)).toBe(g.getByField(s, 'name', 'nobody'))
  })

  test('rebuilds after a change and matches getWhereArray', () => {
    const before = g.getByField(s, 'name', 'Jane')
    const s2 = updateField(s, 'name', 'Jane', 1)
    const after = g.getByField(s2, 'name', 'Jane')
    expect(after).not.toBe(before)
    expect(after.map((u) => u.id)).toEqual([1, 2, 4])
    expect(after).toEqual(g.getWhereArray(s2, (u) => u.name === 'Jane'))
  })

  test('uncachedGetters give fresh, equal results', () => {
    const a = g.uncachedGetters.getByField(s, 'name', 'Jane')
    expect(a).toEqual(g.getByField(s, 'name', 'Jane'))
    expect(a).not.toBe(g.uncachedGetters.getByField(s, 'name', 'Jane'))
  })
})

describe('getWhereArray with a stable filter', () => {
  const adults = (u: { age: number }) => u.age >= 30

  test('reuses the last result for the same filter and ordering', () => {
    const first = g.getWhereArray(state, adults)
    expect(g.getWhereArray(state, adults)).toBe(first)
    const sorted = g.getWhereArray(state, adults, { orderBy: 'age' })
    expect(sorted).not.toBe(first)
    expect(g.getWhereArray(state, adults, { orderBy: 'age' })).toBe(sorted)
  })

  test('inline filters, other states and uncached calls never reuse it', () => {
    const first = g.getWhereArray(state, adults)
    expect(g.getWhereArray(state, (u) => u.age >= 30)).not.toBe(first)
    const s2 = createMany(state, [{ id: 9, name: 'Z', email: 'z', age: 50 }])
    expect(g.getWhereArray(s2, adults).map((u) => u.id)).toEqual([1, 3, 9])
    expect(g.uncachedGetters.getWhereArray(state, adults)).not.toBe(
      g.uncachedGetters.getWhereArray(state, adults),
    )
  })
})
