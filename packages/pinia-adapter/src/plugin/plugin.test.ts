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
    
    // Vérifier que toutes les actions sont des fonctions
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
    
    // Vérifier que les getters qui prennent des paramètres sont des fonctions
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
    
    // Vérifier que les getters qui retournent des valeurs directes sont maintenant des fonctions
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
    expect(store.$getOne(1)).toEqual({ ...entity1, $isDirty: false })
    expect(store.$getAllIds()).toEqual(['1'])
    
    // Test createMany
    store.$createMany([entity2])
    expect(store.$getOne(2)).toEqual({ ...entity2, $isDirty: false })
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
    expect(store.$getAll()).toEqual({
      '1': { ...entities[0], $isDirty: false },
      '2': { ...entities[1], $isDirty: false },
      '3': { ...entities[2], $isDirty: false }
    })
    
    // Test getAllArray
    expect(store.$getAllArray()).toEqual([
      { ...entities[0], $isDirty: false },
      { ...entities[1], $isDirty: false },
      { ...entities[2], $isDirty: false }
    ])
    
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
