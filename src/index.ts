// Main export file for the entity-store package

// Types and interfaces
export type { Id, WithId } from './types/WithId.js';
export type { State } from './types/State.js';
export type { FilterFn, OptionalFilterFn } from './types/Filter.js';
export type { ByIdParams } from './types/ByIdParams.js';

// Core functions
export { default as createState } from './core/createState.js';
export { default as createGetters } from './core/createGetters.js';
export { default as createActions } from './core/createActions.js';

// Adapters (coming soon)
// export { createPiniaStore } from './adapters/pinia/index.js';
// export { createZustandStore } from './adapters/zustand/index.js';

// Utilities (coming soon)
// export * from './utils/index.js';

