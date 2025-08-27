# Pinia Entity Store Adapter

Un adaptateur Pinia pour le système de gestion d'entités agnostique, permettant de créer des stores avec gestion complète des entités tout en conservant la flexibilité de Pinia.

## 📦 Installation

```bash
pnpm add entity-store
```

## 🚀 Utilisation de base

```typescript
import { createPiniaEntityStore } from 'entity-store/adapters/pinia'

interface Todo {
  id: number
  title: string
  completed: boolean
}

// Créer un store basique
export const useTodoStore = createPiniaEntityStore<Todo>('todos')
```

## ✨ Fonctionnalités

### Gestion automatique des entités

Le store inclut automatiquement toutes les méthodes de gestion d'entités :

- **Getters** : `getOne`, `getAll`, `getAllArray`, `getAllIds`, `getCurrent`, `getActive`, etc.
- **Actions** : `createOne`, `createMany`, `updateOne`, `deleteOne`, `setCurrent`, `setActive`, etc.
- **État** : `byId`, `allIds`, `current`, `currentById`, `active`, `$isDirty`

### Extension avec des getters personnalisés

```typescript
export const useTodoStore = createPiniaEntityStore<Todo>('todos', {
  getters: {
    // Getter personnalisé : obtenir les todos par priorité
    getTodosByPriority: (store) => (priority: 'low' | 'medium' | 'high') => {
      const getWhere = store.getWhere()
      return getWhere(todo => todo.priority === priority)
    },
    
    // Getter personnalisé : compter les todos complétés
    getCompletedCount: (store) => () => {
      const getWhere = store.getWhere()
      return Object.keys(getWhere(todo => todo.completed)).length
    }
  }
})
```

### Extension avec des actions personnalisées

```typescript
export const useTodoStore = createPiniaEntityStore<Todo>('todos', {
  actions: {
    // Action personnalisée : basculer la completion d'un todo
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
    
    // Action personnalisée : compléter tous les todos
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

### Extension avec un état personnalisé

```typescript
export const useTodoStore = createPiniaEntityStore<Todo>('todos', {
  state: {
    // État UI personnalisé
    ui: {
      isLoading: false,
      error: null as string | null
    },
    
    // Filtres personnalisés
    filters: {
      showCompleted: true,
      priorityFilter: null as 'low' | 'medium' | 'high' | null
    }
  }
})
```

### Extension complète (état + getters + actions)

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
    // Getter personnalisé : obtenir les todos filtrés et triés
    getFilteredTodos: (store) => () => {
      let todos = store.getAllArray()
      
      // Appliquer les filtres
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
      
      // Appliquer le tri
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
    
    // Getter personnalisé : obtenir tous les tags disponibles
    getAvailableTags: (store) => () => {
      const allTags = new Set<string>()
      store.getAllArray().forEach(todo => {
        todo.tags.forEach(tag => allTags.add(tag))
      })
      return Array.from(allTags).sort()
    }
  },
  
  actions: {
    // Actions personnalisées pour l'UI
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
    
    // Actions personnalisées pour les filtres
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

## 🎯 Utilisation dans un composant Vue

```vue
<template>
  <div>
    <!-- État UI -->
    <div v-if="todoStore.entities.ui.isLoading">Chargement...</div>
    <div v-if="todoStore.entities.ui.error" class="error">{{ todoStore.entities.ui.error }}</div>
    
    <!-- Contrôles de tri -->
    <select v-model="todoStore.entities.ui.sortBy">
      <option value="createdAt">Date de création</option>
      <option value="updatedAt">Date de modification</option>
      <option value="priority">Priorité</option>
      <option value="title">Titre</option>
    </select>
    
    <button @click="todoStore.setSortOrder(todoStore.entities.ui.sortOrder === 'asc' ? 'desc' : 'asc')">
      {{ todoStore.entities.ui.sortOrder === 'asc' ? '↑' : '↓' }}
    </button>
    
    <!-- Filtres -->
    <label>
      <input 
        type="checkbox" 
        v-model="todoStore.entities.filters.showCompleted"
        @change="todoStore.toggleFilter('showCompleted')"
      />
      Afficher les complétés
    </label>
    
    <select v-model="todoStore.entities.filters.priorityFilter">
      <option value="">Toutes les priorités</option>
      <option value="high">Haute</option>
      <option value="medium">Moyenne</option>
      <option value="low">Basse</option>
    </select>
    
    <button @click="todoStore.clearFilters()">Réinitialiser les filtres</button>
    
    <!-- Liste des todos -->
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
    
    <!-- Actions en lot -->
    <button @click="todoStore.completeAll()">Tout compléter</button>
    
    <!-- Statistiques -->
    <div>
      Total: {{ todoStore.getAllIds().length }} |
      Complétés: {{ todoStore.getCompletedCount() }} |
      Haute priorité: {{ Object.keys(todoStore.getHighPriorityTodos()).length }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTodoStore } from './stores/todoStore'

const todoStore = useTodoStore()

// Utiliser le getter personnalisé
const filteredTodos = computed(() => todoStore.getFilteredTodos())

// Fonction pour ajouter un tag
const addTag = (id: number) => {
  const tag = prompt('Entrez un tag:')
  if (tag) {
    todoStore.addTag(id, tag)
  }
}

// Initialiser avec des données d'exemple
const initializeStore = () => {
  if (todoStore.getIsEmpty()) {
    const sampleTodos = [
      { 
        id: 1, 
        title: 'Apprendre Vue 3', 
        description: 'Maîtriser la Composition API', 
        completed: false, 
        priority: 'high' as const, 
        tags: ['vue', 'learning'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 2, 
        title: 'Construire Entity Store', 
        description: 'Créer un système robuste', 
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

// Initialiser au montage
onMounted(() => {
  initializeStore()
})
</script>
```

## 🔧 Améliorations de typage TypeScript

L'adaptateur utilise maintenant des types Pinia natifs au lieu de `any`, offrant une meilleure sécurité des types :

### Types exportés

```typescript
import { 
  createPiniaEntityStore, 
  type BaseEntityStore,
  type PiniaEntityStore 
} from 'entity-store/adapters/pinia'

// BaseEntityStore<T> - Type de base avec toutes les méthodes d'entités
// PiniaEntityStore<T> - Type du store instancié
```

### Typage des getters et actions personnalisés

```typescript
// Les getters et actions reçoivent le store typé
getTodosByPriority: (store: BaseEntityStore<Todo>) => (priority: Todo['priority']) => {
  // store est entièrement typé avec toutes les méthodes d'entités
  const getWhere = store.getWhere()
  return getWhere(todo => todo.priority === priority)
}
```

### Typage de l'état personnalisé

```typescript
// L'état personnalisé est fusionné avec l'état des entités
state: {
  ui: {
    isLoading: false,
    error: null as string | null
  } as TodoUIState
}

// TypeScript sait que store.entities.ui existe et est typé
store.entities.ui.isLoading = true // ✅ TypeScript accepte boolean
```

### Avantages du nouveau système de types

1. **Sécurité des types** : Plus de `any`, tous les types sont vérifiés
2. **Autocomplétion** : IntelliSense complet pour toutes les méthodes
3. **Vérification d'erreurs** : TypeScript détecte les erreurs à la compilation
4. **Types Pinia natifs** : Compatibilité parfaite avec l'écosystème Pinia
5. **Extensibilité** : Types génériques pour tous les cas d'usage

## ✨ Avantages

1. **Flexibilité maximale** : Étendez vos stores comme dans un store Pinia classique
2. **Gestion automatique des entités** : Toutes les méthodes de base sont incluses
3. **Type safety avancé** : Support TypeScript complet avec types Pinia natifs
4. **Performance** : Utilise la réactivité native de Pinia
5. **Extensibilité** : Ajoutez facilement des getters, actions et état personnalisés
6. **Compatibilité** : Fonctionne avec tous les plugins Pinia existants
7. **Simplicité** : Une seule fonction avec des options intégrées

## 📚 API complète

### Options de configuration

```typescript
interface PiniaEntityStoreOptions<T extends WithId> {
  getters?: Record<string, (store: BaseEntityStore<T>) => (...args: unknown[]) => unknown>
  actions?: Record<string, (store: BaseEntityStore<T>) => (...args: unknown[]) => unknown>
  state?: Record<string, unknown>
  storeName?: string
}
```

### Méthodes de base incluses

- **Getters** : `getOne`, `getAll`, `getAllArray`, `getAllIds`, `getCurrent`, `getActive`, `getWhere`, `getWhereArray`, `getFirstWhere`, `getMissingIds`, `getIsEmpty`, `isDirty`
- **Actions** : `createOne`, `createMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`, `setCurrent`, `setCurrentById`, `removeCurrent`, `removeCurrentById`, `setActive`, `resetActive`, `setIsDirty`, `setIsNotDirty`

### État de base

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

## 🎯 Bonnes pratiques

1. **Getters personnalisés** : Utilisez-les pour la logique de filtrage, tri et calculs
2. **Actions personnalisées** : Utilisez-les pour les opérations métier complexes
3. **État personnalisé** : Utilisez-le pour l'état UI, les filtres et la configuration
4. **Type safety** : Définissez des interfaces claires pour vos entités et extensions
5. **Réactivité** : Profitez de la réactivité automatique de Pinia pour vos extensions
6. **Types stricts** : Utilisez des types union et des assertions de type pour plus de sécurité

## 🚀 Cas d'usage avancés

- **Gestion des formulaires** : État de validation, erreurs, soumission
- **Filtrage et recherche** : Filtres complexes, recherche en temps réel
- **Gestion des permissions** : Vérification des droits d'accès
- **Synchronisation** : État de synchronisation avec le serveur
- **Historique** : Gestion des actions annuler/rétablir
- **Mode hors ligne** : État de connectivité et cache local
