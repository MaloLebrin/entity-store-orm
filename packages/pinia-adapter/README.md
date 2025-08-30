# @entity-store/pinia-adapter

This package provides two different approaches for using entity management with Pinia:

## 🚀 Two Approaches

### 1. **Plugin Approach** (Recommended for existing stores)

The Pinia plugin automatically adds entity management to **all** your existing stores without code modification.

#### Installation

```bash
npm install @entity-store/pinia-adapter
# or
pnpm add @entity-store/pinia-adapter
# or
yarn add @entity-store/pinia-adapter
```

#### Usage

```typescript
import { createPinia } from 'pinia'
import { entityStorePlugin } from '@entity-store/pinia-adapter'

// Create a Pinia instance
const pinia = createPinia()

// Install the plugin
pinia.use(entityStorePlugin)

// Use Pinia in your Vue app
app.use(pinia)
```

#### Automatically added features

All properties are prefixed with `$` to avoid conflicts:

**State:**
- `$entities` - Complete entity state (byId, allIds, current, active, etc.)

**Actions:**
- `$createOne(entity)` - Create an entity
- `$createMany(entities)` - Create multiple entities
- `$updateOne(id, updates)` - Update an entity
- `$updateMany(updates)` - Update multiple entities
- `$deleteOne(id)` - Delete an entity
- `$deleteMany(ids)` - Delete multiple entities
- `$setCurrent(entity)` - Set the current entity
- `$setActive(id)` - Mark an entity as active
- `$resetActive()` - Reset active entities
- `$setIsDirty(id)` - Mark an entity as modified
- `$updateField(field, value, id)` - Update a specific field

**Getters:**
- `$getOne(id)` - Get an entity by ID
- `$getMany(ids)` - Get multiple entities by IDs
- `$getAll()` - Get all entities
- `$getAllArray()` - Get all entities as array
- `$getAllIds()` - Get all IDs
- `$getCurrent()` - Get the current entity
- `$getActive()` - Get active entities
- `$getWhere(filter)` - Filter entities
- `$search(query)` - Search in entities
- `$isAlreadyInStore(id)` - Check if an entity exists
- `$isDirty(id)` - Check if an entity is modified

#### Complete example

```typescript
import { defineStore } from 'pinia'

// Define a normal store
const useUserStore = defineStore('users', {
  state: () => ({
    customField: 'users'
  }),
  actions: {
    customAction() {
      return 'custom user action'
    }
  }
})

// Use the store
const userStore = useUserStore()

// Entity management is automatically available!
const user = { id: 1, name: 'John Doe', email: 'john@example.com' }

userStore.$createOne(user)
console.log(userStore.$getOne(1)) // { id: 1, name: 'John Doe', email: 'john@example.com', $isDirty: false }
console.log(userStore.$getAllIds()) // ['1']

// The store retains its custom functionality
console.log(userStore.customField) // 'users'
console.log(userStore.customAction()) // 'custom user action'
```

### 2. **Adapter Approach** (For new stores)

The adapter approach creates specialized stores with integrated entity management.

#### Usage

```typescript
import { createPiniaEntityStore } from '@entity-store/pinia-adapter'

interface User {
  id: number
  name: string
  email: string
}

const useUserStore = createPiniaEntityStore<User>('users', {
  state: () => ({
    customField: 'users'
  }),
  actions: {
    customAction() {
      return 'custom user action'
    }
  }
})
```

## 🔧 Configuration

### Plugin options

```typescript
import { entityStorePlugin } from '@entity-store/pinia-adapter'

// The plugin accepts options (currently no options required)
pinia.use(entityStorePlugin())
```

### Helper function

```typescript
import { installEntityStorePlugin } from '@entity-store/pinia-adapter'

// Alternative to pinia.use(entityStorePlugin())
installEntityStorePlugin(pinia)
```

## 🎯 Use Cases

### Plugin Approach - Ideal for:
- **Existing stores** that you don't want to modify
- **Progressive migration** to entity management
- **Applications with many different stores**
- **Maximum reusability**

### Adapter Approach - Ideal for:
- **New stores** specifically designed for entities
- **Maximum type safety** with TypeScript
- **Total control** over store structure
- **Optimized performance** for entities

## 🚀 Plugin Advantages

1. **Zero code modification** - Adds entity management to all your existing stores
2. **Automatic prefixing** - All properties are prefixed with `$` to avoid conflicts
3. **Transparent integration** - Works with all your existing Pinia stores
4. **SSR compatible** - Proper state management for server-side rendering
5. **Integrated DevTools** - All properties are visible in Pinia DevTools
6. **Optimized performance** - Uses the `@entity-store/core` for efficient management

## 📚 API Reference

### Plugin

```typescript
// Installation
pinia.use(entityStorePlugin)

// Helper function
installEntityStorePlugin(pinia)
```

### Types

```typescript
import type { EntityStorePlugin, EntityPluginContext, EntityPluginOptions } from '@entity-store/pinia-adapter'
```

## 🔍 Troubleshooting

### Properties are not added

Make sure the plugin is installed **before** defining your stores:

```typescript
// ✅ Correct
const pinia = createPinia()
pinia.use(entityStorePlugin)
const store = defineStore('test', { ... })

// ❌ Incorrect
const store = defineStore('test', { ... })
pinia.use(entityStorePlugin)
```

### Name conflicts

All properties are prefixed with `$`. If you have properties starting with `$` in your stores, they will not be overwritten.

## 🎉 Conclusion

The Pinia plugin offers an elegant and non-intrusive solution for adding entity management to all your existing stores. It allows you to benefit from all the features of `@entity-store/core` without modifying your existing code.

**Recommendation:** Start with the plugin for your existing stores, and use the adapter for new stores that require specialized entity management.
