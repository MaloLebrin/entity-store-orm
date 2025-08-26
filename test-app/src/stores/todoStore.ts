import { createPiniaEntityStore } from 'entity-store'

// Define the Todo entity interface
export interface Todo {
  id: number
  title: string
  description: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
  updatedAt: Date
}

// Create the store using our adapter
export const useTodoStore = createPiniaEntityStore<Todo>('todos')

// Helper function to create a new todo
export function createTodo(
  title: string,
  description: string,
  priority: Todo['priority'] = 'medium'
): Todo {
  const now = new Date()
  return {
    id: Date.now() + Math.random(), // Simple ID generation for demo
    title,
    description,
    completed: false,
    priority,
    createdAt: now,
    updatedAt: now
  }
}

// Helper function to update a todo
export function updateTodo(
  id: number,
  updates: Partial<Omit<Todo, 'id' | 'createdAt'>>
): void {
  const store = useTodoStore()
  const current = store.getOne()(id)
  
  if (current) {
    const updatedTodo: Todo = {
      ...current,
      ...updates,
      updatedAt: new Date()
    }
    store.updateOne(id, updatedTodo)
  }
}
