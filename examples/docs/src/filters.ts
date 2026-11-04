import {
  createState,
  getFirstWhere,
  getWhere,
  getWhereArray,
  setAll,
} from '@entity-store/core'

interface User {
  id: number
  name: string
  role: 'admin' | 'user'
  age: number
}

const state = setAll<User>(createState<User>(), [
  { id: 1, name: 'Ada', role: 'admin', age: 36 },
  { id: 2, name: 'Grace', role: 'admin', age: 30 },
  { id: 3, name: 'Alan', role: 'user', age: 30 },
])

// Object filter: strict equality on every field, AND, typed on the entity.
getWhereArray(state, { role: 'admin', age: 30 }) // [Grace]
getWhereArray(state, { role: 'admin' }, { orderBy: 'age', sortBy: 'desc' })
getFirstWhere(state, { name: 'Alan' })
getWhere(state, { role: 'user' }) // dictionary by id

// ❌ does not compile: age is a number
// getWhereArray(state, { age: '30' })

// Keyed by VALUE: an inline literal hits the cache on every call.
const first = getWhereArray(state, { role: 'admin' })
console.log(getWhereArray(state, { role: 'admin' }) === first) // true

// A predicate is keyed by REFERENCE: hoist it to benefit from memoization.
const isAdult = (user: { age: number }) => user.age >= 18
getWhereArray(state, isAdult)
