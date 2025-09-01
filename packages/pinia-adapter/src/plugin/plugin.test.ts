import type { WithId } from '@entity-store/core'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { createApp } from 'vue'
import { entityStorePlugin } from './plugin'

// Test interface
interface TestEntity extends WithId {
  name: string
  value: number
}

describe('Entity Store Plugin', () => {
  let useTestStore: ReturnType<typeof defineStore>
  const app = createApp({})

  beforeEach(() => {
    const pinia = createPinia().use(entityStorePlugin)
    app.use(pinia)
    setActivePinia(pinia)

    // Define the store AFTER plugin installation
    useTestStore = defineStore('test', {
      state: () => ({
        customField: 'test'
      })
    })
  })

  test('should add $entities state to store', () => {
    const store = useTestStore() as any
    console.log(store.$getAllArray, 'store.$getAllArray')
    expect(store.$entities).toBeDefined()
    expect(store.$entities.byId).toEqual({})
    expect(store.$entities.allIds).toEqual([])
    expect(store.$entities.current).toBeNull()
    expect(store.$entities.currentById).toBeNull()
    expect(store.$entities.active).toEqual([])
  })

  test('should add all entity actions with $ prefix', () => {
    const store = useTestStore() as any
    
    // Check that all actions are functions
    expect(typeof store.$createOne).toBe('function')
    expect(typeof store.$createMany).toBe('function')
    expect(typeof store.$updateOne).toBe('function')
    expect(typeof store.$updateMany).toBe('function')
    expect(typeof store.$deleteOne).toBe('function')
    expect(typeof store.$deleteMany).toBe('function')
    expect(typeof store.$setCurrent).toBe('function')
    expect(typeof store.$setCurrentById).toBe('function')
    expect(typeof store.$removeCurrent).toBe('function')
    expect(typeof store.$removeCurrentById).toBe('function')
    expect(typeof store.$setActive).toBe('function')
    expect(typeof store.$resetActive).toBe('function')
    expect(typeof store.$setIsDirty).toBe('function')
    expect(typeof store.$setIsNotDirty).toBe('function')
    expect(typeof store.$updateField).toBe('function')
  })

  test('should add all entity getters with $ prefix', () => {
    const store = useTestStore() as any
    
    // Check that getters that take parameters are functions
    expect(typeof store.$getOne).toBe('function')
    expect(typeof store.$getMany).toBe('function')
    expect(typeof store.$getWhere).toBe('function')
    expect(typeof store.$getWhereArray).toBe('function')
    expect(typeof store.$getFirstWhere).toBe('function')
    expect(typeof store.$isAlreadyInStore).toBe('function')
    expect(typeof store.$isAlreadyActive).toBe('function')
    expect(typeof store.$isDirty).toBe('function')
    expect(typeof store.$search).toBe('function')
    expect(typeof store.$getMissingIds).toBe('function')
    expect(typeof store.$getMissingEntities).toBe('function')
    
    // Check that getters that return direct values are now functions
    expect(typeof store.$getAllArray).toBe('function')
    expect(typeof store.$getAllIds).toBe('function')
    expect(typeof store.$getAll).toBe('function')
    expect(typeof store.$getActive).toBe('function')
    expect(typeof store.$getFirstActive).toBe('function')
    expect(typeof store.$getIsEmpty).toBe('function')
    expect(typeof store.$getIsNotEmpty).toBe('function')
    expect(typeof store.$getCurrent).toBe('function')
    expect(typeof store.$getCurrentById).toBe('function')
  })

  test('should preserve existing store functionality', () => {
    const store = useTestStore() as any
    expect(store.customField).toBe('test')
  })

  test('should work with entity operations', () => {
    const store = useTestStore() as any
    
    const entity1: TestEntity = { id: 1, name: 'Test 1', value: 100 }
    const entity2: TestEntity = { id: 2, name: 'Test 2', value: 200 }
    
    // Test createOne
    store.$createOne(entity1)
    const created = store.$getOne(1)
    expect(created).toMatchObject({
      ...entity1,
      $isDirty: false,
      $meta: {
        createdAt: expect.any(Number),
        updatedAt: null,
      },
    })
    expect(created.$meta.changedFields instanceof Set).toBe(true)
    expect(store.$getAllIds()).toEqual(['1'])
    
    // Test createMany
    store.$createMany([entity2])
    const created2 = store.$getOne(2)
    expect(created2).toMatchObject({
      ...entity2,
      $isDirty: false,
      $meta: {
        createdAt: expect.any(Number),
        updatedAt: null,
      },
    })
    expect(created2.$meta.changedFields instanceof Set).toBe(true)
    expect(store.$getAllIds()).toEqual(['1', '2'])
    
    // Test updateOne
    store.$updateOne(1, { name: 'Updated Test 1' })
    expect(store.$getOne(1)?.name).toBe('Updated Test 1')
    expect(store.$getOne(1)?.$isDirty).toBe(true)
    
    // Test deleteOne
    store.$deleteOne(1)
    expect(store.$getOne(1)).toBeUndefined()
    expect(store.$getAllIds()).toEqual(['2'])
  })

  test('should handle getters correctly', () => {
    const store = useTestStore() as any
    
    const entities: TestEntity[] = [
      { id: 1, name: 'Test 1', value: 100 },
      { id: 2, name: 'Test 2', value: 200 },
      { id: 3, name: 'Test 3', value: 300 }
    ]
    
    store.$createMany(entities)
    
    // Test getAll
    const all = store.$getAll()
    expect(all['1']).toMatchObject({
      ...entities[0],
      $isDirty: false,
      $meta: { createdAt: expect.any(Number), updatedAt: null },
    })
    expect(all['1'].$meta.changedFields instanceof Set).toBe(true)
    expect(all['2']).toMatchObject({
      ...entities[1],
      $isDirty: false,
      $meta: { createdAt: expect.any(Number), updatedAt: null },
    })
    expect(all['2'].$meta.changedFields instanceof Set).toBe(true)
    expect(all['3']).toMatchObject({
      ...entities[2],
      $isDirty: false,
      $meta: { createdAt: expect.any(Number), updatedAt: null },
    })
    expect(all['3'].$meta.changedFields instanceof Set).toBe(true)
    
    // Test getAllArray
    const arr = store.$getAllArray()
    expect(arr[0]).toMatchObject({
      ...entities[0],
      $isDirty: false,
      $meta: { createdAt: expect.any(Number), updatedAt: null },
    })
    expect(arr[0].$meta.changedFields instanceof Set).toBe(true)
    expect(arr[1]).toMatchObject({
      ...entities[1],
      $isDirty: false,
      $meta: { createdAt: expect.any(Number), updatedAt: null },
    })
    expect(arr[1].$meta.changedFields instanceof Set).toBe(true)
    expect(arr[2]).toMatchObject({
      ...entities[2],
      $isDirty: false,
      $meta: { createdAt: expect.any(Number), updatedAt: null },
    })
    expect(arr[2].$meta.changedFields instanceof Set).toBe(true)
    
    // Test getAllIds
    expect(store.$getAllIds()).toEqual(['1', '2', '3'])
    
    // Test getWhere
    const filtered = store.$getWhere((entity) => entity.value > 150)
    expect(Object.keys(filtered)).toEqual(['2', '3'])
    
    // Test getWhereArray
    const filteredArray = store.$getWhereArray((entity) => entity.value > 150)
    expect(filteredArray).toHaveLength(2)
    expect(filteredArray.map(e => e.id)).toEqual([2, 3])
  })

  test('should handle search functionality', () => {
    const store = useTestStore() as any
    
    const entities: TestEntity[] = [
      { id: 1, name: 'John Doe', value: 100 },
      { id: 2, name: 'Jane Smith', value: 200 },
      { id: 3, name: 'Bob Johnson', value: 300 }
    ]
    
    store.$createMany(entities)
    
    // Test search
    const johnResults = store.$search('John')
    expect(johnResults).toHaveLength(2) // John Doe and Bob Johnson
    
    const janeResults = store.$search('Jane')
    expect(janeResults).toHaveLength(1) // Jane Smith
  })

  test('should handle missing entities correctly', () => {
    const store = useTestStore() as any
    
    const entities: TestEntity[] = [
      { id: 1, name: 'Test 1', value: 100 },
      { id: 2, name: 'Test 2', value: 200 }
    ]
    
    store.$createMany(entities)
    
    // Test getMissingIds
    const missingIds = store.$getMissingIds([1, 2, 3, 4])
    expect(missingIds).toEqual([3, 4])
    
    // Test getMissingEntities
    const missingEntities = store.$getMissingEntities([
      { id: 1, name: 'Test 1', value: 100 },
      { id: 3, name: 'Test 3', value: 300 }
    ])
    expect(missingEntities).toEqual([{ id: 3, name: 'Test 3', value: 300 }])
  })
})
