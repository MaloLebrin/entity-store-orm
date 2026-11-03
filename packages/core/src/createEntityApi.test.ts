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
