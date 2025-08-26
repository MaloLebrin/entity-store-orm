/**
 * Simple demonstration of the Pinia adapter usage
 * This file shows the basic API without Vue dependencies
 */

import { createPiniaEntityStore } from '../src/adapters/pinia/index.js'
import type { WithId } from '../src/types/WithId.js'

// Define a simple entity
interface Todo extends WithId {
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

// Create the store
const useTodoStore = createPiniaEntityStore<Todo>('todos')

// Demonstrate basic usage
function demonstrateTodoStore() {
  console.log('🚀 Creating Pinia entity store for todos...')
  
  // Create the store instance
  const todoStore = useTodoStore()
  
  // Add some initial todos
  const initialTodos: Todo[] = [
    { id: 1, title: 'Learn TypeScript', completed: false, priority: 'high' },
    { id: 2, title: 'Build entity store', completed: false, priority: 'high' },
    { id: 3, title: 'Write tests', completed: true, priority: 'medium' },
    { id: 4, title: 'Document code', completed: false, priority: 'low' }
  ]
  
  console.log('📝 Adding initial todos...')
  todoStore.createMany(initialTodos)
  
  // Set current todo
  todoStore.setCurrent(initialTodos[0])
  todoStore.setCurrentById(1)
  
  // Set some todos as active
  todoStore.setActive(1)
  todoStore.setActive(2)
  
  console.log('✅ Initial state:')
  console.log('- All todos:', todoStore.getAllArray())
  console.log('- Current todo:', todoStore.getCurrent())
  console.log('- Active todo IDs:', todoStore.getActive())
  console.log('- Is empty:', todoStore.getIsEmpty())
  console.log('- Total count:', todoStore.getAllIds().length)
  
  // Update a todo
  console.log('\n🔄 Updating first todo...')
  todoStore.updateOne(1, { ...initialTodos[0], completed: true })
  
  // Add a new todo
  console.log('➕ Adding new todo...')
  const newTodo: Todo = { id: 5, title: 'Deploy to production', completed: false, priority: 'high' }
  todoStore.createOne(newTodo)
  
  // Demonstrate filtering
  console.log('\n🔍 Filtering todos...')
  const getWhere = todoStore.getWhere()
  const highPriorityTodos = getWhere(todo => todo.priority === 'high')
  const completedTodos = getWhere(todo => todo.completed)
  
  const getWhereArray = todoStore.getWhereArray()
  const highPriorityArray = getWhereArray(todo => todo.priority === 'high')
  const completedArray = getWhereArray(todo => todo.completed)
  
  console.log('- High priority todos (object):', highPriorityTodos)
  console.log('- High priority todos (array):', highPriorityArray)
  console.log('- Completed todos (object):', completedTodos)
  console.log('- Completed todos (array):', completedArray)
  
  // Demonstrate entity queries
  console.log('\n🔎 Entity queries...')
  const getOne = todoStore.getOne()
  const getMany = todoStore.getMany()
  
  console.log('- Todo with ID 1:', getOne(1))
  console.log('- Todos with IDs 1,2,3:', getMany([1, 2, 3]))
  console.log('- Missing IDs [1,2,5,6]:', todoStore.getMissingIds()([1, 2, 5, 6]))
  console.log('- Is todo 1 in store:', todoStore.isAlreadyInStore()(1))
  console.log('- Is todo 1 active:', todoStore.isAlreadyActive()(1))
  console.log('- Is todo 1 dirty:', todoStore.isDirty()(1))
  
  // Demonstrate active management
  console.log('\n🎯 Active todo management...')
  todoStore.setActive(3)
  todoStore.setActive(4)
  console.log('- Active todos:', todoStore.getActive())
  console.log('- First active:', todoStore.getFirstActive())
  
  // Reset active
  todoStore.resetActive()
  console.log('- After reset active:', todoStore.getActive())
  
  // Demonstrate dirty state
  console.log('\n💾 Dirty state management...')
  todoStore.setIsDirty(2)
  todoStore.setIsDirty(4)
  console.log('- Todo 2 is dirty:', todoStore.isDirty()(2))
  console.log('- Todo 4 is dirty:', todoStore.isDirty()(4))
  
  // Mark as not dirty
  todoStore.setIsNotDirty(2)
  console.log('- Todo 2 is dirty (after reset):', todoStore.isDirty()(2))
  
  // Demonstrate field updates
  console.log('\n✏️ Field updates...')
  todoStore.updateField('priority', 'medium', 4)
  console.log('- Todo 4 priority updated:', getOne(4)?.priority)
  console.log('- Todo 4 is now dirty:', todoStore.isDirty()(4))
  
  // Final state
  console.log('\n🎉 Final state:')
  console.log('- All todos:', todoStore.getAllArray())
  console.log('- Current todo:', todoStore.getCurrent())
  console.log('- Active todos:', todoStore.getActive())
  console.log('- Total count:', todoStore.getAllIds().length)
  console.log('- Is empty:', todoStore.getIsEmpty())
  
  return todoStore
}

// Export for use in other files
export { demonstrateTodoStore, useTodoStore }
export type { Todo }

// Run demonstration if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  demonstrateTodoStore()
}
