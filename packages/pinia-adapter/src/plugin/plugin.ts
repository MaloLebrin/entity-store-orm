import type { WithId } from '@entity-store/core'
import { createActions, createGetters, createState } from '@entity-store/core'
import type { PiniaPluginContext } from 'pinia'
import { ref, toRef } from 'vue'

// Types to improve maintainability
interface EntityStore {
  $state: {
    $entities: any
    [key: string]: any
  }
  $entities: any
  [key: string]: any
  _customProperties?: {
    add: (property: string) => void
  }
}

interface Actions {
  [key: string]: Function
}

interface Getters {
  [key: string]: Function | any
}

// Constants for getters that return direct values
const VALUE_GETTERS = [
  'getAllArray',
  'getAllIds', 
  'getAll',
  'getActive',
  'getFirstActive',
  'getIsEmpty',
  'getIsNotEmpty',
  'getCurrent',
  'getCurrentById'
] as const

type ValueGetterKey = typeof VALUE_GETTERS[number]

/**
 * Creates a copied state from the current store state
 */
function createCurrentState(store: EntityStore) {
  const currentState = createState<WithId>()
  currentState.entities.byId = { ...store.$state.$entities.byId }
  currentState.entities.allIds = [...store.$state.$entities.allIds]
  currentState.entities.current = store.$state.$entities.current
  currentState.entities.currentById = store.$state.$entities.currentById
  currentState.entities.active = [...store.$state.$entities.active]
  return currentState
}

/**
 * Creates a getter that returns the current state value
 */
function createValueGetter(store: EntityStore, key: string, baseState: any) {
  return () => {
    const currentState = createCurrentState(store)
    const currentGetters = createGetters(currentState)
    const currentGetter = (currentGetters as any)[key]
    const value = currentGetter(currentState)
    
    // Convert IDs to strings for getAllIds
    if (key === 'getAllIds') {
      return value.map((id: any) => String(id))
    }
    
    return value
  }
}

/**
 * Adds actions to the store
 */
function addActionsToStore(store: EntityStore, actions: Actions, baseState: any) {
  // Create an actions object bound to the store
  const boundActions: Actions = {}
  for (const key in actions) {
    const action = actions[key]
    if (action) {
      boundActions[key] = action
    }
  }
  
  // Bind the this context to the store for all actions
  Object.keys(boundActions).forEach(key => {
    const action = boundActions[key]
    if (typeof action === 'function') {
      boundActions[key] = action.bind(boundActions)
    }
  })
  
  // Add all prefixed actions to the store
  for (const key in boundActions) {
    if (!store.$state.hasOwnProperty(`$${key}`)) {
      store[`$${key}`] = boundActions[key]
    }
  }
}

/**
 * Adds getters to the store
 */
function addGettersToStore(store: EntityStore, getters: Getters, baseState: any) {
  for (const key in getters) {
    if (!store.$state.hasOwnProperty(`$${key}`)) {
      const getter = getters[key]
      
      if (typeof getter === 'function') {
        const result = getter(baseState)
        
        // Check if it's a getter that returns a direct value
        if (VALUE_GETTERS.includes(key as ValueGetterKey)) {
          store[`$${key}`] = createValueGetter(store, key, baseState)
        } else {
          // Others return functions that take parameters
          store[`$${key}`] = result
        }
      } else {
        store[`$${key}`] = getter
      }
    }
  }
}

/**
 * Adds custom properties for devtools
 */
function addCustomProperties(store: EntityStore, actions: Actions, getters: Getters) {
  if (process.env.NODE_ENV === 'development') {
    store._customProperties?.add('$entities')
    
    // Add all actions and getters to custom properties
    Object.keys(actions).forEach(key => {
      store._customProperties?.add(`$${key}`)
    })
    
    Object.keys(getters).forEach(key => {
      store._customProperties?.add(`$${key}`)
    })
  }
}

/**
 * Pinia plugin that automatically adds entity management to all stores
 * All added properties are prefixed with $ to avoid conflicts
 */
export function entityStorePlugin(ctx: PiniaPluginContext) {
  const store = ctx.store
  
  // Create entity state using the core
  const baseState = createState<WithId>()
  
  // Create actions and getters with the state
  const actions = createActions(baseState)
  const getters = createGetters(baseState)
  
  // To properly handle SSR, we need to add state in two places
  if (!store.$state.hasOwnProperty('$entities')) {
    // Create a reactive ref for entity state
    const entities = ref(baseState.entities)
    // Add to $state for SSR serialization
    store.$state.$entities = entities
  }
  
  // Transfer the state ref to the store for direct access
  ;(store as any).$entities = toRef(store.$state, '$entities')
  
  // Add actions to the store
  addActionsToStore(store as unknown as EntityStore, actions, baseState)
  
  // Add getters to the store
  addGettersToStore(store as unknown as EntityStore, getters, baseState)
  
  // Add custom properties for devtools
  addCustomProperties(store as unknown as EntityStore, actions, getters)
  
  // Return an empty object as we modify the store directly
  // This allows devtools to track properties
  return {}
}

/**
 * Helper function to install the plugin
 */
export function installEntityStorePlugin(pinia: any) {
  pinia.use(entityStorePlugin)
}

