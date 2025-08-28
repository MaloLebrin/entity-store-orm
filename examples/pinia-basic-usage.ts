/**
 * Basic usage example with Pinia
 * 
 * This example shows how to use the Pinia adapter
 * to create and manage a user store.
 */

import { createPiniaEntityStore } from '@entity-store/pinia-adapter'
import type { WithId } from '@entity-store/types'
import { createPinia, setActivePinia, storeToRefs } from 'pinia'

// User interface definition
interface User extends WithId {
  name: string
  email: string
  age: number
  role: 'admin' | 'user' | 'moderator'
}

// Store creation
const useUserStore = createPiniaEntityStore<User>('users', {
  // Additional state
  state: {
    isLoading: false,
    error: null as string | null,
    lastFetch: null as Date | null
  },
  
  // Custom getters
  getters: {
    // Get users by role
    getUsersByRole: (store) => (role: User['role']) => {
      return store.getAllArray().filter(user => user.role === role)
    },
    
    // Get active users count
    getActiveUsersCount: (store) => () => {
      return store.getActive().length
    },
    
    // Get adult users
    getAdultUsers: (store) => () => {
      return store.getAllArray().filter(user => user.age >= 18)
    },
    
    // Search users by name
    searchUsersByName: (store) => (query: string) => {
      return store.getAllArray().filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase())
      )
    }
  },
  
  // Custom actions
  actions: {
    // Load users from API
    fetchUsers: (store) => async () => {
      store.$patch({ isLoading: true, error: null })
      
      try {
        // Simulate API call
        const users: User[] = await mockApiCall()
        
        // Add users to store
        store.createMany(users)
        
        // Update state
        store.$patch({ 
          lastFetch: new Date(),
          isLoading: false 
        })
      } catch (error) {
        store.$patch({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false 
        })
      }
    },
    
    // Create user with validation
    createUserWithValidation: (store) => (userData: Omit<User, 'id'>) => {
      // Basic validation
      if (!userData.name || userData.name.trim().length < 2) {
        throw new Error('Name must contain at least 2 characters')
      }
      
      if (!userData.email || !userData.email.includes('@')) {
        throw new Error('Invalid email')
      }
      
      if (userData.age < 13) {
        throw new Error('Minimum age is 13')
      }
      
      // Generate unique ID (in a real project, this would be managed by the API)
      const id = Date.now().toString()
      const user: User = { ...userData, id }
      
      // Create user
      store.createOne(user)
      
      // Set as current user
      store.setCurrent(user)
      
      return user
    },
    
    // Update user with validation
    updateUserWithValidation: (store) => (id: string, updates: Partial<User>) => {
      const existingUser = store.getOne()(id)
      if (!existingUser) {
        throw new Error('User not found')
      }
      
      // Validate updates
      if (updates.name && updates.name.trim().length < 2) {
        throw new Error('Name must contain at least 2 characters')
      }
      
      if (updates.email && !updates.email.includes('@')) {
        throw new Error('Invalid email')
      }
      
      if (updates.age && updates.age < 13) {
        throw new Error('Minimum age is 13')
      }
      
      // Update user
      store.updateOne(id, { ...existingUser, ...updates })
      
      // Update current entity if it's the same
      if (store.getCurrent()?.id === id) {
        store.setCurrent(store.getOne()(id)!)
      }
    },
    
    // Delete user with confirmation
    deleteUserWithConfirmation: (store) => (id: string, confirm: boolean) => {
      if (!confirm) {
        throw new Error('Confirmation required to delete user')
      }
      
      const user = store.getOne()(id)
      if (!user) {
        throw new Error('User not found')
      }
      
      // Delete user
      store.deleteOne(id)
      
      // Reset current entity if it was the same
      if (store.getCurrent()?.id === id) {
        store.removeCurrent()
      }
      
      return user
    }
  }
})

// Mock API call simulation
async function mockApiCall(): Promise<User[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', name: 'John Doe', email: 'john@example.com', age: 30, role: 'admin' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25, role: 'user' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', age: 35, role: 'moderator' },
        { id: '4', name: 'Alice Brown', email: 'alice@example.com', age: 28, role: 'user' },
        { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com', age: 22, role: 'user' }
      ])
    }, 1000)
  })
}

// Usage example in a Vue component
export function useUserStoreExample() {
  // Initialize Pinia
  const pinia = createPinia()
  setActivePinia(pinia)
  
  // Use store
  const userStore = useUserStore()
  
  // Usage examples
  
  // 1. Load users
  userStore.fetchUsers()
  
  // 2. Create new user
  try {
    const newUser = userStore.createUserWithValidation({
      name: 'New User',
      email: 'newuser@example.com',
      age: 25,
      role: 'user'
    })
    console.log('User created:', newUser)
  } catch (error) {
    console.error('Error during creation:', error)
  }
  
  // 3. Update user
  try {
    userStore.updateUserWithValidation('1', { age: 31 })
    console.log('User updated')
  } catch (error) {
    console.error('Error during update:', error)
  }
  
  // 4. Use custom getters
  const adminUsers = userStore.getUsersByRole('admin')
  const activeCount = userStore.getActiveUsersCount()
  const adultUsers = userStore.getAdultUsers()
  const searchResults = userStore.searchUsersByName('john')
  
  console.log('Admins:', adminUsers)
  console.log('Active users:', activeCount)
  console.log('Adult users:', adultUsers)
  console.log('Search results:', searchResults)
  
  // 5. Active entities management
  userStore.setActive('1')
  userStore.setActive('2')
  userStore.setActive('3')
  
  const activeUsers = userStore.getActive()
  console.log('Active IDs:', activeUsers)
  
  // 6. Current entity management
  userStore.setCurrentById('1')
  const currentUser = userStore.getCurrent()
  console.log('Current user:', currentUser)
  
  // 7. Check modification state
  const isDirty = userStore.isDirty('1')
  console.log('User 1 modified:', isDirty)
  
  // 8. Get state information
  const isEmpty = userStore.getIsEmpty()
  const totalUsers = userStore.getAllIds().length
  console.log('Store empty:', isEmpty)
  console.log('Total users:', totalUsers)
  
  return {
    userStore,
    adminUsers,
    activeCount,
    adultUsers,
    searchResults,
    activeUsers,
    currentUser,
    isDirty,
    isEmpty,
    totalUsers
  }
}

// Usage example in a Vue component with Composition API
export function useUserStoreInComponent() {
  const userStore = useUserStore()
  
  // Destructure with storeToRefs for reactivity
  const { entities, isLoading, error, lastFetch } = storeToRefs(userStore)
  
  // Actions remain functions
  const { 
    fetchUsers, 
    createUserWithValidation, 
    updateUserWithValidation,
    deleteUserWithConfirmation 
  } = userStore
  
  // Custom getters
  const { 
    getUsersByRole, 
    getActiveUsersCount, 
    getAdultUsers,
    searchUsersByName 
  } = userStore
  
  return {
    // Reactive state
    entities,
    isLoading,
    error,
    lastFetch,
    
    // Actions
    fetchUsers,
    createUserWithValidation,
    updateUserWithValidation,
    deleteUserWithConfirmation,
    
    // Custom getters
    getUsersByRole,
    getActiveUsersCount,
    getAdultUsers,
    searchUsersByName
  }
}
