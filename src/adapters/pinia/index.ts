import { defineStore } from 'pinia'
import createActions from '../../core/createActions.js'
import createGetters from '../../core/createGetters.js'
import createState from '../../core/createState.js'
import type { WithId } from '../../types/WithId.js'

/**
 * Creates a Pinia store with entity management capabilities
 * @param storeName - The name of the Pinia store
 * @returns A Pinia store definition with entity management methods
 */
export function createPiniaEntityStore<T extends WithId>(storeName: string) {
  return defineStore(storeName, () => {
    // Create the state using our core function
    const state = createState<T>()
    
    // Create getters and actions using our core functions
    const getters = createGetters<T>(state)
    const actions = createActions<T>(state)
    
    // Return the store with state, getters, and actions
    return {
      // State
      entities: state.entities,
      
      // Getters (expose all getter methods)
      ...getters,
      
      // Actions (expose all action methods)
      ...actions,
    }
  })
}

/**
 * Type for the Pinia entity store
 */
export type PiniaEntityStore<T extends WithId> = ReturnType<ReturnType<typeof createPiniaEntityStore<T>>>
