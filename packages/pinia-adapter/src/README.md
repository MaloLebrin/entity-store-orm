# Entity Store Plugin for Pinia

This Pinia plugin automatically adds entity management to all your existing Pinia stores without modifying their current structure.

## 🚀 Installation

```typescript
import { createPinia } from 'pinia'
import { entityStorePlugin } from '@entity-store/pinia-adapter'

const pinia = createPinia().use(entityStorePlugin)
app.use(pinia)
```

## ✨ Features

The plugin automatically adds to all your stores:

### 🔧 **Extended State**
- `$entities.byId` : Record of entities by ID
- `$entities.allIds` : List of IDs
- `$entities.current` : Currently selected entity
- `$entities.currentById` : ID of the current entity
- `$entities.active` : List of active IDs

### 🎯 **Prefixed Actions**
- `$createOne(entity)` : Create an entity
- `$createMany(entities)` : Create multiple entities
- `$updateOne(id, entity)` : Update an entity
- `$updateMany(entities)` : Update multiple entities
- `$deleteOne(id)` : Delete an entity
- `$deleteMany(ids)` : Delete multiple entities
- `$setCurrent(entity)` : Set the current entity
- `$setCurrentById(id)` : Set the current entity by ID
- `$removeCurrent()` : Remove the current entity
- `$removeCurrentById()` : Remove the current entity by ID
- `$setActive(id)` : Mark an entity as active
- `$resetActive()` : Reset active entities
- `$setIsDirty(id)` : Mark an entity as modified
- `$setIsNotDirty(id)` : Mark an entity as not modified
- `$updateField(field, value, id)` : Update a specific field

### 🔍 **Prefixed Getters**
- `$getOne(id)` : Get an entity by ID
- `$getMany(ids)` : Get multiple entities by IDs
- `$getAll()` : Get all entities
- `$getAllArray()` : Get all entities as an array
- `$getAllIds()` : Get all IDs
- `$getCurrent()` : Get the current entity
- `$getCurrentById()` : Get the current entity by ID
- `$getActive()` : Get active entities
- `$getFirstActive()` : Get the first active entity
- `$getWhere(filter)` : Filter entities
- `$getWhereArray(filter)` : Filter entities as an array
- `$getFirstWhere(filter)` : Get the first filtered entity
- `$getIsEmpty()` : Check if the store is empty
- `$getIsNotEmpty()` : Check if the store is not empty
- `$isAlreadyInStore(id)` : Check if an entity exists
- `$isAlreadyActive(id)` : Check if an entity is active
- `$isDirty(id)` : Check if an entity has been modified
- `$search(field)` : Search in entities
- `$getMissingIds(ids)` : Get missing IDs
- `$getMissingEntities(entities)` : Get missing entities

## 📖 Usage Examples

### Simple Store with Plugin

```typescript
import { defineStore } from 'pinia'
import type { WithId } from '@entity-store/types'

interface User extends WithId {
  name: string
  email: string
  age: number
}

// Create a normal store - the plugin automatically adds entity functionality
export const useUserStore = defineStore('users', {
  state: () => ({
    // Your custom state
    isLoading: false,
    error: null,
    // The plugin automatically adds $entities
  }),
  
  actions: {
    // Your custom actions
    async fetchUsers() {
      this.isLoading = true
      try {
        const users: User[] = await api.getUsers()
        // Using plugin methods
        this.$createMany(users)
      } catch (error) {
        this.error = error.message
      } finally {
        this.isLoading = false
      }
    },
    
    // You can still use your custom actions
    customAction() {
      // Access entities via the plugin
      const allUsers = this.$getAllArray()
      console.log('Total users:', allUsers.length)
    }
  },
  
  getters: {
    // Your custom getters
    getUsersByAge: (state) => (minAge: number) => {
      // Using plugin getters
      return state.$getWhereArray((user) => user.age >= minAge)
    },
    
    getActiveUsersCount: (state) => () => {
      // Using plugin getters
      return state.$getActive().length
    }
  }
})
```

### Usage in a Component

```typescript
import { useUserStore } from '@/stores/users'

export default {
  setup() {
    const userStore = useUserStore()
    
    // Using plugin methods
    const createUser = (user: User) => {
      userStore.$createOne(user)
    }
    
    const getUser = (id: string | number) => {
      return userStore.$getOne(id)
    }
    
    const getAllUsers = () => {
      return userStore.$getAllArray()
    }
    
    const updateUser = (id: string | number, updates: Partial<User>) => {
      const existingUser = userStore.$getOne(id)
      if (existingUser) {
        userStore.$updateOne(id, { ...existingUser, ...updates })
      }
    }
    
    const deleteUser = (id: string | number) => {
      userStore.$deleteOne(id)
    }
    
    const setCurrentUser = (user: User) => {
      userStore.$setCurrent(user)
    }
    
    const getCurrentUser = () => {
      return userStore.$getCurrent()
    }
    
    return {
      // State
      users: userStore.$entities,
      isLoading: userStore.isLoading,
      error: userStore.error,
      
      // Plugin methods
      createUser,
      getUser,
      getAllUsers,
      updateUser,
      deleteUser,
      setCurrentUser,
      getCurrentUser,
      
      // Custom methods
      fetchUsers: userStore.fetchUsers,
      getUsersByAge: userStore.getUsersByAge,
    }
  }
}
```

## 🔄 Coexistence with the Adapter

This plugin coexists perfectly with the existing adapter:

- **Plugin**: Adds functionality to ALL stores (prefixed with `$`)
- **Adapter**: Creates specialized stores with all functionality integrated

You can use both approaches in the same project without conflicts.

## 🎯 Plugin Advantages

1. **Non-intrusive**: Doesn't affect your existing stores
2. **Automatic**: Applies to all stores created after installation
3. **Prefixed**: All added properties have the `$` prefix to avoid conflicts
4. **Type-safe**: Complete TypeScript support
5. **Performant**: Uses the existing core for business logic
6. **Devtools**: Complete integration with Pinia development tools

## 🧪 Tests

```bash
# Run plugin tests
pnpm test plugin/plugin.test.ts
```

## 📚 Documentation

- [Core Documentation](../../../packages/core/README.md)
- [Types Documentation](../../../packages/types/README.md)
- [Pinia Adapter Documentation](../README.md)
