import { createPinia } from 'pinia'
import { createPiniaEntityStore, installEntityStorePlugin } from '../index'

// Example entity interface
interface User {
  id: number
  name: string
  age: number
  email: string
}

// Create a Pinia store with entity management
const useUserStore = createPiniaEntityStore<User>('users')

// Example usage with the new getWhereArray syntax
export function exampleUsage() {
  const pinia = createPinia()
  installEntityStorePlugin(pinia)
  
  const userStore = useUserStore()
  
  // Add some users
  userStore.$createMany([
    { id: 1, name: 'John', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane', age: 25, email: 'jane@example.com' },
    { id: 3, name: 'Bob', age: 35, email: 'bob@example.com' },
    { id: 4, name: 'Alice', age: 28, email: 'alice@example.com' }
  ])
  
  // Example 1: Filter users by age (new syntax - no empty parentheses)
  const adults = userStore.$getWhereArray(
    user => user.age >= 25
  )
  console.log('Adults:', adults.map(u => u.name))
  // Output: ['John', 'Jane', 'Bob', 'Alice']
  
  // Example 2: Filter and sort by age descending (new syntax)
  const sortedByAge = userStore.$getWhereArray(
    user => user.age >= 25,
    { orderBy: 'age', sortBy: 'desc' }
  )
  console.log('Sorted by age (desc):', sortedByAge.map(u => ({ name: u.name, age: u.age })))
  // Output: [{ name: 'Bob', age: 35 }, { name: 'John', age: 30 }, { name: 'Alice', age: 28 }, { name: 'Jane', age: 25 }]
  
  // Example 3: Filter and sort by name ascending
  const sortedByName = userStore.$getWhereArray(
    user => user.age >= 25,
    { orderBy: 'name', sortBy: 'asc' }
  )
  console.log('Sorted by name (asc):', sortedByName.map(u => u.name))
  // Output: ['Alice', 'Bob', 'Jane', 'John']
  
  // Example 4: Filter young users and sort by email length
  const youngUsers = userStore.$getWhereArray(
    user => user.age < 30,
    { 
      orderBy: (user) => user.email.length, 
      sortBy: 'asc' 
    }
  )
  console.log('Young users sorted by email length:', youngUsers.map(u => ({ name: u.name, email: u.email })))
  // Output: Sorted by email length
  
  return {
    adults,
    sortedByAge,
    sortedByName,
    youngUsers
  }
}

// Example with the plugin approach
export function pluginExample() {
  const pinia = createPinia()
  installEntityStorePlugin(pinia)
  
  // Create a store with the plugin
  const store = useUserStore()
  
  // Add users
  store.$createMany([
    { id: 1, name: 'John', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane', age: 25, email: 'jane@example.com' },
    { id: 3, name: 'Bob', age: 35, email: 'bob@example.com' }
  ])
  
  // Use the new syntax with the plugin
  const activeUsers = store.$getWhereArray(
    user => user.age >= 25,
    { orderBy: 'name', sortBy: 'asc' }
  )
  
  console.log('Active users sorted by name:', activeUsers.map(u => u.name))
  // Output: ['Bob', 'Jane', 'John']
  
  return activeUsers
}
