import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { createPiniaEntityStore } from './index.js'

interface Todo {
  id: number
  title: string
  description: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  tags: string[]
}

describe('Pinia Adapter Extensions', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('Custom Getters', () => {
    test('should add custom getters to the store', () => {
      const useTodoStore = createPiniaEntityStore<Todo>('todos', {
        getters: {
          getTodosByPriority: (store) => (priority: Todo['priority']) => {
            const getWhere = store.getWhere()
            return getWhere(todo => todo.priority === priority)
          },
          getCompletedCount: (store) => () => {
            const getWhere = store.getWhere()
            return Object.keys(getWhere(todo => todo.completed)).length
          },
          getTodosByTag: (store) => (tag: string) => {
            const getWhere = store.getWhere()
            return getWhere(todo => todo.tags.includes(tag))
          },
          getHighPriorityTodos: (store) => () => {
            const getWhere = store.getWhere()
            return getWhere(todo => todo.priority === 'high')
          }
        }
      })

      const store = useTodoStore()
      
      // Add some todos
      const todos: Todo[] = [
        { id: 1, title: 'High Priority', description: 'Important', completed: false, priority: 'high', tags: [] },
        { id: 2, title: 'Medium Priority', description: 'Normal', completed: true, priority: 'medium', tags: [] },
        { id: 3, title: 'Low Priority', description: 'Minor', completed: false, priority: 'low', tags: [] }
      ]
      
      store.createMany(todos)
      
      // Test custom getters
      const highPriorityTodos = store.getTodosByPriority('high')
      expect(Object.keys(highPriorityTodos)).toHaveLength(1)
      expect(highPriorityTodos[1].title).toBe('High Priority')
      
      const completedCount = store.getCompletedCount()
      expect(completedCount).toBe(1)
    })
  })

  describe('Custom Actions', () => {
    test('should add custom actions to the store', () => {
      const useTodoStore = createPiniaEntityStore<Todo>('todos', {
        actions: {
          toggleTodo: (store) => (id: number) => {
            const current = store.getOne()(id)
            if (current) {
              const updatedTodo: Todo = {
                ...current,
                completed: !current.completed
              }
              store.updateOne(id, updatedTodo)
            }
          },
          addTag: (store) => (id: number, tag: string) => {
            const current = store.getOne()(id)
            if (current && !current.tags.includes(tag)) {
              const updatedTodo: Todo = {
                ...current,
                tags: [...current.tags, tag]
              }
              store.updateOne(id, updatedTodo)
            }
          }
        }
      })

      const store = useTodoStore()
      
      // Add a todo
      const todo: Todo = { 
        id: 1, 
        title: 'Test Todo', 
        description: 'Test', 
        completed: false, 
        priority: 'medium', 
        tags: [] 
      }
      store.createOne(todo)
      
      // Test custom actions
      store.toggleTodo(1)
      expect(store.getOne()(1)?.completed).toBe(true)
      
      store.addTag(1, 'important')
      expect(store.getOne()(1)?.tags).toContain('important')
    })
  })

  describe('Custom State', () => {
    test('should add custom state to the store', () => {
      const useTodoStore = createPiniaEntityStore<Todo>('todos', {
        state: {
          ui: {
            isLoading: false,
            error: null as string | null
          },
          filters: {
            showCompleted: true,
            priorityFilter: null as Todo['priority'] | null
          }
        }
      })

      const store = useTodoStore()
      
      // Test custom state
      expect(store.entities.ui).toBeDefined()
      expect(store.entities.ui.isLoading).toBe(false)
      expect(store.entities.filters.showCompleted).toBe(true)
      
      // Modify custom state
      store.entities.ui.isLoading = true
      store.entities.filters.showCompleted = false
      
      expect(store.entities.ui.isLoading).toBe(true)
      expect(store.entities.filters.showCompleted).toBe(false)
    })
  })

  describe('Full Extension', () => {
    test('should combine custom state, getters, and actions', () => {
      const useTodoStore = createPiniaEntityStore<Todo>('todos', {
        state: {
          ui: { isLoading: false, error: null as string | null },
          filters: { showCompleted: true }
        },
        getters: {
          getFilteredTodos: (store) => () => {
            let todos = store.getAllArray()
            if (!store.entities.filters.showCompleted) {
              todos = todos.filter(todo => !todo.completed)
            }
            return todos
          }
        },
        actions: {
          setLoading: (store) => (loading: boolean) => {
            store.entities.ui.isLoading = loading
          },
          toggleFilter: (store) => () => {
            store.entities.filters.showCompleted = !store.entities.filters.showCompleted
          }
        }
      })

      const store = useTodoStore()
      
      // Add todos
      const todos: Todo[] = [
        { id: 1, title: 'Todo 1', description: 'Test 1', completed: false, priority: 'high', tags: [] },
        { id: 2, title: 'Todo 2', description: 'Test 2', completed: true, priority: 'medium', tags: [] }
      ]
      store.createMany(todos)
      
      // Test custom state
      expect(store.entities.ui.isLoading).toBe(false)
      expect(store.entities.filters.showCompleted).toBe(true)
      
      // Test custom getter
      let filteredTodos = store.getFilteredTodos()
      expect(filteredTodos).toHaveLength(2) // Both todos shown
      
      // Test custom actions
      store.setLoading(true)
      expect(store.entities.ui.isLoading).toBe(true)
      
      store.toggleFilter()
      expect(store.entities.filters.showCompleted).toBe(false)
      
      // Test that getter responds to state changes
      filteredTodos = store.getFilteredTodos()
      expect(filteredTodos).toHaveLength(1) // Only incomplete todo shown
    })
  })

  describe('Store Name Override', () => {
    test('should allow custom store name', () => {
      const useTodoStore = createPiniaEntityStore<Todo>('default-name', {
        storeName: 'custom-name'
      })

      const store = useTodoStore()
      // The store should work normally even with a custom name
      expect(store.entities).toBeDefined()
    })
  })

  describe('Type Safety', () => {
    test('should maintain type safety with custom extensions', () => {
      const useTodoStore = createPiniaEntityStore<Todo>('todos', {
        getters: {
          getTypedGetters: (store) => (id: number) => {
            const todo = store.getOne()(id)
            return todo ? todo.priority : null
          }
        },
        actions: {
          setTypedActions: (store) => (id: number, priority: Todo['priority']) => {
            const current = store.getOne()(id)
            if (current) {
              store.updateOne(id, { ...current, priority })
            }
          }
        }
      })

      const store = useTodoStore()
      
      // Add a todo first
      const todo: Todo = { 
        id: 1, 
        title: 'Test', 
        description: 'Test', 
        completed: false, 
        priority: 'medium', 
        tags: [] 
      }
      store.createOne(todo)
      
      // This should compile without type errors
      const priority = store.getTypedGetters(1)
      store.setTypedActions(1, 'high')
      
      expect(priority).toBe('medium') // Should return the priority
    })
  })
})
