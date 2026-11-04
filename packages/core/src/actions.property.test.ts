import { isDeepStrictEqual } from 'node:util'
import fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import * as a from './actions.js'
import createState from './createState.js'
import type { State } from './types/State.js'
import type { Id, WithId } from './types/WithId.js'

interface Item extends WithId {
  name: string
  age: number
}

type Op =
  | { type: 'createOne'; item: Item }
  | { type: 'createMany'; items: Item[] }
  | { type: 'setAll'; items: Item[] }
  | { type: 'updateOne'; id: Id; item: Item }
  | { type: 'updateMany'; items: Item[] }
  | { type: 'updateField'; id: Id; name: string }
  | { type: 'deleteOne'; id: Id }
  | { type: 'deleteMany'; ids: Id[] }
  | { type: 'setCurrent'; item: Item }
  | { type: 'removeCurrent' }
  | { type: 'setCurrentById'; id: Id }
  | { type: 'removeCurrentById' }
  | { type: 'setActive'; id: Id }
  | { type: 'resetActive' }
  | { type: 'setIsDirty'; id: Id }
  | { type: 'setIsNotDirty'; id: Id }

/** Small id pool so that sequences hit existing ids, absent ids and repeats. */
const numberIds = fc.constantFrom<Id>(1, 2, 3, 4, 5, 6)
const stringIds = fc.constantFrom<Id>('a', 'b', 'c', 'd', 'e', 'f')

function opArb(idArb: fc.Arbitrary<Id>): fc.Arbitrary<Op> {
  const item = fc.record({
    id: idArb,
    name: fc.constantFrom('x', 'y', 'z'),
    age: fc.integer({ min: 0, max: 2 }),
  })
  const items = fc.array(item, { maxLength: 5 })
  return fc.oneof(
    fc.record({ type: fc.constant('createOne' as const), item }),
    fc.record({ type: fc.constant('createMany' as const), items }),
    fc.record({ type: fc.constant('setAll' as const), items }),
    fc.record({ type: fc.constant('updateOne' as const), id: idArb, item }),
    fc.record({ type: fc.constant('updateMany' as const), items }),
    fc.record({
      type: fc.constant('updateField' as const),
      id: idArb,
      name: fc.constantFrom('x', 'y', 'z'),
    }),
    fc.record({ type: fc.constant('deleteOne' as const), id: idArb }),
    fc.record({
      type: fc.constant('deleteMany' as const),
      ids: fc.array(idArb, { maxLength: 5 }),
    }),
    fc.record({ type: fc.constant('setCurrent' as const), item }),
    fc.constant<Op>({ type: 'removeCurrent' }),
    fc.record({ type: fc.constant('setCurrentById' as const), id: idArb }),
    fc.constant<Op>({ type: 'removeCurrentById' }),
    fc.record({ type: fc.constant('setActive' as const), id: idArb }),
    fc.constant<Op>({ type: 'resetActive' }),
    fc.record({ type: fc.constant('setIsDirty' as const), id: idArb }),
    fc.record({ type: fc.constant('setIsNotDirty' as const), id: idArb }),
  )
}

function apply(state: State<Item>, op: Op, now: number): State<Item> {
  switch (op.type) {
    case 'createOne':
      return a.createOne(state, op.item, now)
    case 'createMany':
      return a.createMany(state, op.items, now)
    case 'setAll':
      return a.setAll(state, op.items, now)
    case 'updateOne':
      return a.updateOne(state, op.id, op.item, now)
    case 'updateMany':
      return a.updateMany(state, op.items, now)
    case 'updateField':
      return a.updateField(state, 'name', op.name, op.id, now)
    case 'deleteOne':
      return a.deleteOne(state, op.id)
    case 'deleteMany':
      return a.deleteMany(state, op.ids)
    case 'setCurrent':
      return a.setCurrent(state, op.item, now)
    case 'removeCurrent':
      return a.removeCurrent(state)
    case 'setCurrentById':
      return a.setCurrentById(state, op.id)
    case 'removeCurrentById':
      return a.removeCurrentById(state)
    case 'setActive':
      return a.setActive(state, op.id)
    case 'resetActive':
      return a.resetActive(state)
    case 'setIsDirty':
      return a.setIsDirty(state, op.id)
    case 'setIsNotDirty':
      return a.setIsNotDirty(state, op.id)
  }
}

/** Actions documented as "rebuild the entity": they may return an equal-but-new state. */
const REBUILDING = new Set<Op['type']>([
  'createOne',
  'createMany',
  'setAll',
  'setCurrent',
])

function deepFreeze<V>(value: V): V {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value)) deepFreeze(v)
  }
  return value
}

function assertConsistent(state: State<Item>) {
  const { byId, allIds, active, currentById } = state.entities
  expect(new Set(allIds).size, 'allIds has duplicates').toBe(allIds.length)
  expect(new Set(active).size, 'active has duplicates').toBe(active.length)
  // allIds and byId describe the same set of entities.
  expect(allIds.map(String).sort()).toEqual(Object.keys(byId).sort())
  for (const id of allIds) expect(byId[id]?.id).toBe(id)
  for (const id of active) expect(allIds, `orphan active ${id}`).toContain(id)
  if (currentById !== null)
    expect(allIds, `orphan currentById ${currentById}`).toContain(currentById)
}

/** Ids that collide with `Object.prototype` members must behave like any other id. */
const hostileIds = fc.constantFrom<Id>(
  'constructor',
  '__proto__',
  'toString',
  'hasOwnProperty',
  'a',
)

describe.each([
  ['number ids', numberIds],
  ['string ids', stringIds],
  ['prototype-like string ids', hostileIds],
])('actions: random sequences (%s)', (_label, idArb) => {
  const ops = fc.array(opArb(idArb), { maxLength: 30 })

  test('byId / allIds / active / currentById stay consistent', () => {
    fc.assert(
      fc.property(ops, (sequence) => {
        let state = createState<Item>()
        sequence.forEach((op, i) => {
          state = apply(state, op, i)
          assertConsistent(state)
        })
      }),
      { numRuns: 300 },
    )
  })

  test('the previous state is never mutated', () => {
    fc.assert(
      fc.property(ops, (sequence) => {
        let state = deepFreeze(createState<Item>())
        sequence.forEach((op, i) => {
          const snapshot = structuredClone(state)
          // Frozen input: any in-place write throws (modules are strict).
          const next = deepFreeze(apply(state, op, i))
          expect(state).toEqual(snapshot)
          state = next
        })
      }),
      { numRuns: 300 },
    )
  })

  test('a change-free action returns the very same reference', () => {
    fc.assert(
      fc.property(ops, (sequence) => {
        let state = createState<Item>()
        sequence.forEach((op, i) => {
          const next = apply(state, op, i)
          if (!REBUILDING.has(op.type) && isDeepStrictEqual(next, state))
            expect(next, `${op.type} allocated for nothing`).toBe(state)
          state = next
        })
      }),
      { numRuns: 300 },
    )
  })

  test('replaying the same action is idempotent (same reference)', () => {
    const idempotent = new Set<Op['type']>([
      'deleteOne',
      'deleteMany',
      'removeCurrent',
      'removeCurrentById',
      'setCurrentById',
      'setActive',
      'resetActive',
      'setIsDirty',
      'setIsNotDirty',
    ])
    fc.assert(
      fc.property(ops, opArb(idArb), (sequence, last) => {
        let state = createState<Item>()
        sequence.forEach((op, i) => {
          state = apply(state, op, i)
        })
        const once = apply(state, last, 99)
        if (idempotent.has(last.type)) expect(apply(once, last, 100)).toBe(once)
      }),
      { numRuns: 300 },
    )
  })
})
