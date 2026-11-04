import { describe, expect, test } from 'vitest'
import * as a from './actions.js'
import createState from './createState.js'
import type { State } from './types/State.js'
import type { WithId } from './types/WithId.js'

interface User extends WithId {
  name: string
  age: number
}

const john: User = { id: 1, name: 'John', age: 30 }
const jane: User = { id: 2, name: 'Jane', age: 25 }

const empty = (): State<User> => createState<User>()
const seeded = (): State<User> => a.createMany(empty(), [john, jane], 100)

/** Deep-freeze so any accidental mutation throws in strict mode. */
function freeze<V>(value: V): V {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value)) freeze(v)
  }
  return value
}

describe('createOne / createMany', () => {
  test('adds a clean entity with metadata', () => {
    const s = a.createOne(empty(), john, 100)
    const e = s.entities.byId[1]!
    expect(e).toMatchObject({ ...john, $isDirty: false })
    expect(e.$meta).toEqual({
      changedFields: [],
      createdAt: 100,
      updatedAt: null,
    })
    expect(s.entities.allIds).toEqual([1])
  })

  test('does not duplicate ids and replaces the entity', () => {
    let s = a.createOne(empty(), john)
    s = a.updateOne(s, 1, { ...john, name: 'Johnny' })
    s = a.createOne(s, { ...john, name: 'Fresh' })
    expect(s.entities.allIds).toEqual([1])
    expect(s.entities.byId[1]?.name).toBe('Fresh')
    expect(s.entities.byId[1]?.$isDirty).toBe(false)
  })

  test('createMany adds all, in order', () => {
    expect(seeded().entities.allIds).toEqual([1, 2])
  })
})

describe('updateOne / updateMany / updateField', () => {
  test('marks changed fields, dirty flag and updatedAt', () => {
    const s = a.updateOne(seeded(), 1, { ...john, name: 'Johnny' }, 200)
    const e = s.entities.byId[1]!
    expect(e.name).toBe('Johnny')
    expect(e.$isDirty).toBe(true)
    expect(e.$meta.changedFields).toEqual(['name'])
    expect(e.$meta.updatedAt).toBe(200)
    expect(e.$meta.createdAt).toBe(100)
  })

  test('accumulates changed fields without duplicates', () => {
    let s = a.updateField(seeded(), 'name', 'A', 1)
    s = a.updateField(s, 'age', 31, 1)
    s = a.updateField(s, 'name', 'B', 1)
    expect(s.entities.byId[1]?.$meta.changedFields).toEqual(['name', 'age'])
  })

  test('is a no-op (same reference) when values are unchanged', () => {
    const s = seeded()
    expect(a.updateOne(s, 1, john)).toBe(s)
    expect(a.updateField(s, 'name', 'John', 1)).toBe(s)
  })

  test('creates the entity when missing', () => {
    const s = a.updateOne(empty(), 1, john)
    expect(s.entities.byId[1]?.name).toBe('John')
    expect(s.entities.byId[1]?.$isDirty).toBe(false)
  })

  test('updateMany updates every entity', () => {
    const s = a.updateMany(
      seeded(),
      [
        { id: 1, name: 'X', age: 1 },
        { id: 2, name: 'Y', age: 2 },
      ],
      300,
    )
    expect(s.entities.byId[1]?.name).toBe('X')
    expect(s.entities.byId[2]?.age).toBe(2)
  })

  test('updateField ignores unknown ids and never changes the id', () => {
    const s = seeded()
    expect(a.updateField(s, 'name', 'Z', 99)).toBe(s)
    expect(
      a.updateOne(s, 1, { ...john, id: 5, name: 'N' }).entities.byId[1]?.id,
    ).toBe(1)
  })
})

describe('deleteOne / deleteMany', () => {
  test('removes from byId, allIds and active', () => {
    let s = a.setActive(seeded(), 1)
    s = a.deleteOne(s, 1)
    expect(s.entities.byId[1]).toBeUndefined()
    expect(s.entities.allIds).toEqual([2])
    expect(s.entities.active).toEqual([])
  })

  test('unknown id is a no-op', () => {
    const s = seeded()
    expect(a.deleteOne(s, 99)).toBe(s)
  })

  test('deleteMany', () => {
    expect(a.deleteMany(seeded(), [1, 2]).entities.allIds).toEqual([])
  })
})

describe('current / currentById / active', () => {
  test('setCurrent / removeCurrent', () => {
    let s = a.setCurrent(empty(), john)
    expect(s.entities.current?.name).toBe('John')
    s = a.removeCurrent(s)
    expect(s.entities.current).toBeNull()
  })

  test('setCurrentById only for known ids', () => {
    const s = seeded()
    expect(a.setCurrentById(s, 99)).toBe(s)
    const next = a.setCurrentById(s, 2)
    expect(next.entities.currentById).toBe(2)
    expect(a.removeCurrentById(next).entities.currentById).toBeNull()
  })

  test('setActive only for known, not already active ids; resetActive', () => {
    let s = a.setActive(seeded(), 1)
    expect(a.setActive(s, 1)).toBe(s)
    expect(a.setActive(s, 99)).toBe(s)
    s = a.setActive(s, 2)
    expect(s.entities.active).toEqual([1, 2])
    expect(a.resetActive(s).entities.active).toEqual([])
  })
})

describe('dirty flags', () => {
  test('setIsDirty / setIsNotDirty', () => {
    let s = a.setIsDirty(seeded(), 1)
    expect(s.entities.byId[1]?.$isDirty).toBe(true)
    s = a.updateField(s, 'name', 'Q', 1)
    s = a.setIsNotDirty(s, 1)
    expect(s.entities.byId[1]?.$isDirty).toBe(false)
    expect(s.entities.byId[1]?.$meta.changedFields).toEqual([])
  })

  test('unknown ids are no-ops', () => {
    const s = seeded()
    expect(a.setIsDirty(s, 99)).toBe(s)
    expect(a.setIsNotDirty(s, 99)).toBe(s)
  })
})

describe('immutability', () => {
  test('no action mutates its input and untouched entities are shared', () => {
    const before = freeze(seeded())
    const snapshot = structuredClone(before)

    const results = [
      a.createOne(before, { id: 3, name: 'C', age: 3 }),
      a.updateOne(before, 1, { ...john, name: 'N' }),
      a.updateField(before, 'age', 99, 2),
      a.deleteOne(before, 1),
      a.setActive(before, 1),
      a.setCurrent(before, john),
      a.setCurrentById(before, 1),
      a.setIsDirty(before, 1),
      a.setIsNotDirty(before, 1),
    ]

    expect(before).toEqual(snapshot)
    for (const r of results) expect(r).not.toBe(before)

    const updated = a.updateOne(before, 1, { ...john, name: 'N' })
    expect(updated.entities.byId[2]).toBe(before.entities.byId[2])
  })

  test('state stays plain JSON-serializable', () => {
    const s = a.updateField(seeded(), 'name', 'Z', 1)
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })
})
