import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import type { WithId } from '../../types/WithId.js'
import { createPiniaEntityStore } from './index.js'

// Test entity interface
interface User extends WithId {
  name: string
  email: string
  age: number
}

describe('Pinia Adapter', () => {
  let pinia: ReturnType<typeof createPinia>
  let useUserStore: ReturnType<typeof createPiniaEntityStore<User>>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    useUserStore = createPiniaEntityStore<User>('users')
  })

  describe('Store Creation', () => {
    test('should create a Pinia store with correct structure', () => {
      const store = useUserStore()
      
      expect(store).toBeDefined()
      expect(store.entities).toBeDefined()
      expect(store.entities.byId).toBeDefined()
      expect(store.entities.allIds).toBeDefined()
      expect(store.entities.current).toBeNull()
      expect(store.entities.currentById).toBeNull()
      expect(store.entities.active).toEqual([])
    })

    test('should have all getter methods', () => {
      const store = useUserStore()
      
      expect(typeof store.getAll).toBe('function')
      expect(typeof store.getAllArray).toBe('function')
      expect(typeof store.getAllIds).toBe('function')
      expect(typeof store.getOne).toBe('function')
      expect(typeof store.getMany).toBe('function')
      expect(typeof store.getCurrent).toBe('function')
      expect(typeof store.getCurrentById).toBe('function')
      expect(typeof store.getActive).toBe('function')
      expect(typeof store.getFirstActive).toBe('function')
      expect(typeof store.getWhere).toBe('function')
      expect(typeof store.getWhereArray).toBe('function')
      expect(typeof store.getMissingIds).toBe('function')
      expect(typeof store.getMissingEntities).toBe('function')
      expect(typeof store.getIsEmpty).toBe('function')
      expect(typeof store.getIsNotEmpty).toBe('function')
    })

    test('should have all action methods', () => {
      const store = useUserStore()
      
      expect(typeof store.createOne).toBe('function')
      expect(typeof store.createMany).toBe('function')
      expect(typeof store.updateOne).toBe('function')
      expect(typeof store.updateMany).toBe('function')
      expect(typeof store.deleteOne).toBe('function')
      expect(typeof store.deleteMany).toBe('function')
      expect(typeof store.setCurrent).toBe('function')
      expect(typeof store.removeCurrent).toBe('function')
      expect(typeof store.setCurrentById).toBe('function')
      expect(typeof store.removeCurrentById).toBe('function')
      expect(typeof store.setActive).toBe('function')
      expect(typeof store.resetActive).toBe('function')
      expect(typeof store.setIsDirty).toBe('function')
      expect(typeof store.setIsNotDirty).toBe('function')
      expect(typeof store.updateField).toBe('function')
    })
  })

  describe('Entity Management', () => {
    test('should create and retrieve entities', () => {
      const store = useUserStore()
      
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      store.createOne(user)
      
      expect(store.entities.allIds).toContain(1)
      expect(store.entities.byId[1]).toBeDefined()
      expect(store.entities.byId[1]?.name).toBe('John')
      expect(store.entities.byId[1]?.$isDirty).toBe(false)
    })

    test('should update existing entities', () => {
      const store = useUserStore()
      
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      store.createOne(user)
      
      const updatedUser: User = { id: 1, name: 'John Updated', email: 'john@example.com', age: 31 }
      store.updateOne(1, updatedUser)
      
      expect(store.entities.byId[1]?.name).toBe('John Updated')
      expect(store.entities.byId[1]?.age).toBe(31)
      expect(store.entities.byId[1]?.$isDirty).toBe(true)
    })

    test('should delete entities', () => {
      const store = useUserStore()
      
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      store.createOne(user)
      
      expect(store.entities.allIds).toContain(1)
      
      store.deleteOne(1)
      
      expect(store.entities.allIds).not.toContain(1)
      expect(store.entities.byId[1]).toBeUndefined()
    })
  })

  describe('Current Entity Management', () => {
    test('should set and retrieve current entity', () => {
      const store = useUserStore()
      
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      store.createOne(user)
      store.setCurrent(user)
      
      expect(store.entities.current).toBeDefined()
      expect(store.entities.current?.id).toBe(1)
      expect(store.entities.current?.name).toBe('John')
    })

    test('should set and retrieve current entity by ID', () => {
      const store = useUserStore()
      
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      store.createOne(user)
      store.setCurrentById(1)
      
      expect(store.entities.currentById).toBe(1)
      expect(store.getCurrentById()?.id).toBe(1)
    })
  })

  describe('Active Entities Management', () => {
    test('should set entities as active', () => {
      const store = useUserStore()
      
      const user1: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      const user2: User = { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      
      store.createOne(user1)
      store.createOne(user2)
      store.setActive(1)
      store.setActive(2)
      
      expect(store.entities.active).toContain(1)
      expect(store.entities.active).toContain(2)
      expect(store.entities.active).toHaveLength(2)
    })

    test('should not set non-existent entities as active', () => {
      const store = useUserStore()
      
      store.setActive(999)
      
      expect(store.entities.active).not.toContain(999)
      expect(store.entities.active).toHaveLength(0)
    })

    test('should reset active entities', () => {
      const store = useUserStore()
      
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      store.createOne(user)
      store.setActive(1)
      
      expect(store.entities.active).toHaveLength(1)
      
      store.resetActive()
      
      expect(store.entities.active).toHaveLength(0)
    })
  })

  describe('Dirty State Management', () => {
    test('should mark entities as dirty', () => {
      const store = useUserStore()
      
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      store.createOne(user)
      
      expect(store.entities.byId[1]?.$isDirty).toBe(false)
      
      store.setIsDirty(1)
      
      expect(store.entities.byId[1]?.$isDirty).toBe(true)
    })

    test('should mark entities as not dirty', () => {
      const store = useUserStore()
      
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      store.createOne(user)
      store.setIsDirty(1)
      
      expect(store.entities.byId[1]?.$isDirty).toBe(true)
      
      store.setIsNotDirty(1)
      
      expect(store.entities.byId[1]?.$isDirty).toBe(false)
    })
  })

  describe('Integration', () => {
    test('should handle complex workflow', () => {
      const store = useUserStore()
      
      // Create multiple users
      const users: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 },
        { id: 3, name: 'Bob', email: 'bob@example.com', age: 35 }
      ]
      
      store.createMany(users)
      
      // Set current user
      store.setCurrent(users[0])
      store.setCurrentById(1)
      
      // Set active users
      store.setActive(1)
      store.setActive(2)
      
      // Update a user
      store.updateOne(1, { ...users[0], name: 'John Updated' })
      
      // Update current entity to match the updated entity
      store.setCurrent(store.entities.byId[1]!)
      
      // Verify state
      expect(store.entities.allIds).toHaveLength(3)
      expect(store.entities.current?.name).toBe('John Updated')
      expect(store.entities.currentById).toBe(1)
      expect(store.entities.active).toHaveLength(2)
      expect(store.entities.byId[1]?.$isDirty).toBe(true)
      
      // Test getters
      expect(store.getIsEmpty()).toBe(false)
      expect(store.getAllIds()).toHaveLength(3)
      expect(store.getOne()(1)?.name).toBe('John Updated')
      
      // Test filtering
      const getWhere = store.getWhere()
      const adults = getWhere(user => user.age >= 30)
      expect(Object.keys(adults)).toHaveLength(2)
    })
  })
})
