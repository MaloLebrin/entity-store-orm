import { describe, expect, expectTypeOf, test } from 'vitest'
import type { EntityWithMeta, Id, State } from './index.js'
import { createEntityApi, createState } from './index.js'

interface User {
  id: number
  name: string
  role?: 'admin' | 'user'
}

// These assertions are checked by `tsc` (pnpm type-check); the runtime body only keeps vitest happy.
describe('public types', () => {
  test('createEntityApi infers the entity type', () => {
    const state = createState<User>()
    expectTypeOf(state).toEqualTypeOf<State<User>>()

    const { actions, getters } = createEntityApi<User>({
      get: () => state,
      set: () => {},
    })
    expectTypeOf(getters.getAllArray).returns.toEqualTypeOf<
      EntityWithMeta<User>[]
    >()
    expectTypeOf(getters.getOne).parameter(0).toEqualTypeOf<Id>()
    expectTypeOf(getters.getOne).returns.toEqualTypeOf<
      EntityWithMeta<User> | undefined
    >()
    expectTypeOf(actions.createOne).parameter(0).toEqualTypeOf<User>()
    expectTypeOf(actions.upsertMany).parameter(0).toEqualTypeOf<User[]>()
    expectTypeOf(actions.removeAll).parameters.toEqualTypeOf<[]>()
    expectTypeOf(actions.updateField<'name'>)
      .parameter(1)
      .toEqualTypeOf<string>()
    expect(true).toBe(true)
  })

  test('filters accept predicates and object filters', () => {
    const { getters } = createEntityApi<User>({
      get: () => createState<User>(),
      set: () => {},
    })
    getters.getWhereArray((u) => u.name === 'Ada')
    getters.getWhereArray({ role: 'admin' })
    // @ts-expect-error unknown key in an object filter
    getters.getWhereArray({ nope: 1 })
    // @ts-expect-error wrong value type
    getters.getWhereArray({ role: 'root' })
    // @ts-expect-error entities need an id
    createEntityApi<{ name: string }>({
      get: () => createState(),
      set: () => {},
    })
    expect(true).toBe(true)
  })
})
