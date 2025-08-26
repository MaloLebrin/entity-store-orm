<template>
  <div id="app">
    <h1>📝 Entity Store - Pinia Adapter Demo</h1>
    
    <!-- Statistics -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">{{ totalTodos }}</div>
        <div class="stat-label">Total Todos</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ completedTodos }}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ activeTodos }}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dirtyTodos }}</div>
        <div class="stat-label">Modified</div>
      </div>
    </div>

    <!-- Add Todo Form -->
    <div class="container">
      <h2>➕ Add New Todo</h2>
      <form @submit.prevent="addTodo">
        <div class="form-group">
          <label for="title">Title</label>
          <input 
            id="title" 
            v-model="newTodo.title" 
            type="text" 
            placeholder="Enter todo title" 
            required
          />
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <input 
            id="description" 
            v-model="newTodo.description" 
            type="text" 
            placeholder="Enter todo description" 
            required
          />
        </div>
        <div class="form-group">
          <label for="priority">Priority</label>
          <select id="priority" v-model="newTodo.priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button type="submit" class="btn btn-success">Add Todo</button>
      </form>
    </div>

    <!-- Filters -->
    <div class="container">
      <h2>🔍 Filters</h2>
      <div class="filters">
        <div class="filter-group">
          <label>Show Completed:</label>
          <input type="checkbox" v-model="filters.showCompleted" />
        </div>
        <div class="filter-group">
          <label>Priority:</label>
          <select v-model="filters.priority">
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Show Only Dirty:</label>
          <input type="checkbox" v-model="filters.showOnlyDirty" />
        </div>
        <div class="filter-group">
          <label>Show Only Active:</label>
          <input type="checkbox" v-model="filters.showOnlyActive" />
        </div>
      </div>
    </div>

    <!-- Current Todo -->
    <div v-if="currentTodo" class="container">
      <h2>🎯 Current Todo</h2>
      <div class="todo-item current">
        <div class="todo-content">
          <div class="todo-title">{{ currentTodo.title }}</div>
          <div class="todo-meta">{{ currentTodo.description }}</div>
          <div class="todo-status">
            <span class="status-badge status-current">Current</span>
            <span :class="`status-badge status-${currentTodo.priority}`">{{ currentTodo.priority }}</span>
            <span v-if="currentTodo.completed" class="status-badge status-completed">Completed</span>
            <span v-if="currentTodo.$isDirty" class="status-badge status-dirty">Modified</span>
          </div>
        </div>
        <div class="todo-actions">
          <button @click="removeCurrent" class="btn btn-danger">Remove Current</button>
        </div>
      </div>
    </div>

    <!-- Todos List -->
    <div class="container">
      <h2>📋 Todos List</h2>
      <div v-if="filteredTodos.length === 0" class="empty-state">
        <h3>No todos found</h3>
        <p>Try adjusting your filters or add some todos!</p>
      </div>
      <div v-else>
        <div 
          v-for="todo in filteredTodos" 
          :key="todo.id"
          :class="[
            'todo-item',
            { 
              current: isCurrent(todo.id),
              active: isActive(todo.id),
              dirty: todo.$isDirty
            }
          ]"
        >
          <div class="todo-content">
            <div class="todo-title">{{ todo.title }}</div>
            <div class="todo-meta">{{ todo.description }}</div>
            <div class="todo-status">
              <span v-if="isCurrent(todo.id)" class="status-badge status-current">Current</span>
              <span v-if="isActive(todo.id)" class="status-badge status-active">Active</span>
              <span v-if="todo.$isDirty" class="status-badge status-dirty">Modified</span>
              <span v-if="todo.completed" class="status-badge status-completed">Completed</span>
              <span :class="`status-badge status-${todo.priority}`">{{ todo.priority }}</span>
            </div>
          </div>
          <div class="todo-actions">
            <button @click="setCurrent(todo)" class="btn">Set Current</button>
            <button @click="toggleActive(todo.id)" class="btn" :class="{ 'btn-success': isActive(todo.id) }">
              {{ isActive(todo.id) ? 'Remove Active' : 'Set Active' }}
            </button>
            <button @click="toggleCompleted(todo.id)" class="btn" :class="{ 'btn-success': todo.completed }">
              {{ todo.completed ? 'Mark Incomplete' : 'Mark Complete' }}
            </button>
            <button @click="deleteTodo(todo.id)" class="btn btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div class="container">
      <h2>⚡ Bulk Actions</h2>
      <button @click="markAllCompleted" class="btn btn-success">Mark All Completed</button>
      <button @click="markAllIncomplete" class="btn btn-warning">Mark All Incomplete</button>
      <button @click="resetAllDirty" class="btn">Reset All Modified</button>
      <button @click="clearCompleted" class="btn btn-danger">Clear Completed</button>
      <button @click="resetActive" class="btn">Reset Active</button>
    </div>

    <!-- Debug Info -->
    <div class="container">
      <h2>🐛 Debug Info</h2>
      <div class="filters">
        <div class="filter-group">
          <label>Show Debug Info:</label>
          <input type="checkbox" v-model="showDebug" />
        </div>
      </div>
      <div v-if="showDebug">
        <pre>{{ debugInfo }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTodoStore, createTodo, updateTodo, type Todo } from './stores/todoStore'

// Store
const todoStore = useTodoStore()

// Form state
const newTodo = ref({
  title: '',
  description: '',
  priority: 'medium' as Todo['priority']
})

// Filters
const filters = ref({
  showCompleted: true,
  priority: '',
  showOnlyDirty: false,
  showOnlyActive: false
})

// Debug
const showDebug = ref(false)

// Computed properties
const totalTodos = computed(() => todoStore.getAllIds().length)
const completedTodos = computed(() => {
  const getWhere = todoStore.getWhere()
  return Object.keys(getWhere((todo: Todo & { $isDirty: boolean }) => todo.completed)).length
})
const activeTodos = computed(() => todoStore.getActive().length)
const dirtyTodos = computed(() => {
  const getWhere = todoStore.getWhere()
  return Object.keys(getWhere((todo: Todo & { $isDirty: boolean }) => todo.$isDirty)).length
})

const currentTodo = computed(() => todoStore.getCurrent())

const filteredTodos = computed(() => {
  let todos = todoStore.getAllArray()
  
  if (!filters.value.showCompleted) {
    todos = todos.filter((todo: Todo & { $isDirty: boolean }) => !todo.completed)
  }
  
  if (filters.value.priority) {
    todos = todos.filter((todo: Todo & { $isDirty: boolean }) => todo.priority === filters.value.priority)
  }
  
  if (filters.value.showOnlyDirty) {
    todos = todos.filter((todo: Todo & { $isDirty: boolean }) => todo.$isDirty)
  }
  
  if (filters.value.showOnlyActive) {
    todos = todos.filter((todo: Todo & { $isDirty: boolean }) => todoStore.getActive().includes(todo.id))
  }
  
  return todos
})

const debugInfo = computed(() => {
  const store = todoStore
  return {
    allIds: store.getAllIds(),
    current: store.getCurrent(),
    currentById: store.entities.currentById,
    active: store.getActive(),
    byId: store.getAll(),
    filters: filters.value
  }
})

// Methods
function addTodo() {
  if (newTodo.value.title && newTodo.value.description) {
    const todo = createTodo(
      newTodo.value.title,
      newTodo.value.description,
      newTodo.value.priority
    )
    todoStore.createOne(todo)
    
    // Reset form
    newTodo.value.title = ''
    newTodo.value.description = ''
    newTodo.value.priority = 'medium'
  }
}

function setCurrent(todo: Todo) {
  todoStore.setCurrent(todo)
  todoStore.setCurrentById(todo.id)
}

function removeCurrent() {
  todoStore.removeCurrent()
  todoStore.removeCurrentById()
}

function toggleActive(id: number) {
  if (todoStore.getActive().includes(id)) {
    todoStore.setActive(id) // This will remove it due to our logic
  } else {
    todoStore.setActive(id)
  }
}

function toggleCompleted(id: number) {
  const current = todoStore.getOne()(id)
  if (current) {
    updateTodo(id, { completed: !current.completed })
  }
}

function deleteTodo(id: number) {
  todoStore.deleteOne(id)
  
  // If this was the current todo, clear it
  if (todoStore.getCurrent()?.id === id) {
    removeCurrent()
  }
}

function markAllCompleted() {
  todoStore.getAllArray().forEach((todo: Todo & { $isDirty: boolean }) => {
    updateTodo(todo.id, { completed: true })
  })
}

function markAllIncomplete() {
  todoStore.getAllArray().forEach((todo: Todo & { $isDirty: boolean }) => {
    updateTodo(todo.id, { completed: false })
  })
}

function resetAllDirty() {
  todoStore.getAllArray().forEach((todo: Todo & { $isDirty: boolean }) => {
    if (todo.$isDirty) {
      todoStore.setIsNotDirty(todo.id)
    }
  })
}

function clearCompleted() {
  const completedIds = todoStore.getAllArray()
    .filter((todo: Todo & { $isDirty: boolean }) => todo.completed)
    .map((todo: Todo & { $isDirty: boolean }) => todo.id)
  
  todoStore.deleteMany(completedIds)
}

function resetActive() {
  todoStore.resetActive()
}

function isCurrent(id: number) {
  return todoStore.getCurrent()?.id === id
}

function isActive(id: number) {
  return todoStore.getActive().includes(id)
}

// Initialize with some sample data
onMounted(() => {
  if (todoStore.getIsEmpty()) {
    const sampleTodos = [
      createTodo('Learn Vue 3', 'Master the Composition API and new features', 'high'),
      createTodo('Build Entity Store', 'Create a robust entity management system', 'high'),
      createTodo('Write Tests', 'Ensure code quality with comprehensive testing', 'medium'),
      createTodo('Document Code', 'Create clear documentation for developers', 'low'),
      createTodo('Deploy App', 'Get the application running in production', 'medium')
    ]
    
    todoStore.createMany(sampleTodos)
    
    // Set first todo as current
    if (sampleTodos.length > 0) {
      setCurrent(sampleTodos[0])
      todoStore.setActive(sampleTodos[0].id)
      todoStore.setActive(sampleTodos[1].id)
    }
  }
})
</script>
