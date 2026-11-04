import { describe, expect, test } from 'vitest'
import { createEntityApi } from './createEntityApi.js'
import createState from './createState.js'
import type { State } from './types/State.js'
import type { WithId } from './types/WithId.js'

interface User extends WithId {
  name: string
}

describe('createEntityApi', () => {
  test('binds actions and getters to a state container', () => {
    let state: State<User> = createState<User>()
    const { actions, getters } = createEntityApi<User>({
      get: () => state,
      set: (next) => {
        state = next
      },
    })

    actions.createOne({ id: 1, name: 'A' })
    actions.updateField('name', 'B', 1)
    actions.setActive(1)

    expect(getters.getOne(1)?.name).toBe('B')
    expect(getters.isDirty(1)).toBe(true)
    expect(getters.getActive()).toEqual([1])
    expect(getters.search('b')).toHaveLength(1)
  })
})

describe('createEntityApi memoize option', () => {
  const make = (memoize?: boolean) => {
    let state: State<User> = createState<User>()
    const api = createEntityApi<User>({
      get: () => state,
      set: (next) => {
        state = next
      },
      memoize,
    })
    api.actions.createMany([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ])
    return api
  }

  test('memoized by default', () => {
    const { getters } = make()
    expect(getters.getAllArray()).toBe(getters.getAllArray())
    expect(getters.getWhereArray()).toBe(getters.getAllArray())
  })

  test('memoize: false rebuilds the arrays but returns equal data', () => {
    const { getters } = make(false)
    expect(getters.getAllArray()).not.toBe(getters.getAllArray())
    expect(getters.getAllArray()).toEqual(getters.getAllArray())
    expect(getters.getWhereArray()).not.toBe(getters.getAllArray())
    expect(getters.getWhereArray((u) => u.name === 'B')).toHaveLength(1)
  })

  test('object filters: memoized by value, fresh with memoize: false', () => {
    const on = make().getters
    expect(on.getWhereArray({ name: 'B' })).toBe(
      on.getWhereArray({ name: 'B' }),
    )
    expect(on.getFirstWhere({ name: 'B' })?.id).toBe(2)
    expect(on.getWhere({ name: 'B' })).toBe(on.getWhere({ name: 'B' }))

    const off = make(false).getters
    expect(off.getWhereArray({ name: 'B' })).not.toBe(
      off.getWhereArray({ name: 'B' }),
    )
    expect(off.getWhereArray({ name: 'B' }).map((u) => u.id)).toEqual([2])
    expect(off.getWhere({ name: 'B' })).not.toBe(off.getWhere({ name: 'B' }))
    expect(off.getFirstWhere({ name: 'B' })?.id).toBe(2)
  })
})
