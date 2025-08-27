import { defineStore } from 'pinia'
import createActions from '../../core/createActions.js'
import createGetters from '../../core/createGetters.js'
import createState from '../../core/createState.js'
import type { WithId } from '../../types/WithId.js'

/**
 * Base store type with entity management capabilities
 */
export type BaseEntityStore<T extends WithId> = {
  entities: {
    byId: Record<string, T & { $isDirty: boolean }>
    allIds: string[]
    current: (T & { $isDirty: boolean }) | null
    currentById: string | null
    active: string[]
  }
} & ReturnType<typeof createGetters<T>> &
  ReturnType<typeof createActions<T>>

/**
 * Options for extending the Pinia entity store
 */
export interface PiniaEntityStoreOptions<T extends WithId> {
  /**
   * Additional state properties to add to the store
   */
  state?: Record<string, unknown>
  
  /**
   * Additional getters to add to the store
   */
  getters?: Record<string, (store: BaseEntityStore<T>) => (...args: unknown[]) => unknown>
  
  /**
   * Additional actions to add to the store
   */
  actions?: Record<string, (store: BaseEntityStore<T>) => (...args: unknown[]) => unknown>
  
  /**
   * Custom store name (optional, defaults to the provided storeName)
   */
  storeName?: string
}

/**
 * Creates a Pinia store with entity management capabilities
 * @param storeName - The name of the Pinia store
 * @param options - Options for extending the store
 * @returns A Pinia store definition with entity management methods
 */
export function createPiniaEntityStore<T extends WithId>(
  storeName: string,
  options: PiniaEntityStoreOptions<T> = {}
) {
  return defineStore(options.storeName || storeName, () => {
    // Create the base state using our core function
    const baseState = createState<T>()
    
    // Create state by merging base state with custom state
    const entities = {
      ...baseState.entities,
      ...options.state
    }
    
    // Create a state object that the core functions can work with
    const state = {
      entities
    }
    
    // Create getters and actions with the state
    const getters = createGetters<T>(state)
    const actions = createActions<T>(state)
    
    // Create the base store object
    const baseStore: BaseEntityStore<T> = {
      entities,
      ...getters,
      ...actions
    } as BaseEntityStore<T>
    
    // Create custom getters as functions that receive the store context
    const customGetters: Record<string, (...args: unknown[]) => unknown> = {}
    if (options.getters) {
      Object.entries(options.getters).forEach(([key, getterFn]) => {
        customGetters[key] = (...args: unknown[]) => getterFn(baseStore)(...args)
      })
    }
    
    // Create custom actions as functions that receive the store context
    const customActions: Record<string, (...args: unknown[]) => unknown> = {}
    if (options.actions) {
      Object.entries(options.actions).forEach(([key, actionFn]) => {
        customActions[key] = (...args: unknown[]) => actionFn(baseStore)(...args)
      })
    }
    
    // Return the store with all functionality
    return {
      ...baseStore,
      ...customGetters,
      ...customActions,
    }
  })
}

/**
 * Type for the Pinia entity store instance
 */
export type PiniaEntityStore<T extends WithId> = ReturnType<ReturnType<typeof createPiniaEntityStore<T>>>
