# Pinia Adapter

This adapter provides Pinia-compatible entity management using the core entity store functions.

## Installation

```bash
pnpm add pinia
```

## Usage

### Basic Setup

```typescript
import { createPiniaEntityStore } from 'entity-store/adapters/pinia'
import type { WithId } from 'entity-store/types'

// Define your entity interface
interface User extends WithId {
  name: string
  email: string
  age: number
}

// Create the store
const useUserStore = createPiniaEntityStore<User>('users')

// Use in your component
export default defineComponent({
  setup() {
    const userStore = useUserStore()
    
    // Your component logic here
    return { userStore }
  }
})
```

### Store Structure

The store provides:

- **State**: `entities` object with `byId`, `allIds`, `current`, `currentById`, and `active` properties
- **Getters**: All core getter methods for querying entities
- **Actions**: All core action methods for modifying entities

### Entity Management

```typescript
const userStore = useUserStore()

// Create entities
const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 }
userStore.createOne(user)

// Create multiple entities
const users: User[] = [
  { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 },
  { id: 3, name: 'Bob', email: 'bob@example.com', age: 35 }
]
userStore.createMany(users)

// Update entities
userStore.updateOne(1, { ...user, name: 'John Updated' })

// Delete entities
userStore.deleteOne(1)
userStore.deleteMany([2, 3])
```

### Current Entity Management

```typescript
// Set current entity
userStore.setCurrent(user)

// Get current entity
const current = userStore.getCurrent()

// Set current entity by ID
userStore.setCurrentById(1)

// Get current entity by ID
const currentById = userStore.getCurrentById()

// Remove current entity
userStore.removeCurrent()
userStore.removeCurrentById()
```

### Active Entities Management

```typescript
// Set entities as active
userStore.setActive(1)
userStore.setActive(2)

// Get active entities
const activeIds = userStore.getActive()
const firstActive = userStore.getFirstActive()

// Reset active entities
userStore.resetActive()
```

### Querying Entities

```typescript
// Get all entities
const allUsers = userStore.getAll()
const allUsersArray = userStore.getAllArray()
const allIds = userStore.getAllIds()

// Get specific entities
const user = userStore.getOne()(1)
const users = userStore.getMany()([1, 2, 3])

// Filter entities
const getWhere = userStore.getWhere()
const adults = getWhere(user => user.age >= 30)

const getWhereArray = userStore.getWhereArray()
const adultsArray = getWhereArray(user => user.age >= 30)

// Check entity existence
const isInStore = userStore.isAlreadyInStore()
const isActive = userStore.isAlreadyActive()
const isDirty = userStore.isDirty()

// Find missing entities
const getMissingIds = userStore.getMissingIds()
const missingIds = getMissingIds([1, 2, 4, 5])

const getMissingEntities = userStore.getMissingEntities()
const missingUsers = getMissingEntities([user1, user2, user4, user5])
```

### Dirty State Management

```typescript
// Mark entity as dirty (modified)
userStore.setIsDirty(1)

// Mark entity as not dirty
userStore.setIsNotDirty(1)

// Check if entity is dirty
const dirty = userStore.isDirty()(1)
```

### Field Updates

```typescript
// Update specific field
userStore.updateField('name', 'John Updated', 1)
userStore.updateField('age', 31, 1)
```

### State Information

```typescript
// Check if store is empty
const isEmpty = userStore.getIsEmpty()
const isNotEmpty = userStore.getIsNotEmpty()
```

## Complete Example

```typescript
import { defineComponent } from 'vue'
import { createPiniaEntityStore } from 'entity-store/adapters/pinia'

interface User extends WithId {
  name: string
  email: string
  age: number
}

const useUserStore = createPiniaEntityStore<User>('users')

export default defineComponent({
  setup() {
    const userStore = useUserStore()
    
    // Initialize with some data
    const initializeStore = () => {
      const users: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      ]
      userStore.createMany(users)
      userStore.setCurrent(users[0])
      userStore.setActive(1)
    }
    
    // CRUD operations
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
    
    // Computed properties
    const allUsers = computed(() => userStore.getAllArray())
    const currentUser = computed(() => userStore.getCurrent())
    const activeUsers = computed(() => {
      const activeIds = userStore.getActive()
      return activeIds.map(id => userStore.getOne()(id)).filter(Boolean)
    })
    
    // Initialize on mount
    onMounted(() => {
      initializeStore()
    })
    
    return {
      userStore,
      allUsers,
      currentUser,
      activeUsers,
      addUser,
      updateUser,
      deleteUser
    }
  }
})
```

## TypeScript Support

The adapter is fully typed and provides excellent TypeScript support:

- Generic type parameter for your entity interface
- Proper typing for all methods and properties
- Type inference for entity properties
- Autocomplete for all available methods

## Integration with Vue 3 Composition API

The adapter works seamlessly with Vue 3's Composition API:

- Use with `ref()` and `reactive()` for reactive state
- Compatible with `computed()` for derived state
- Works with `watch()` and `watchEffect()` for side effects
- Integrates with Vue DevTools for debugging
