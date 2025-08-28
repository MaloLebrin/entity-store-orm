// Main export file for the entity-store package

// Re-export types and interfaces
export type { ByIdParams, FilterFn, Id, OptionalFilterFn, State, WithId } from '@entity-store/types';

// Re-export core functions
export { default as createActions, default as createGetters, default as createState } from '@entity-store/core';

// Re-export adapters
export { createPiniaEntityStore } from '@entity-store/pinia-adapter';
export type { BaseEntityStore, PiniaEntityStore, PiniaEntityStoreOptions } from '@entity-store/pinia-adapter';

// Utilities (coming soon)
// export * from './utils/index.js';
