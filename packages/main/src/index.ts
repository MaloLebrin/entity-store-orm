// Main export file for the entity-store package

// Re-export core functions
export { createActions, createGetters, createState } from '@entity-store/core'
export type {
  BaseEntityStore,
  PiniaEntityStore,
  PiniaEntityStoreOptions,
} from '@entity-store/pinia-adapter'

// Re-export adapters
export { createPiniaEntityStore } from '@entity-store/pinia-adapter'
// Re-export types and interfaces
export type {
  ByIdParams,
  FilterFn,
  Id,
  OptionalFilterFn,
  State,
  WithId,
} from '@entity-store/types'

// Utilities (coming soon)
// export * from './utils/index.js';
