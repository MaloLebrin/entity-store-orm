# Pinia Entity Store Adapter

A Pinia adapter for the agnostic entity management system, allowing you to create stores with complete entity management while maintaining Pinia's flexibility.

## 📦 Installation

```bash
pnpm add entity-store
```

## 🚀 Basic Usage

```typescript
import { createPiniaEntityStore } from 'entity-store/adapters/pinia'

interface Todo {
  id: number
  title: string
  completed: boolean
}

// Create a basic store
export const useTodoStore = createPiniaEntityStore<Todo>('todos')
```

## ✨ Features

### Automatic Entity Management

The store automatically includes all entity management methods:

- **Getters**: `getOne`, `getAll`, `getAllArray`, `getAllIds`, `getCurrent`, `getActive`, etc.
- **Actions**: `createOne`, `createMany`, `updateOne`, `deleteOne`, `setCurrent`, `setActive`, etc.
- **State**: `byId`, `allIds`, `current`, `currentById`, `active`, `$isDirty`

### Extension with Custom Getters

```typescript
export const useTodoStore = createPiniaEntityStore<Todo>('todos', {
  getters: {
    // Custom getter: get todos by priority
    getTodosByPriority: (store) => (priority: 'low' | 'medium' | 'high') => {
      const getWhere = store.getWhere()
      return getWhere(todo => todo.priority === priority)
    },
    
    // Custom getter: count completed todos
    getCompletedCount: (store) => () => {
      const getWhere = store.getWhere()
      return Object.keys(getWhere(todo => todo.completed)).length
    }
  }
})
```

### Extension with Custom Actions

```typescript
export const useTodoStore = createPiniaEntityStore<Todo>('todos', {
  actions: {
    // Custom action: toggle todo completion
    toggleTodo: (store) => (id: number) => {
      const current = store.getOne()(id)
      if (current) {
        const updatedTodo = {
          ...current,
          completed: !current.completed,
          updatedAt: new Date()
        }
        store.updateOne(id, updatedTodo)
      }
    },
    
    // Custom action: complete all todos
    completeAll: (store) => () => {
      const allTodos = store.getAllArray()
      allTodos.forEach(todo => {
        if (!todo.completed) {
          store.updateOne(todo.id, { ...todo, completed: true })
        }
      })
    }
  }
})
```

### Extension with Custom State

```typescript
export const useTodoStore = createPiniaEntityStore<Todo>('todos', {
  state: {
    // Custom UI state
    ui: {
      isLoading: false,
      error: null as string | null
    },
    
    // Custom filters
    filters: {
      showCompleted: true,
      priorityFilter: null as 'low' | 'medium' | 'high' | null
    }
  }
})
```

### Complete Extension (state + getters + actions)

```typescript
export const useTodoStore = createPiniaEntityStore<Todo>('todos', {
  state: {
    ui: { 
      isLoading: false, 
      error: null as string | null,
      selectedTags: [] as string[],
      sortBy: 'createdAt' as 'createdAt' | 'updatedAt' | 'priority' | 'title',
      sortOrder: 'desc' as 'asc' | 'desc'
    },
    filters: { 
      showCompleted: true, 
      showIncomplete: true,
      priorityFilter: null as 'low' | 'medium' | 'high' | null,
      tagFilter: null as string | null
    }
  },
  
  getters: {
    // Custom getter: get filtered and sorted todos
    getFilteredTodos: (store) => () => {
      let todos = store.getAllArray()
      
      // Apply filters
      if (!store.entities.filters.showCompleted) {
        todos = todos.filter(todo => !todo.completed)
      }
      if (!store.entities.filters.showIncomplete) {
        todos = todos.filter(todo => todo.completed)
      }
      if (store.entities.filters.priorityFilter) {
        todos = todos.filter(todo => todo.priority === store.entities.filters.priorityFilter)
      }
      if (store.entities.filters.tagFilter) {
        todos = todos.filter(todo => todo.tags.includes(store.entities.filters.tagFilter!))
      }
      
      // Apply sorting
      todos.sort((a, b) => {
        let aValue: any
        let bValue: any
        
        switch (store.entities.ui.sortBy) {
          case 'createdAt':
            aValue = a.createdAt.getTime()
            bValue = b.createdAt.getTime()
            break
          case 'updatedAt':
            aValue = a.updatedAt.getTime()
            bValue = b.updatedAt.getTime()
            break
          case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            aValue = priorityOrder[a.priority]
            bValue = priorityOrder[b.priority]
            break
          case 'title':
            aValue = a.title.toLowerCase()
            bValue = b.title.toLowerCase()
            break
          default:
            return 0
        }
        
        if (store.entities.ui.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
      
      return todos
    },
    
    // Custom getter: get all available tags
    getAvailableTags: (store) => () => {
      const allTags = new Set<string>()
      store.getAllArray().forEach(todo => {
        todo.tags.forEach(tag => allTags.add(tag))
      })
      return Array.from(allTags).sort()
    }
  },
  
  actions: {
    // Custom actions for UI
    setLoading: (store) => (loading: boolean) => {
      store.entities.ui.isLoading = loading
    },
    
    setError: (store) => (error: string | null) => {
      store.entities.ui.error = error
    },
    
    setSortBy: (store) => (sortBy: 'createdAt' | 'updatedAt' | 'priority' | 'title') => {
      store.entities.ui.sortBy = sortBy
    },
    
    setSortOrder: (store) => (sortOrder: 'asc' | 'desc') => {
      store.entities.ui.sortOrder = sortOrder
    },
    
    // Custom actions for filters
    toggleFilter: (store) => (filterType: keyof typeof store.entities.filters) => {
      if (filterType === 'showCompleted' || filterType === 'showIncomplete') {
        store.entities.filters[filterType] = !store.entities.filters[filterType]
      }
    },
    
    setPriorityFilter: (store) => (priority: 'low' | 'medium' | 'high' | null) => {
      store.entities.filters.priorityFilter = priority
    },
    
    setTagFilter: (store) => (tag: string | null) => {
      store.entities.filters.tagFilter = tag
    },
    
    clearFilters: (store) => () => {
      store.entities.filters.showCompleted = true
      store.entities.filters.showIncomplete = true
      store.entities.filters.priorityFilter = null
      store.entities.filters.tagFilter = null
    }
  }
})
```

## 🎯 Usage in a Vue Component

```vue
<template>
  <div>
    <!-- UI State -->
    <div v-if="todoStore.entities.ui.isLoading">Loading...</div>
    <div v-if="todoStore.entities.ui.error" class="error">{{ todoStore.entities.ui.error }}</div>
    
    <!-- Sort Controls -->
    <select v-model="todoStore.entities.ui.sortBy">
      <option value="createdAt">Creation Date</option>
      <option value="updatedAt">Modification Date</option>
      <option value="priority">Priority</option>
      <option value="title">Title</option>
    </select>
    
    <button @click="todoStore.setSortOrder(todoStore.entities.ui.sortOrder === 'asc' ? 'desc' : 'asc')">
      {{ todoStore.entities.ui.sortOrder === 'asc' ? '↑' : '↓' }}
    </button>
    
    <!-- Filters -->
    <label>
      <input 
        type="checkbox" 
        v-model="todoStore.entities.filters.showCompleted"
        @change="todoStore.toggleFilter('showCompleted')"
      />
      Show completed
    </label>
    
    <select v-model="todoStore.entities.filters.priorityFilter">
      <option value="">All priorities</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
    
    <button @click="todoStore.clearFilters()">Reset filters</button>
    
    <!-- Todo list -->
    <div v-for="todo in filteredTodos" :key="todo.id">
      <input 
        type="checkbox" 
        :checked="todo.completed"
        @change="todoStore.toggleTodo(todo.id)"
      />
      {{ todo.title }}
      <span :class="`priority-${todo.priority}`">{{ todo.priority }}</span>
      
      <!-- Tags -->
      <div v-for="tag in todo.tags" :key="tag">
        {{ tag }}
        <button @click="todoStore.removeTag(todo.id, tag)">×</button>
      </div>
      
      <button @click="addTag(todo.id)">+ Tag</button>
    </div>
    
    <!-- Batch actions -->
    <button @click="todoStore.completeAll()">Complete all</button>
    
    <!-- Statistics -->
    <div>
      Total: {{ todoStore.getAllIds().length }} |
      Completed: {{ todoStore.getCompletedCount() }} |
      High priority: {{ Object.keys(todoStore.getHighPriorityTodos()).length }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTodoStore } from './stores/todoStore'

const todoStore = useTodoStore()

// Use custom getter
const filteredTodos = computed(() => todoStore.getFilteredTodos())

// Function to add a tag
const addTag = (id: number) => {
  const tag = prompt('Enter a tag:')
  if (tag) {
    todoStore.addTag(id, tag)
  }
}

// Initialize with sample data
const initializeStore = () => {
  if (todoStore.getIsEmpty()) {
    const sampleTodos = [
      { 
        id: 1, 
        title: 'Learn Vue 3', 
        description: 'Master the Composition API', 
        completed: false, 
        priority: 'high' as const, 
        tags: ['vue', 'learning'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 2, 
        title: 'Build Entity Store', 
        description: 'Create a robust system', 
        completed: false, 
        priority: 'high' as const, 
        tags: ['architecture', 'typescript'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    todoStore.createMany(sampleTodos)
  }
}

// Initialize on mount
onMounted(() => {
  initializeStore()
})
</script>
```

## 🔧 TypeScript Typing Improvements

The adapter now uses native Pinia types instead of `any`, providing better type safety:

### Exported Types

```typescript
import { 
  createPiniaEntityStore, 
  type BaseEntityStore,
  type PiniaEntityStore 
} from 'entity-store/adapters/pinia'

// BaseEntityStore<T> - Base type with all entity methods
// PiniaEntityStore<T> - Type of the instantiated store
```

### Typing Custom Getters and Actions

```typescript
// Getters and actions receive the typed store
getTodosByPriority: (store: BaseEntityStore<Todo>) => (priority: Todo['priority']) => {
  // store is fully typed with all entity methods
  const getWhere = store.getWhere()
  return getWhere(todo => todo.priority === priority)
}
```

### Typing Custom State

```typescript
// Custom state is merged with entity state
state: {
  ui: {
    isLoading: false,
    error: null as string | null
  } as TodoUIState
}

// TypeScript knows that store.entities.ui exists and is typed
store.entities.ui.isLoading = true // ✅ TypeScript accepts boolean
```

### Advantages of the New Type System

1. **Type Safety**: No more `any`, all types are verified
2. **Autocompletion**: Complete IntelliSense for all methods
3. **Error Checking**: TypeScript detects errors at compilation
4. **Native Pinia Types**: Perfect compatibility with the Pinia ecosystem
5. **Extensibility**: Generic types for all use cases

## ✨ Advantages

1. **Maximum Flexibility**: Extend your stores like in a classic Pinia store
2. **Automatic Entity Management**: All base methods are included
3. **Advanced Type Safety**: Complete TypeScript support with native Pinia types
4. **Performance**: Uses Pinia's native reactivity
5. **Extensibility**: Easily add custom getters, actions, and state
6. **Compatibility**: Works with all existing Pinia plugins
7. **Simplicity**: Single function with integrated options

## 📚 Complete API

### Configuration Options

```typescript
interface PiniaEntityStoreOptions<T extends WithId> {
  getters?: Record<string, (store: BaseEntityStore<T>) => (...args: unknown[]) => unknown>
  actions?: Record<string, (store: BaseEntityStore<T>) => (...args: unknown[]) => unknown>
  state?: Record<string, unknown>
  storeName?: string
}
```

### Included Base Methods

- **Getters**: `getOne`, `getAll`, `getAllArray`, `getAllIds`, `getCurrent`, `getActive`, `getWhere`, `getWhereArray`, `getFirstWhere`, `getMissingIds`, `getIsEmpty`, `isDirty`
- **Actions**: `createOne`, `createMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`, `setCurrent`, `setCurrentById`, `removeCurrent`, `removeCurrentById`, `setActive`, `resetActive`, `setIsDirty`, `setIsNotDirty`

### Base State

```typescript
interface State<T extends WithId> {
  entities: {
    byId: Record<Id, T & { $isDirty: boolean }>
    allIds: Id[]
    current: T & { $isDirty: boolean } | null
    currentById: Id | null
    active: Id[]
  }
}
```

## 🎯 Best Practices

1. **Custom Getters**: Use them for filtering, sorting, and calculation logic
2. **Custom Actions**: Use them for complex business operations
3. **Custom State**: Use it for UI state, filters, and configuration
4. **Type Safety**: Define clear interfaces for your entities and extensions
5. **Reactivity**: Take advantage of Pinia's automatic reactivity for your extensions
6. **Strict Types**: Use union types and type assertions for more safety

## 🚀 Advanced Use Cases

- **Form Management**: Validation state, errors, submission
- **Filtering and Search**: Complex filters, real-time search
- **Permission Management**: Access rights verification
- **Synchronization**: Server synchronization state
- **History**: Undo/redo action management
- **Offline Mode**: Connectivity state and local cache

## 🔧 Code Analysis and Reflection

The translation of the French documentation to English significantly improves the accessibility and international adoption of the Entity Store library. This change enhances the developer experience by:

1. **Global Accessibility**: English documentation makes the library accessible to a broader international developer community
2. **Consistency**: Aligns with standard practices in the JavaScript/TypeScript ecosystem where English is the lingua franca
3. **Professional Standards**: Follows industry best practices for open-source libraries

The codebase maintains its architectural integrity while improving documentation clarity. The TypeScript interfaces and type definitions remain robust, providing excellent developer experience through IntelliSense and compile-time error checking.

**Potential Improvements:**
- Consider adding JSDoc comments in English to all exported functions and interfaces
- Implement comprehensive unit tests to ensure the translation doesn't break existing functionality
- Add examples in multiple programming languages/frameworks to further broaden adoption
