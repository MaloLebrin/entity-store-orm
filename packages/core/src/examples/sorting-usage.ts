import createGetters from '../createGetters.js'
import createState from '../createState.js'
import type { WithId } from '../types/WithId.js'

// Example entity interface
interface User extends WithId {
  name: string
  email: string
  age: number
  createdAt: Date
}

// Example usage of sorting options with getWhereArray
export function sortingExample() {
  // Create state and getters
  const state = createState<User>()
  const getters = createGetters(state)
  
  // Add some sample data
  const users: User[] = [
    { id: 1, name: 'John', email: 'john@example.com', age: 30, createdAt: new Date('2023-01-01') },
    { id: 2, name: 'Jane', email: 'jane@example.com', age: 25, createdAt: new Date('2023-02-01') },
    { id: 3, name: 'Bob', email: 'bob@example.com', age: 35, createdAt: new Date('2023-03-01') },
    { id: 4, name: 'Alice', email: 'alice@example.com', age: 28, createdAt: new Date('2023-04-01') }
  ]
  
  // Add users to state (in a real app, you'd use actions)
  users.forEach(user => {
    state.entities.byId[user.id] = {
      ...user,
      $isDirty: false,
      $meta: {
        changedFields: new Set(),
        createdAt: user.createdAt.getTime(),
        updatedAt: null
      }
    }
    state.entities.allIds.push(user.id)
  })
  
  // Example 1: Sort by field in ascending order
  const sortedByName = getters.getWhereArray(
    user => user.age >= 25, 
    { orderBy: 'name', sortBy: 'asc' }
  )
  console.log('Sorted by name (asc):', sortedByName.map(u => u.name))
  // Output: ['Alice', 'Bob', 'Jane', 'John']
  
  // Example 2: Sort by field in descending order
  const sortedByAge = getters.getWhereArray(
    user => user.age >= 25, 
    { orderBy: 'age', sortBy: 'desc' }
  )
  console.log('Sorted by age (desc):', sortedByAge.map(u => ({ name: u.name, age: u.age })))
  // Output: [{ name: 'Bob', age: 35 }, { name: 'John', age: 30 }, { name: 'Alice', age: 28 }, { name: 'Jane', age: 25 }]
  
  // Example 3: Sort using custom function
  const sortedByEmailLength = getters.getWhereArray(
    user => user.age >= 25, 
    { 
      orderBy: (user) => user.email.length, 
      sortBy: 'asc' 
    }
  )
  console.log('Sorted by email length (asc):', sortedByEmailLength.map(u => ({ name: u.name, email: u.email })))
  // Output: Sorted by email length
  
  // Example 4: Sort by date
  const sortedByDate = getters.getWhereArray(
    user => user.age >= 25, 
    { orderBy: 'createdAt', sortBy: 'asc' }
  )
  console.log('Sorted by creation date (asc):', sortedByDate.map(u => ({ name: u.name, createdAt: u.createdAt })))
  
  // Example 5: Default ascending order (sortBy is optional)
  const sortedByAgeDefault = getters.getWhereArray(
    user => user.age >= 25, 
    { orderBy: 'age' } // defaults to 'asc'
  )
  console.log('Sorted by age (default asc):', sortedByAgeDefault.map(u => ({ name: u.name, age: u.age })))
  
  // Note: getWhere ignores sorting options since dictionaries don't maintain order
  const filteredDict = getters.getWhere()(
    user => user.age >= 25, 
    { orderBy: 'name', sortBy: 'asc' } // This will be ignored
  )
  console.log('Filtered dictionary (sorting ignored):', Object.keys(filteredDict).length, 'users')
}

// Example of chaining with other operations
export function advancedSortingExample() {
  const state = createState<User>()
  const getters = createGetters(state)
  
  // ... add data ...
  
  // Chain filtering and sorting
  const youngUsers = getters.getWhereArray(
    user => user.age < 30, // filter young users
    { orderBy: 'name', sortBy: 'asc' } // sort by name
  )
  
  // Use with other getters
  const activeUsers = getters.getActive()
  const activeUserSet = new Set(activeUsers)
  const sortedActiveUsers = getters.getWhereArray(
    user => activeUserSet.has(user.id), // filter active users
    { orderBy: 'age', sortBy: 'desc' } // sort by age descending
  )
}
