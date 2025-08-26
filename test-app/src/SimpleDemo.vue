<template>
  <div class="simple-demo">
    <h1>🧪 Entity Store - Simple Demo</h1>
    
    <div class="container">
      <h2>📊 State</h2>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number">{{ state.entities.allIds.length }}</div>
          <div class="stat-label">Total Entities</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ currentEntity ? 'Yes' : 'No' }}</div>
          <div class="stat-label">Has Current</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ state.entities.active.length }}</div>
          <div class="stat-label">Active Entities</div>
        </div>
      </div>
    </div>

    <div class="container">
      <h2>➕ Add Entity</h2>
      <form @submit.prevent="addEntity">
        <div class="form-group">
          <label for="name">Name</label>
          <input id="name" v-model="newEntity.name" type="text" placeholder="Enter name" required />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="newEntity.email" type="email" placeholder="Enter email" required />
        </div>
        <button type="submit" class="btn btn-success">Add Entity</button>
      </form>
    </div>

    <div class="container">
      <h2>📋 Entities List</h2>
      <div v-if="entities.length === 0" class="empty-state">
        <h3>No entities yet</h3>
        <p>Add some entities to get started!</p>
      </div>
      <div v-else>
        <div 
          v-for="entity in entities" 
          :key="entity.id"
          :class="[
            'todo-item',
            { 
              current: isCurrent(entity.id),
              active: isActive(entity.id),
              dirty: entity.$isDirty
            }
          ]"
        >
          <div class="todo-content">
            <div class="todo-title">{{ entity.name }}</div>
            <div class="todo-meta">{{ entity.email }}</div>
            <div class="todo-status">
              <span v-if="isCurrent(entity.id)" class="status-badge status-current">Current</span>
              <span v-if="isActive(entity.id)" class="status-badge status-active">Active</span>
              <span v-if="entity.$isDirty" class="status-badge status-dirty">Modified</span>
            </div>
          </div>
          <div class="todo-actions">
            <button @click="setCurrent(entity)" class="btn">Set Current</button>
            <button @click="toggleActive(entity.id)" class="btn" :class="{ 'btn-success': isActive(entity.id) }">
              {{ isActive(entity.id) ? 'Remove Active' : 'Set Active' }}
            </button>
            <button @click="updateEntity(entity.id)" class="btn btn-warning">Update</button>
            <button @click="deleteEntity(entity.id)" class="btn btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <h2>🎯 Current Entity</h2>
      <div v-if="currentEntity" class="todo-item current">
        <div class="todo-content">
          <div class="todo-title">{{ currentEntity.name }}</div>
          <div class="todo-meta">{{ currentEntity.email }}</div>
          <div class="todo-status">
            <span class="status-badge status-current">Current</span>
            <span v-if="currentEntity.$isDirty" class="status-badge status-dirty">Modified</span>
          </div>
        </div>
        <div class="todo-actions">
          <button @click="removeCurrent" class="btn btn-danger">Remove Current</button>
        </div>
      </div>
      <div v-else class="empty-state">
        <h3>No current entity</h3>
        <p>Select an entity to set as current</p>
      </div>
    </div>

    <div class="container">
      <h2>⚡ Actions</h2>
      <button @click="resetActive" class="btn">Reset Active</button>
      <button @click="resetAllDirty" class="btn">Reset All Modified</button>
      <button @click="clearAll" class="btn btn-danger">Clear All</button>
    </div>

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
import { ref, computed, reactive, onMounted } from 'vue'

// Simple entity interface
interface Entity {
  id: number
  name: string
  email: string
}

// Simple state structure (mimicking our entity store)
const state = reactive({
  entities: {
    byId: {} as Record<number, Entity & { $isDirty: boolean }>,
    allIds: [] as number[],
    current: null as (Entity & { $isDirty: boolean }) | null,
    currentById: null as number | null,
    active: [] as number[]
  }
})

// Form state
const newEntity = ref({
  name: '',
  email: ''
})

// Debug
const showDebug = ref(false)

// Computed properties
const entities = computed(() => state.entities.allIds.map(id => state.entities.byId[id]))
const currentEntity = computed(() => state.entities.current)

const debugInfo = computed(() => ({
  allIds: state.entities.allIds,
  current: state.entities.current,
  currentById: state.entities.currentById,
  active: state.entities.active,
  byId: state.entities.byId
}))

// Methods
function addEntity() {
  if (newEntity.value.name && newEntity.value.email) {
    const entity: Entity = {
      id: Date.now() + Math.random(),
      name: newEntity.value.name,
      email: newEntity.value.email
    }
    
    // Add to store
    state.entities.byId[entity.id] = { ...entity, $isDirty: false }
    state.entities.allIds.push(entity.id)
    
    // Reset form
    newEntity.value.name = ''
    newEntity.value.email = ''
  }
}

function setCurrent(entity: Entity & { $isDirty: boolean }) {
  state.entities.current = entity
  state.entities.currentById = entity.id
}

function removeCurrent() {
  state.entities.current = null
  state.entities.currentById = null
}

function toggleActive(id: number) {
  const index = state.entities.active.indexOf(id)
  if (index > -1) {
    state.entities.active.splice(index, 1)
  } else {
    state.entities.active.push(id)
  }
}

function updateEntity(id: number) {
  const entity = state.entities.byId[id]
  if (entity) {
    // Simulate an update
    entity.name = `${entity.name} (Updated)`
    entity.$isDirty = true
  }
}

function deleteEntity(id: number) {
  delete state.entities.byId[id]
  state.entities.allIds = state.entities.allIds.filter(entityId => entityId !== id)
  
  // Remove from active if present
  const activeIndex = state.entities.active.indexOf(id)
  if (activeIndex > -1) {
    state.entities.active.splice(activeIndex, 1)
  }
  
  // Remove from current if it was the current entity
  if (state.entities.current?.id === id) {
    removeCurrent()
  }
}

function resetActive() {
  state.entities.active = []
}

function resetAllDirty() {
  Object.values(state.entities.byId).forEach(entity => {
    entity.$isDirty = false
  })
}

function clearAll() {
  state.entities.byId = {}
  state.entities.allIds = []
  state.entities.current = null
  state.entities.currentById = null
  state.entities.active = []
}

function isCurrent(id: number) {
  return state.entities.current?.id === id
}

function isActive(id: number) {
  return state.entities.active.includes(id)
}

// Initialize with some sample data
onMounted(() => {
  if (state.entities.allIds.length === 0) {
    const sampleEntities: Entity[] = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ]
    
    sampleEntities.forEach(entity => {
      state.entities.byId[entity.id] = { ...entity, $isDirty: false }
      state.entities.allIds.push(entity.id)
    })
    
    // Set first entity as current
    if (sampleEntities.length > 0) {
      setCurrent(state.entities.byId[sampleEntities[0].id])
      state.entities.active.push(sampleEntities[0].id)
      state.entities.active.push(sampleEntities[1].id)
    }
  }
})
</script>

<style scoped>
.simple-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>
