import type { WithId } from '@entity-store/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, expectTypeOf, test } from 'vitest'
import { computed, ref } from 'vue'
import { defineEntityStore } from './index.js'

interface User extends WithId {
  name: string
  age: number
}

const ada: User = { id: 1, name: 'Ada', age: 36 }
const bob: User = { id: 2, name: 'Bob', age: 25 }

describe('defineEntityStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  test('initial state has the normalized shape', () => {
    const store = defineEntityStore<User>('users')()
    expect(store.entities).toEqual({
      byId: {},
      allIds: [],
      current: null,
      currentById: null,
      active: [],
    })
    expect(store.getIsEmpty()).toBe(true)
  })

  test('stores are isolated per id', () => {
    const a = defineEntityStore<User>('a')()
    const b = defineEntityStore<User>('b')()
    a.createOne(ada)
    expect(b.getIsEmpty()).toBe(true)
  })

  test('create, read, update, delete', () => {
    const store = defineEntityStore<User>('users')()
    store.createMany([ada, bob])
    expect(store.getAllIds()).toEqual([1, 2])
    expect(store.getOne(1)?.name).toBe('Ada')

    store.updateField('name', 'Ada L.', 1)
    expect(store.getOne(1)?.name).toBe('Ada L.')
    expect(store.isDirty(1)).toBe(true)
    expect(store.getOne(1)?.$meta.changedFields).toEqual(['name'])

    store.setIsNotDirty(1)
    expect(store.isDirty(1)).toBe(false)

    store.deleteOne(1)
    expect(store.getAllIds()).toEqual([2])
  })

  test('current, currentById and active', () => {
    const store = defineEntityStore<User>('users')()
    store.createMany([ada, bob])
    store.setCurrent(ada)
    store.setCurrentById(2)
    store.setActive(1)
    store.setActive(99)
    expect(store.getCurrent()?.name).toBe('Ada')
    expect(store.getCurrentById()?.name).toBe('Bob')
    expect(store.getActive()).toEqual([1])
    store.resetActive()
    expect(store.getActive()).toEqual([])
  })

  test('filtering and sorting', () => {
    const store = defineEntityStore<User>('users')()
    store.createMany([ada, bob])
    expect(store.getWhereArray((u) => u.age > 30).map((u) => u.id)).toEqual([1])
    expect(
      store.getWhereArray(null, { orderBy: 'age' }).map((u) => u.id),
    ).toEqual([1, 2])
    expect(store.search('bo')).toHaveLength(1)
  })

  test('the entities object is replaced, never mutated', () => {
    const store = defineEntityStore<User>('users')()
    const before = store.entities
    store.createOne(ada)
    expect(store.entities).not.toBe(before)
    expect(before.allIds).toEqual([])
  })

  test('getters are reactive', () => {
    const store = defineEntityStore<User>('users')()
    const count = computed(() => store.getAllIds().length)
    expect(count.value).toBe(0)
    store.createOne(ada)
    expect(count.value).toBe(1)
  })
})

describe('extend', () => {
  beforeEach(() => setActivePinia(createPinia()))

  test('adds typed state, getters and actions', () => {
    const useStore = defineEntityStore<User>()('users', {
      extend: (base) => {
        const isLoading = ref(false)
        const oldest = computed(
          () => [...base.getAllArray()].sort((x, y) => y.age - x.age)[0],
        )
        function load(users: User[]) {
          isLoading.value = true
          base.createMany(users)
          isLoading.value = false
        }
        return { isLoading, oldest, load }
      },
    })

    const store = useStore()
    store.load([ada, bob])
    expect(store.oldest?.name).toBe('Ada')
    expect(store.isLoading).toBe(false)
    expect(store.getAllIds()).toEqual([1, 2])
    expectTypeOf(store.isLoading).toEqualTypeOf<boolean>()
    expectTypeOf(store.load).parameters.toEqualTypeOf<[User[]]>()
    expectTypeOf(store.createOne).parameter(0).toEqualTypeOf<User>()
  })
})

describe('pinia memoize option', () => {
  beforeEach(() => setActivePinia(createPinia()))

  test('getAllArray is memoized by default and can be disabled', () => {
    const on = defineEntityStore<User>('memo-on')()
    on.createMany([ada, bob])
    expect(on.getAllArray()).toBe(on.getAllArray())

    const off = defineEntityStore<User>()('memo-off', { memoize: false })()
    off.createMany([ada, bob])
    expect(off.getAllArray()).not.toBe(off.getAllArray())
  })
})
