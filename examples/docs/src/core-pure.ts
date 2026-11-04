import {
  createState,
  getAllArray,
  getByField,
  getSortedArray,
  setAll,
  updateField,
} from '@entity-store/core'

interface User {
  id: number
  name: string
  team: string
}

// Every function is pure: (state, ...args) => nextState
const empty = createState<User>()

const loaded = setAll(empty, [
  { id: 1, name: 'Ada', team: 'math' },
  { id: 2, name: 'Grace', team: 'navy' },
  { id: 3, name: 'Alan', team: 'math' },
])

const renamed = updateField(loaded, 'name', 'Ada Lovelace', 1)

// The input is never mutated
console.log(loaded.entities.byId[1]?.name) // 'Ada'
console.log(renamed.entities.byId[1]?.name) // 'Ada Lovelace'
console.log(renamed.entities.byId[1]?.$isDirty) // true

// Nothing changed -> the very same state reference
console.log(updateField(renamed, 'name', 'Ada Lovelace', 1) === renamed) // true

// Derived arrays are memoized: same inputs, same array
const first = getAllArray(renamed)
console.log(getAllArray(renamed) === first) // true
console.log(getSortedArray(renamed, { orderBy: 'name' }).map((u) => u.name))
console.log(getByField(renamed, 'team', 'math').length) // 2
