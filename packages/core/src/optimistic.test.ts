import { describe, expect, test, vi } from 'vitest'
import * as a from './actions.js'
import { createEntityApi } from './createEntityApi.js'
import createState from './createState.js'
import * as o from './optimistic.js'
import type { State } from './types/State.js'
import type { WithId } from './types/WithId.js'

interface User extends WithId {
  name: string
  age: number
}

const john: User = { id: 1, name: 'John', age: 30 }
const seeded = (): State<User> => a.createOne(createState<User>(), john, 100)
const user = (s: State<User>) => s.entities.byId[1]!

describe('optimisticUpdate', () => {
  test('applies the patch and records how to undo it', () => {
    const s = o.optimisticUpdate(seeded(), 1, { name: 'Johnny' }, 'a', 200)
    expect(user(s).name).toBe('Johnny')
    expect(user(s).$isDirty).toBe(true)
    expect(user(s).$meta.changedFields).toEqual(['name'])
    expect(user(s).$meta.pending).toEqual([
      {
        txId: 'a',
        fields: [
          {
            key: 'name',
            previous: 'John',
            applied: 'Johnny',
            wasChanged: false,
          },
        ],
        wasDirty: false,
        updatedAtBefore: null,
      },
    ])
    expect(o.isPending(s, 1)).toBe(true)
  })

  test('is a no-op for a missing entity, an empty patch or a known txId', () => {
    const s = seeded()
    expect(o.optimisticUpdate(s, 9, { name: 'x' }, 'a')).toBe(s)
    expect(o.optimisticUpdate(s, 1, { name: 'John' }, 'a')).toBe(s)
    const p = o.optimisticUpdate(s, 1, { name: 'x' }, 'a')
    expect(o.optimisticUpdate(p, 1, { name: 'y' }, 'a')).toBe(p)
  })

  test('does not mutate its input', () => {
    const s = seeded()
    const before = JSON.stringify(s)
    o.optimisticUpdate(s, 1, { name: 'x' }, 'a')
    expect(JSON.stringify(s)).toBe(before)
  })
})

describe('commitOptimistic', () => {
  test('keeps the values and drops the record', () => {
    let s = o.optimisticUpdate(seeded(), 1, { name: 'Johnny' }, 'a')
    s = o.commitOptimistic(s, 1, 'a')
    expect(user(s).name).toBe('Johnny')
    expect(user(s).$isDirty).toBe(true)
    expect('pending' in user(s).$meta).toBe(false)
    expect(o.isPending(s, 1)).toBe(false)
  })

  test('unknown ids are no-ops', () => {
    const s = seeded()
    expect(o.commitOptimistic(s, 1, 'nope')).toBe(s)
    expect(o.commitOptimistic(s, 9, 'a')).toBe(s)
  })
})

describe('rollbackOptimistic', () => {
  test('restores values, dirty flag, changedFields and updatedAt', () => {
    const base = seeded()
    let s = o.optimisticUpdate(base, 1, { name: 'Johnny', age: 31 }, 'a', 200)
    s = o.rollbackOptimistic(s, 1, 'a')
    expect(user(s)).toEqual(user(base))
  })

  test('keeps pre-existing dirty tracking', () => {
    let s = a.updateField(seeded(), 'name', 'Edited', 1, 150)
    const before = user(s)
    s = o.optimisticUpdate(s, 1, { name: 'Johnny', age: 31 }, 'a', 200)
    expect(user(s).$meta.changedFields).toEqual(['name', 'age'])
    s = o.rollbackOptimistic(s, 1, 'a')
    expect(user(s)).toEqual(before)
    expect(user(s).$meta.changedFields).toEqual(['name'])
  })

  test('rolling back the latest of two stacked updates', () => {
    let s = o.optimisticUpdate(seeded(), 1, { name: 'B' }, 'a', 200)
    s = o.optimisticUpdate(s, 1, { name: 'C' }, 'b', 300)
    s = o.rollbackOptimistic(s, 1, 'b')
    expect(user(s).name).toBe('B')
    expect(user(s).$isDirty).toBe(true)
    expect(user(s).$meta.updatedAt).toBe(200)
    expect(user(s).$meta.pending?.map((p) => p.txId)).toEqual(['a'])
  })

  test('rolling back the earlier of two stacked updates keeps the later value', () => {
    let s = o.optimisticUpdate(seeded(), 1, { name: 'B' }, 'a', 200)
    s = o.optimisticUpdate(s, 1, { name: 'C' }, 'b', 300)
    s = o.rollbackOptimistic(s, 1, 'a')
    expect(user(s).name).toBe('C')
    // the later update now undoes straight back to the original value
    s = o.rollbackOptimistic(s, 1, 'b')
    expect(user(s).name).toBe('John')
    expect(user(s).$isDirty).toBe(false)
    expect(user(s).$meta.changedFields).toEqual([])
    expect(user(s).$meta.updatedAt).toBeNull()
  })

  test('leaves a field changed by something else since', () => {
    let s = o.optimisticUpdate(seeded(), 1, { name: 'B' }, 'a')
    s = a.updateField(s, 'name', 'Other', 1)
    s = o.rollbackOptimistic(s, 1, 'a')
    expect(user(s).name).toBe('Other')
    expect(user(s).$meta.changedFields).toEqual(['name'])
  })

  test('unrelated fields roll back independently', () => {
    let s = o.optimisticUpdate(seeded(), 1, { name: 'B' }, 'a')
    s = o.optimisticUpdate(s, 1, { age: 40 }, 'b')
    s = o.rollbackOptimistic(s, 1, 'a')
    expect(user(s)).toMatchObject({ name: 'John', age: 40, $isDirty: true })
    expect(user(s).$meta.changedFields).toEqual(['age'])
  })

  test('unknown txId or deleted entity are no-ops', () => {
    const s = seeded()
    expect(o.rollbackOptimistic(s, 1, 'nope')).toBe(s)
    const p = o.optimisticUpdate(s, 1, { name: 'x' }, 'a')
    const gone = a.deleteOne(p, 1)
    expect(o.rollbackOptimistic(gone, 1, 'a')).toBe(gone)
  })

  test('state stays JSON-serializable', () => {
    const s = o.optimisticUpdate(seeded(), 1, { name: 'x' }, 'a')
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })
})

describe('bound API and withOptimisticUpdate', () => {
  function setup() {
    let state = seeded()
    const api = createEntityApi<User>({
      get: () => state,
      set: (next) => {
        state = next
      },
    })
    return { api, read: () => state }
  }

  test('actions and isPending are bound', () => {
    const { api } = setup()
    api.actions.optimisticUpdate(1, { name: 'x' }, 'a')
    expect(api.getters.isPending(1)).toBe(true)
    api.actions.rollbackOptimistic(1, 'a')
    expect(api.getters.isPending(1)).toBe(false)
    expect(api.getters.getOne(1)?.name).toBe('John')
  })

  test('commits when the request succeeds', async () => {
    const { api } = setup()
    const seen: boolean[] = []
    const result = await o.withOptimisticUpdate(
      api.actions,
      1,
      { name: 'x' },
      async () => {
        seen.push(api.getters.isPending(1))
        return 'ok'
      },
    )
    expect(result).toBe('ok')
    expect(seen).toEqual([true])
    expect(api.getters.getOne(1)?.name).toBe('x')
    expect(api.getters.isPending(1)).toBe(false)
  })

  test('rolls back and rethrows when the request fails', async () => {
    const { api } = setup()
    const boom = new Error('boom')
    const request = vi.fn().mockRejectedValue(boom)
    await expect(
      o.withOptimisticUpdate(api.actions, 1, { name: 'x' }, request),
    ).rejects.toBe(boom)
    expect(api.getters.getOne(1)?.name).toBe('John')
    expect(api.getters.isDirty(1)).toBe(false)
    expect(api.getters.isPending(1)).toBe(false)
  })
})
