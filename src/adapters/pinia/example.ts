/**
 * Example usage of the Pinia adapter
 * This file demonstrates how to use the createPiniaEntityStore function
 */

import { createPiniaEntityStore } from './index.js'
import type { WithId } from '../../types/WithId.js'

// Define your entity interface
interface User extends WithId {
  name: string
  email: string
  age: number
}

// Create the store
const useUserStore = createPiniaEntityStore<User>('users')

// Example of how to use the store in a Vue component
export function exampleUsage() {
  // In a real Vue component, you would call this in setup()
  const userStore = useUserStore()
  
  // Create some initial data
  const users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
  ]
  
  // Initialize the store
  userStore.createMany(users)
  
  // Set current user
  userStore.setCurrent(users[0]!)
  userStore.setCurrentById(1)
  
  // Set some users as active
  userStore.setActive(1)
  userStore.setActive(2)
  
  // Demonstrate CRUD operations
  console.log('Initial state:', {
    allUsers: userStore.getAllArray(),
    currentUser: userStore.getCurrent(),
    activeUsers: userStore.getActive(),
    isEmpty: userStore.getIsEmpty()
  })
  
  // Update a user
  userStore.updateOne(1, { ...users[0]!, name: 'John Updated', age: 31 })
  
  // Add a new user
  const newUser: User = { id: 4, name: 'Alice Brown', email: 'alice@example.com', age: 28 }
  userStore.createOne(newUser)
  
  // Demonstrate filtering
  const getWhere = userStore.getWhere()
  const adults = getWhere(user => user.age >= 30)
  const getWhereArray = userStore.getWhereArray()
  const adultsArray = getWhereArray(user => user.age >= 30)
  
  console.log('After updates:', {
    allUsers: userStore.getAllArray(),
    currentUser: userStore.getCurrent(),
    activeUsers: userStore.getActive(),
    adults: adults,
    adultsArray: adultsArray,
    isDirty: userStore.isDirty()(1)
  })
  
  // Demonstrate entity queries
  const getOne = userStore.getOne()
  const getMany = userStore.getMany()
  
  console.log('Entity queries:', {
    user1: getOne(1),
    users1and2: getMany([1, 2]),
    missingIds: userStore.getMissingIds()([1, 2, 5, 6]),
    isInStore: userStore.isAlreadyInStore()(1),
    isActive: userStore.isAlreadyActive()(1)
  })
  
  return userStore
}

// Example of how to use in a Vue 3 Composition API component
export const useUserStoreExample = () => {
  const userStore = useUserStore()
  
  // Computed properties (in a real component, these would be wrapped in computed())
  const allUsers = () => userStore.getAllArray()
  const currentUser = () => userStore.getCurrent()
  const activeUsers = () => {
    const activeIds = userStore.getActive()
    return activeIds.map(id => userStore.getOne()(id)).filter(Boolean)
  }
  
  // Actions
  const addUser = (user: User) => {
    userStore.createOne(user)
  }
  
  const updateUser = (id: number, updates: Partial<User>) => {
    const current = userStore.getOne()(id)
    if (current) {
      userStore.updateOne(id, { ...current, ...updates })
    }
  }
  
  const deleteUser = (id: number) => {
    userStore.deleteOne(id)
  }
  
  const setCurrentUser = (user: User) => {
    userStore.setCurrent(user)
  }
  
  const setUserActive = (id: number) => {
    userStore.setActive(id)
  }
  
  return {
    // State
    entities: userStore.entities,
    
    // Computed
    allUsers,
    currentUser,
    activeUsers,
    
    // Actions
    addUser,
    updateUser,
    deleteUser,
    setCurrentUser,
    setUserActive,
    
    // Direct store access for advanced usage
    store: userStore
  }
}
