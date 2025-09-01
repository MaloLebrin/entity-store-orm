import { describe, expect, test } from 'vitest'
import type { EntityWithMeta } from '../types/EntityMeta.js'
import type { WithId } from '../types/WithId.js'
import { sortEntities } from './sortEntities.js'

// Test entity interface
interface User extends WithId {
  name: string
  email: string
  age: number
  createdAt: Date
}

describe('sortEntities', () => {
  const createUser = (id: number, name: string, age: number, email: string, createdAt: Date): EntityWithMeta<User> => ({
    id,
    name,
    age,
    email,
    createdAt,
    $isDirty: false,
    $meta: {
      changedFields: new Set(),
      createdAt: createdAt.getTime(),
      updatedAt: null
    }
  })

  const users: EntityWithMeta<User>[] = [
    createUser(1, 'John', 30, 'john@example.com', new Date('2023-01-01')),
    createUser(2, 'Jane', 25, 'jane@example.com', new Date('2023-02-01')),
    createUser(3, 'Bob', 35, 'bob@example.com', new Date('2023-03-01')),
    createUser(4, 'Alice', 28, 'alice@example.com', new Date('2023-04-01'))
  ]

  test('should return entities unchanged when no sort options provided', () => {
    const result = sortEntities(users)
    expect(result).toEqual(users)
  })

  test('should sort entities by string field in ascending order', () => {
    const result = sortEntities(users, { orderBy: 'name', sortBy: 'asc' })
    
    expect(result).toHaveLength(4)
    expect(result[0]?.name).toBe('Alice')
    expect(result[1]?.name).toBe('Bob')
    expect(result[2]?.name).toBe('Jane')
    expect(result[3]?.name).toBe('John')
  })

  test('should sort entities by string field in descending order', () => {
    const result = sortEntities(users, { orderBy: 'name', sortBy: 'desc' })
    
    expect(result).toHaveLength(4)
    expect(result[0]?.name).toBe('John')
    expect(result[1]?.name).toBe('Jane')
    expect(result[2]?.name).toBe('Bob')
    expect(result[3]?.name).toBe('Alice')
  })

  test('should sort entities by number field in ascending order', () => {
    const result = sortEntities(users, { orderBy: 'age', sortBy: 'asc' })
    
    expect(result).toHaveLength(4)
    expect(result[0]?.age).toBe(25)
    expect(result[1]?.age).toBe(28)
    expect(result[2]?.age).toBe(30)
    expect(result[3]?.age).toBe(35)
  })

  test('should sort entities by number field in descending order', () => {
    const result = sortEntities(users, { orderBy: 'age', sortBy: 'desc' })
    
    expect(result).toHaveLength(4)
    expect(result[0]?.age).toBe(35)
    expect(result[1]?.age).toBe(30)
    expect(result[2]?.age).toBe(28)
    expect(result[3]?.age).toBe(25)
  })

  test('should sort entities by date field in ascending order', () => {
    const result = sortEntities(users, { orderBy: 'createdAt', sortBy: 'asc' })
    
    expect(result).toHaveLength(4)
    expect(result[0]?.createdAt).toEqual(new Date('2023-01-01'))
    expect(result[1]?.createdAt).toEqual(new Date('2023-02-01'))
    expect(result[2]?.createdAt).toEqual(new Date('2023-03-01'))
    expect(result[3]?.createdAt).toEqual(new Date('2023-04-01'))
  })

  test('should sort entities using custom sort function', () => {
    const result = sortEntities(users, { 
      orderBy: (user) => user.name.length, 
      sortBy: 'asc' 
    })
    
    expect(result).toHaveLength(4)
    expect(result[0]?.name).toBe('Bob') // 3 letters
    expect(result[1]?.name).toBe('John') // 4 letters
    expect(result[2]?.name).toBe('Jane') // 4 letters
    expect(result[3]?.name).toBe('Alice') // 5 letters
  })

  test('should handle null/undefined values gracefully', () => {
    const usersWithNulls: EntityWithMeta<User>[] = [
      createUser(1, 'John', 30, 'john@example.com', new Date('2023-01-01')),
      createUser(2, 'Jane', 25, 'jane@example.com', new Date('2023-02-01')),
      createUser(3, 'Bob', 35, 'bob@example.com', new Date('2023-03-01'))
    ]

    // Add a user with null age
    usersWithNulls[1] = { ...usersWithNulls[1], age: null as any }

    const result = sortEntities(usersWithNulls, { orderBy: 'age', sortBy: 'asc' })
    
    expect(result).toHaveLength(3)
    expect(result[0]?.age).toBeNull() // null values should come first in ascending order
    expect(result[1]?.age).toBe(30)
    expect(result[2]?.age).toBe(35)
  })

  test('should handle mixed types by converting to strings', () => {
    const mixedUsers: EntityWithMeta<User>[] = [
      createUser(1, 'John', 30, 'john@example.com', new Date('2023-01-01')),
      createUser(2, 'Jane', '25' as any, 'jane@example.com', new Date('2023-02-01')), // age as string
      createUser(3, 'Bob', 35, 'bob@example.com', new Date('2023-03-01'))
    ]

    const result = sortEntities(mixedUsers, { orderBy: 'age', sortBy: 'asc' })
    
    expect(result).toHaveLength(3)
    // Should handle mixed types gracefully by converting to strings
    expect(result[0]?.age).toBe('25')
    expect(result[1]?.age).toBe(30)
    expect(result[2]?.age).toBe(35)
  })

  test('should use ascending order by default', () => {
    const result = sortEntities(users, { orderBy: 'age' }) // no sortBy specified
    
    expect(result).toHaveLength(4)
    expect(result[0]?.age).toBe(25)
    expect(result[1]?.age).toBe(28)
    expect(result[2]?.age).toBe(30)
    expect(result[3]?.age).toBe(35)
  })
})
