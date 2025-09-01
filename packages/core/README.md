# @entity-store/core

Agnostic core package for entity management, independent of any state manager.

## Installation

```bash
npm install @entity-store/core
# or
pnpm add @entity-store/core
# or
yarn add @entity-store/core
```

## Usage

### Import functions

```typescript
import { createState, createActions, createGetters } from '@entity-store/core'
```

### Create state

```typescript
import { createState } from '@entity-store/core'

// Create initial state
const state = createState<User>()

// State contains:
// - entities.byId: Record of entities by ID
// - entities.allIds: List of IDs
// - entities.current: Currently selected entity
// - entities.currentById: ID of current entity
// - entities.active: List of active IDs
```

### Create actions

```typescript
import { createActions } from '@entity-store/core'

const actions = createActions<User>(state)

// Available actions:
actions.createOne(user)           // Create an entity
actions.createMany(users)         // Create multiple entities
actions.updateOne(id, user)       // Update an entity
actions.updateMany(users)         // Update multiple entities
actions.deleteOne(id)             // Delete an entity
actions.deleteMany(ids)           // Delete multiple entities
actions.setCurrent(user)          // Set current entity
actions.setCurrentById(id)        // Set current entity by ID
actions.setActive(id)             // Mark entity as active
actions.resetActive()             // Reset active entities
actions.setIsDirty(id)            // Mark entity as modified
actions.setIsNotDirty(id)         // Mark entity as unmodified
actions.updateField(field, value, id) // Update a specific field
```

### Create getters

```typescript
import { createGetters } from '@entity-store/core'

const getters = createGetters<User>(state)

// Available getters:
getters.getOne()(id)              // Get entity by ID
getters.getMany(ids)              // Get multiple entities by IDs
getters.getAll()                   // Get all entities
getters.getAllArray()              // Get all entities as array
getters.getAllIds()                // Get all IDs
getters.getCurrent()               // Get current entity
getters.getCurrentById()           // Get current entity by ID
getters.getActive()                // Get active entities
getters.getFirstActive()           // Get first active entity
getters.getWhere(filter)           // Filter entities
getters.getWhereArray(filter)      // Filter entities as array
getters.getFirstWhere(filter)      // Get first filtered entity
getters.getIsEmpty()               // Check if state is empty
getters.getIsNotEmpty()            // Check if state is not empty
getters.isAlreadyInStore(id)      // Check if entity exists
getters.isAlreadyActive(id)        // Check if entity is active
getters.isDirty(id)                // Check if entity is modified
getters.search(field)              // Search in entities
getters.getMissingIds(ids)         // Get missing IDs
getters.getMissingEntities(entities) // Get missing entities
```

## Types

```typescript
interface User extends WithId {
  name: string
  email: string
  age: number
}

// WithId automatically adds:
// - id: Id (string | number)
// - $isDirty: boolean (for modification tracking)
// - $meta: EntityMeta<T> (automatic metadata tracking)
```

## Complete Example

```typescript
import { createState, createActions, createGetters } from '@entity-store/core'

interface User extends WithId {
  name: string
  email: string
}

// Create state
const state = createState<User>()

// Create actions and getters
const actions = createActions<User>(state)
const getters = createGetters<User>(state)

// Usage
const user: User = { id: 1, name: 'John', email: 'john@example.com' }

actions.createOne(user)
actions.setCurrent(user)
actions.setActive(1)

const currentUser = getters.getCurrent()
const allUsers = getters.getAllArray()
const isActive = getters.isAlreadyActive(1)
```

## Benefits

- **Agnostic**: Works with any state manager
- **Type-safe**: Fully typed with TypeScript
- **Performant**: Optimized logic for entity management
- **Flexible**: Easily extensible and customizable
- **Tested**: Complete test coverage
- **Metadata**: Automatic entity metadata tracking

## Entity Metadata

All entities are automatically wrapped with metadata tracking when created:

```typescript
interface User {
  id: number
  name: string
  email: string
}

const actions = createActions<User>(state)
actions.createOne({ id: 1, name: 'John', email: 'john@example.com' })

const user = state.entities.byId[1]
console.log(user.$isDirty)           // false (initially clean)
console.log(user.$meta.createdAt)    // timestamp of creation
console.log(user.$meta.updatedAt)    // null (not modified yet)
console.log(user.$meta.changedFields) // Set() (empty initially)

// Modify the entity
user.name = 'Johnny'
console.log(user.$isDirty)           // true (automatically set)
console.log(user.$meta.updatedAt)    // timestamp of modification
console.log(user.$meta.changedFields) // Set(['name'])

// Reset dirty state
actions.setIsNotDirty(1)
console.log(user.$isDirty)           // false
console.log(user.$meta.changedFields) // Set() (cleared)
```

### Metadata Properties

- `$isDirty`: boolean - Automatically set to `true` when entity is modified
- `$meta.createdAt`: number - Timestamp when entity was created
- `$meta.updatedAt`: number | null - Timestamp of last modification
- `$meta.changedFields`: Set<keyof T> - Set of field names that have been modified

### Automatic Tracking

The metadata tracking is completely automatic and transparent:

- **Entity Creation**: When using `createOne()` or `setCurrent()`, entities are wrapped with metadata
- **Field Modifications**: Direct property changes (`user.name = 'new'`) automatically update metadata
- **Action Updates**: Using `updateOne()` or `updateField()` also triggers metadata updates
- **Reset Capability**: Use `setIsNotDirty()` to reset the dirty state and clear changed fields

### Use Cases

**Form Management**:
```typescript
// Check if form has unsaved changes
const hasUnsavedChanges = user.$isDirty

// Show which fields were modified
const modifiedFields = Array.from(user.$meta.changedFields)
```

**Audit Trail**:
```typescript
// Track entity lifecycle
console.log(`User created: ${new Date(user.$meta.createdAt)}`)
if (user.$meta.updatedAt) {
  console.log(`Last modified: ${new Date(user.$meta.updatedAt)}`)
}
```

**Conditional Updates**:
```typescript
// Only send updates if entity was modified
if (user.$isDirty) {
  await saveToServer(user)
  actions.setIsNotDirty(user.id) // Mark as clean after save
}
```

## Exported Types

```typescript
import type { EntityMeta, EntityWithMeta } from '@entity-store/core'

// EntityMeta contains the metadata structure
interface EntityMeta<T> {
  changedFields: Set<keyof T>
  createdAt: number
  updatedAt: number | null
}

// EntityWithMeta is the full entity type with metadata
type EntityWithMeta<T> = T & {
  $isDirty: boolean
  $meta: EntityMeta<T>
}
```
