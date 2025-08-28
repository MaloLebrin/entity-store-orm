import type { WithId } from '@entity-store/core'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { createApp } from 'vue'
import { entityStorePlugin } from './plugin'
// Interface de test
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


    // Définir le store APRÈS l'installation du plugin
    useTestStore = defineStore('test', {
      state: () => ({
        customField: 'test'
      }),
      actions: {
        customAction() {
          return 'custom'
        }
      }
    })
  })

  test('should add $entities state to store', () => {
    const store = useTestStore()
    console.log(store.$getAllArray(), 'store.getAll()')
    expect(store.$entities).toBeDefined()
    expect(store.$entities.byId).toEqual({})
    expect(store.$entities.allIds).toEqual([])
    expect(store.$entities.current).toBeNull()
    expect(store.$entities.currentById).toBeNull()
    expect(store.$entities.active).toEqual([])
  })

  test('should add all entity actions with $ prefix', () => {
    const store = useTestStore()
    
    // Actions
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
    const store = useTestStore()
    
    // Getters
    expect(typeof store.$getOne).toBe('function')
    expect(typeof store.$getMany).toBe('function')
    expect(typeof store.$getAll).toBe('function')
    expect(typeof store.$getAllArray).toBe('function')
    expect(typeof store.$getAllIds).toBe('function')
    expect(typeof store.$getCurrent).toBe('function')
    expect(typeof store.$getCurrentById).toBe('function')
    expect(typeof store.$getActive).toBe('function')
    expect(typeof store.$getFirstActive).toBe('function')
    expect(typeof store.$getWhere).toBe('function')
    expect(typeof store.$getWhereArray).toBe('function')
    expect(typeof store.$getFirstWhere).toBe('function')
    expect(typeof store.$getIsEmpty).toBe('function')
    expect(typeof store.$getIsNotEmpty).toBe('function')
    expect(typeof store.$isAlreadyInStore).toBe('function')
    expect(typeof store.$isAlreadyActive).toBe('function')
    expect(typeof store.$isDirty).toBe('function')
    expect(typeof store.$search).toBe('function')
    expect(typeof store.$getMissingIds).toBe('function')
    expect(typeof store.$getMissingEntities).toBe('function')
  })

  test('should preserve existing store functionality', () => {
    const store = useTestStore()
    
    expect(store.customField).toBe('test')
    expect(store.customAction()).toBe('custom')
  })

  test('should work with entity operations', () => {
    const store = useTestStore()
    
    const entity1: TestEntity = { id: 1, name: 'Test 1', value: 100 }
    const entity2: TestEntity = { id: 2, name: 'Test 2', value: 200 }
    
    // Test createOne
    store.$createOne(entity1)
    expect(store.$getOne(1)).toEqual({ ...entity1, $isDirty: false })
    expect(store.$getAllIds()).toEqual(['1'])
    
    // Test createMany
    store.$createMany([entity2])
    expect(store.$getOne(2)).toEqual({ ...entity2, $isDirty: false })
    expect(store.$getAllIds()).toEqual(['1', '2'])
    
    // Test updateOne
    store.$updateOne(1, { ...entity1, value: 150 })
    const updatedEntity = store.$getOne(1)
    expect(updatedEntity?.value).toBe(150)
    expect(updatedEntity?.$isDirty).toBe(true)
    
    // Test setCurrent
    store.$setCurrent(entity1)
    expect(store.$getCurrent()).toEqual({ ...entity1, value: 150, $isDirty: true })
    
    // Test setActive
    store.$setActive(1)
    store.$setActive(2)
    expect(store.$getActive()).toHaveLength(2)
    
    // Test deleteOne
    store.$deleteOne(1)
    expect(store.$getOne(1)).toBeUndefined()
    expect(store.$getAllIds()).toEqual(['2'])
  })

  test('should handle getters correctly', () => {
    const store = useTestStore()
    
    const entities: TestEntity[] = [
      { id: 1, name: 'Test 1', value: 100 },
      { id: 2, name: 'Test 2', value: 200 },
      { id: 3, name: 'Test 3', value: 300 }
    ]
    
    store.$createMany(entities)
    
    // Test getAll
    expect(store.$getAll()).toEqual({
      '1': { ...entities[0], $isDirty: false },
      '2': { ...entities[1], $isDirty: false },
      '3': { ...entities[2], $isDirty: false }
    })
    
    // Test getAllArray
    expect(store.$getAllArray()).toHaveLength(3)
    
    // Test getWhere
    const filtered = store.$getWhere((entity) => entity.value > 150)
    expect(Object.keys(filtered)).toEqual(['2', '3'])
    
    // Test getWhereArray
    const filteredArray = store.$getWhereArray((entity) => entity.value > 150)
    expect(filteredArray).toHaveLength(2)
    
    // Test getFirstWhere
    const first = store.$getFirstWhere((entity) => entity.value > 150)
    expect(first?.value).toBe(200)
    
    // Test isEmpty/isNotEmpty
    expect(store.$getIsEmpty()).toBe(false)
    expect(store.$getIsNotEmpty()).toBe(true)
    
    // Test isAlreadyInStore
    expect(store.$isAlreadyInStore(1)).toBe(true)
    expect(store.$isAlreadyInStore(999)).toBe(false)
  })

  test('should handle search functionality', () => {
    const store = useTestStore()
    
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
    const store = useTestStore()
    
    const entities: TestEntity[] = [
      { id: 1, name: 'Test 1', value: 100 },
      { id: 2, name: 'Test 2', value: 200 }
    ]
    
    store.$createMany(entities)
    
    // Test getMissingIds
    const missingIds = store.$getMissingIds([1, 2, 3, 4])
    expect(missingIds).toEqual([3, 4])
    
    // Test getMissingEntities
    const newEntities: TestEntity[] = [
      { id: 1, name: 'Test 1', value: 100 }, // Exists
      { id: 3, name: 'Test 3', value: 300 }, // New
      { id: 4, name: 'Test 4', value: 400 }  // New
    ]
    
    const missingEntities = store.$getMissingEntities(newEntities)
    expect(missingEntities).toHaveLength(2)
    expect(missingEntities.map(e => e.id)).toEqual([3, 4])
  })
})
