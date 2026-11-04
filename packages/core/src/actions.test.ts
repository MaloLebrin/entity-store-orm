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

  test('setIsNotDirty on a clean entity returns the same state', () => {
    const s = seeded()
    expect(a.setIsNotDirty(s, 1)).toBe(s)
  })
})

describe('delete clears dangling pointers', () => {
  test('deleteOne resets currentById and current of the removed entity', () => {
    let s = a.setCurrentById(a.setCurrent(seeded(), john), 1)
    s = a.deleteOne(s, 1)
    expect(s.entities.currentById).toBeNull()
    expect(s.entities.current).toBeNull()
  })

  test('deleteOne keeps pointers to other entities', () => {
    const s = a.deleteOne(a.setCurrentById(seeded(), 2), 1)
    expect(s.entities.currentById).toBe(2)
  })

  test('deleteMany resets currentById and current of removed entities', () => {
    let s = a.setCurrentById(a.setCurrent(seeded(), john), 1)
    s = a.deleteMany(s, [1, 42])
    expect(s.entities.currentById).toBeNull()
    expect(s.entities.current).toBeNull()
  })
})

describe('ids that look like Object.prototype members', () => {
  test('are not mistaken for stored entities', () => {
    const s = empty()
    for (const id of ['constructor', 'toString', '__proto__']) {
      expect(a.setActive(s, id)).toBe(s)
      expect(a.setCurrentById(s, id)).toBe(s)
      expect(a.setIsDirty(s, id)).toBe(s)
      expect(a.setIsNotDirty(s, id)).toBe(s)
      expect(a.updateField(s, 'name', 'x', id)).toBe(s)
    }
  })

  test('createMany / setAll / updateMany store "__proto__" as a regular id', () => {
    const item = { id: '__proto__', name: 'P', age: 1 }
    for (const s of [
      a.createMany(empty(), [item]),
      a.setAll(empty(), [item]),
      a.updateMany(empty(), [item]),
    ]) {
      expect(s.entities.allIds).toEqual(['__proto__'])
      expect(Object.keys(s.entities.byId)).toEqual(['__proto__'])
      expect(Object.getPrototypeOf(s.entities.byId)).toBe(Object.prototype)
      expect(a.deleteMany(s, ['__proto__']).entities.allIds).toEqual([])
    }
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
      a.setIsNotDirty(a.setIsDirty(before, 1), 1),
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

describe('batch actions match their single-entity counterparts', () => {
  interface Item extends WithId {
    name: string
  }
  const NOW = 1000
  const seeded = (): State<Item> =>
    a.setActive(
      a.createMany(
        createState<Item>(),
        [1, 2, 3, 4].map((id) => ({ id, name: `n${id}` })),
        NOW,
      ),
      2,
    )

  test('createMany: new ids, existing ids and duplicates in the payload', () => {
    const payload: Item[] = [
      { id: 5, name: 'new' },
      { id: 2, name: 'replaced' },
      { id: 5, name: 'dup' },
      { id: 6, name: 'six' },
    ]
    const expected = payload.reduce(
      (s, e) => a.createOne(s, e, NOW + 1),
      seeded(),
    )
    expect(a.createMany(seeded(), payload, NOW + 1)).toEqual(expected)
  })

  test('updateMany: patch, no-op, missing id and duplicates', () => {
    const payload: Item[] = [
      { id: 1, name: 'patched' },
      { id: 3, name: 'n3' }, // unchanged
      { id: 9, name: 'created' }, // missing: created
      { id: 9, name: 'created again' },
      { id: 1, name: 'patched twice' },
    ]
    const expected = payload.reduce(
      (s, e) => a.updateOne(s, e.id, e, NOW + 1),
      seeded(),
    )
    expect(a.updateMany(seeded(), payload, NOW + 1)).toEqual(expected)
  })

  test('deleteMany: present, absent and repeated ids; clears active', () => {
    const ids = [2, 4, 4, 42]
    const expected = ids.reduce((s, id) => a.deleteOne(s, id), seeded())
    const got = a.deleteMany(seeded(), ids)
    expect(got).toEqual(expected)
    expect(got.entities.active).toEqual([])
  })

  test('empty and no-op batches return the same state reference', () => {
    const s = seeded()
    expect(a.createMany(s, [])).toBe(s)
    expect(a.updateMany(s, [])).toBe(s)
    expect(a.deleteMany(s, [])).toBe(s)
    expect(a.deleteMany(s, [42, 43])).toBe(s)
    expect(a.updateMany(s, [{ id: 1, name: 'n1' }], NOW)).toBe(s)
  })

  test('inputs are never mutated', () => {
    const s = seeded()
    const before = JSON.stringify(s)
    a.createMany(s, [{ id: 7, name: 'x' }])
    a.updateMany(s, [{ id: 1, name: 'y' }])
    a.deleteMany(s, [1, 2])
    expect(JSON.stringify(s)).toBe(before)
  })

  test('scales linearly: 50k entities in well under a second', () => {
    const items = Array.from({ length: 50_000 }, (_, i) => ({
      id: i + 1,
      name: `u${i}`,
    }))
    const start = performance.now()
    const s = a.createMany(createState<Item>(), items)
    a.updateMany(
      s,
      items.map((e) => ({ ...e, name: `${e.name}!` })),
    )
    a.deleteMany(
      s,
      items.map((e) => e.id),
    )
    expect(performance.now() - start).toBeLessThan(2000)
  })
})

describe('setAll', () => {
  test('replaces the collection with clean entities', () => {
    const s = a.setAll(
      a.updateOne(seeded(), 1, { ...john, name: 'X' }, 150),
      [
        { id: 2, name: 'Janet', age: 26 },
        { id: 3, name: 'Bob', age: 40 },
      ],
      300,
    )
    expect(s.entities.allIds).toEqual([2, 3])
    expect(Object.keys(s.entities.byId)).toEqual(['2', '3'])
    expect(s.entities.byId[2]).toMatchObject({
      name: 'Janet',
      $isDirty: false,
      $meta: { changedFields: [], createdAt: 300, updatedAt: null },
    })
  })

  test('keeps active/current only while they still exist', () => {
    let s = a.setActive(a.setActive(seeded(), 1), 2)
    s = a.setCurrentById(a.setCurrent(s, john), 1)
    const next = a.setAll(s, [{ id: 1, name: 'Johnny', age: 31 }], 400)
    expect(next.entities.active).toEqual([1])
    expect(next.entities.currentById).toBe(1)
    expect(next.entities.current?.name).toBe('Johnny')

    const gone = a.setAll(s, [jane], 400)
    expect(gone.entities.active).toEqual([2])
    expect(gone.entities.current).toBeNull()
    expect(gone.entities.currentById).toBeNull()
  })

  test('deduplicates ids (last one wins), empty payload empties the store, no mutation', () => {
    const s = a.setAll(seeded(), [john, { ...john, name: 'Last' }], 1)
    expect(s.entities.allIds).toEqual([1])
    expect(s.entities.byId[1]?.name).toBe('Last')
    expect(a.setAll(seeded(), []).entities.allIds).toEqual([])
    const frozen = freeze(seeded())
    expect(() => a.setAll(frozen, [john])).not.toThrow()
  })
})

describe('addOne / addMany / upsert / removeAll', () => {
  interface U {
    id: number
    name: string
    age?: number
  }
  const base = () => a.createMany(createState<U>(), [{ id: 1, name: 'Ada' }], 1)

  test('addMany skips stored ids and keeps their copy', () => {
    const s = a.addMany(
      base(),
      [
        { id: 1, name: 'X' },
        { id: 2, name: 'Bob' },
      ],
      2,
    )
    expect(s.entities.allIds).toEqual([1, 2])
    expect(s.entities.byId[1]?.name).toBe('Ada')
    expect(s.entities.byId[2]?.name).toBe('Bob')
  })

  test('addOne returns the same state for a known id', () => {
    const s = base()
    expect(a.addOne(s, { id: 1, name: 'X' })).toBe(s)
  })

  test('upsertOne merges without marking dirty and keeps createdAt', () => {
    const s = a.upsertOne(base(), { id: 1, name: 'Ada L.', age: 36 }, 9)
    const e = s.entities.byId[1]
    expect(e?.name).toBe('Ada L.')
    expect(e?.age).toBe(36)
    expect(e?.$isDirty).toBe(false)
    expect(e?.$meta.createdAt).toBe(1)
    expect(s.entities.allIds).toEqual([1])
  })

  test('upsertMany creates unknown ids and returns the same state when unchanged', () => {
    const s = a.upsertMany(base(), [{ id: 2, name: 'Bob' }], 3)
    expect(s.entities.allIds).toEqual([1, 2])
    expect(a.upsertMany(s, [{ id: 2, name: 'Bob' }])).toBe(s)
  })

  test('removeAll empties everything and is idempotent', () => {
    let s = a.setActive(base(), 1)
    s = a.setCurrentById(s, 1)
    const empty = a.removeAll(s)
    expect(empty.entities.byId).toEqual({})
    expect(empty.entities.allIds).toEqual([])
    expect(empty.entities.active).toEqual([])
    expect(empty.entities.currentById).toBeNull()
    expect(a.removeAll(empty)).toBe(empty)
  })
})
