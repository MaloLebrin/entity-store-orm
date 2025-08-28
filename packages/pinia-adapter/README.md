# @entity-store/pinia-adapter

Pinia adapter for entity-store, enabling entity management with Pinia.

## Installation

```bash
npm install @entity-store/pinia-adapter pinia
# or
pnpm add @entity-store/pinia-adapter pinia
# or
yarn add @entity-store/pinia-adapter pinia
```

**Note**: `pinia` is a peer dependency, you must install it separately.

## 🚀 Two Approaches

This package provides two different ways to use entity management with Pinia:

### 1. **Plugin Approach** (Recommended for existing stores)
Automatically adds entity management capabilities to ALL your existing Pinia stores:

```typescript
import { createPinia } from 'pinia'
import { entityStorePlugin } from '@entity-store/pinia-adapter'

const pinia = createPinia()
pinia.use(entityStorePlugin())

// Now ALL your stores automatically have entity management!
// All methods are prefixed with $ to avoid conflicts
```

**Features:**
- ✅ Non-intrusive: Works with existing stores
- ✅ Automatic: Applies to all stores after installation
- ✅ Prefixed: All methods use `$` prefix (e.g., `$createOne`, `$getOne`)
- ✅ Type-safe: Full TypeScript support
- ✅ Devtools: Complete Pinia devtools integration

### 2. **Adapter Approach** (For new stores)
Creates specialized stores with entity management built-in:

```typescript
import { createPiniaEntityStore } from '@entity-store/pinia-adapter'

const useUserStore = createPiniaEntityStore<User>('users')
```

**Features:**
- ✅ Specialized: Stores designed specifically for entities
- ✅ Integrated: Entity methods are part of the store interface
- ✅ Flexible: Easy to extend with custom state, getters, and actions

## 📖 Plugin Usage

### Installation

```typescript
import { createPinia } from 'pinia'
import { entityStorePlugin } from '@entity-store/pinia-adapter'

const pinia = createPinia()
pinia.use(entityStorePlugin())
```

### Using with existing stores

```typescript
import { defineStore } from 'pinia'

// Your existing store - plugin automatically adds entity capabilities
export const useUserStore = defineStore('users', {
  state: () => ({
    isLoading: false,
    error: null,
    // Plugin automatically adds $entities
  }),
  
  actions: {
    async fetchUsers() {
      // Use plugin methods (prefixed with $)
      const users = await api.getUsers()
      this.$createMany(users)
    }
  }
})

// In your component
const userStore = useUserStore()
userStore.$createOne({ id: 1, name: 'John', email: 'john@example.com' })
const user = userStore.$getOne(1)
```

**All plugin methods are prefixed with `$`:**
- `$createOne`, `$createMany`
- `$getOne`, `$getAll`, `$getWhere`
- `$updateOne`, `$deleteOne`
- And many more...

For complete plugin documentation, see [Plugin README](./src/plugin/README.md).

## 🔧 Adapter Usage

### Basic import

```typescript
import { createPiniaEntityStore } from '@entity-store/pinia-adapter'
import type { WithId } from '@entity-store/types'
```

### Create a store

```typescript
interface User extends WithId {
  name: string
  email: string
  age: number
}

// Create a simple store
const useUserStore = createPiniaEntityStore<User>('users')

// Use the store
const userStore = useUserStore()
```

### Available features

The created store automatically contains:

#### **State**
- `entities.byId` : Record of entities by ID
- `entities.allIds` : List of IDs
- `entities.current` : Currently selected entity
- `entities.currentById` : ID of current entity
- `entities.active` : List of active IDs

#### **Actions**
- `createOne(user)` : Create an entity
- `createMany(users)` : Create multiple entities
- `updateOne(id, user)` : Update an entity
- `updateMany(users)` : Update multiple entities
- `deleteOne(id)` : Delete an entity
- `deleteMany(ids)` : Delete multiple entities
- `setCurrent(user)` : Set current entity
- `setCurrentById(id)` : Set current entity by ID
- `setActive(id)` : Mark entity as active
- `resetActive()` : Reset active entities
- `setIsDirty(id)` : Mark entity as modified
- `setIsNotDirty(id)` : Mark entity as unmodified
- `updateField(field, value, id)` : Update a specific field

#### **Getters**
- `getOne()(id)` : Get entity by ID
- `getMany(ids)` : Get multiple entities by IDs
- `getAll()` : Get all entities
- `getAllArray()` : Get all entities as array
- `getAllIds()` : Get all IDs
- `getCurrent()` : Get current entity
- `getCurrentById()` : Get current entity by ID
- `getActive()` : Get active entities
- `getFirstActive()` : Get first active entity
- `getWhere(filter)` : Filter entities
- `getWhereArray(filter)` : Filter entities as array
- `getFirstWhere(filter)` : Get first filtered entity
- `getIsEmpty()` : Check if state is empty
- `getIsNotEmpty()` : Check if state is not empty
- `isAlreadyInStore(id)` : Check if entity exists
- `isAlreadyActive(id)` : Check if entity is active
- `isDirty(id)` : Check if entity is modified
- `search(field)` : Search in entities
- `getMissingIds(ids)` : Get missing IDs
- `getMissingEntities(entities)` : Get missing entities

## Usage Examples

### Simple store

```typescript
import { createPiniaEntityStore } from '@entity-store/pinia-adapter'
import type { WithId } from '@entity-store/types'

interface User extends WithId {
  name: string
  email: string
}

const useUserStore = createPiniaEntityStore<User>('users')

// In a Vue component
export default {
  setup() {
    const userStore = useUserStore()
    
    // Create users
    const user: User = { id: 1, name: 'John', email: 'john@example.com' }
    userStore.createOne(user)
    
    // Set current user
    userStore.setCurrent(user)
    
    // Get data
    const currentUser = userStore.getCurrent()
    const allUsers = userStore.getAllArray()
    
    return {
      userStore,
      currentUser,
      allUsers
    }
  }
}
```

### Store with extensions

```typescript
const useUserStore = createPiniaEntityStore<User>('users', {
  // Custom state
  state: {
    isLoading: false,
    error: null
  },
  
  // Custom getters
  getters: {
    getUsersByAge: (store) => (minAge: number) => {
      return store.getAllArray().filter(user => user.age >= minAge)
    },
    
    getActiveUsersCount: (store) => () => {
      return store.getActive().length
    }
  },
  
  // Custom actions
  actions: {
    async fetchUsers: (store) => async () => {
      store.$patch({ isLoading: true, error: null })
      
      try {
        const users = await api.getUsers()
        store.createMany(users)
      } catch (error) {
        store.$patch({ error: error.message })
      } finally {
        store.$patch({ isLoading: false })
      }
    }
  }
})
```

### Usage with Composition API

```typescript
import { useUserStore } from '@/stores/users'
import { storeToRefs } from 'pinia'

export default {
  setup() {
    const userStore = useUserStore()
    
    // Destructure with storeToRefs for reactivity
    const { entities, isLoading, error } = storeToRefs(userStore)
    
    // Actions remain functions
    const { createOne, setCurrent, fetchUsers } = userStore
    
    return {
      entities,
      isLoading,
      error,
      createOne,
      setCurrent,
      fetchUsers
    }
  }
}
```

## Advanced Configuration

### Store options

```typescript
interface PiniaEntityStoreOptions<T extends WithId> {
  state?: Record<string, unknown>           // Additional state
  getters?: Record<string, (store: BaseEntityStore<T>) => (...args: unknown[]) => unknown>
  actions?: Record<string, (store: BaseEntityStore<T>) => (...args: unknown[]) => unknown>
  storeName?: string                        // Custom store name
}
```

### Available types

```typescript
import type { 
  PiniaEntityStore, 
  BaseEntityStore, 
  PiniaEntityStoreOptions 
} from '@entity-store/pinia-adapter'

// PiniaEntityStore<T> : Complete store type
// BaseEntityStore<T> : Base type with entities
// PiniaEntityStoreOptions<T> : Configuration options
```

## Benefits

- **Native integration**: Uses standard Pinia API
- **Type-safe**: Fully typed with TypeScript
- **Flexible**: Easily extensible with custom features
- **Performant**: Uses Pinia reactivity
- **Compatible**: Works with Vue 2 (Pinia) and Vue 3
- **Tested**: Complete test coverage
