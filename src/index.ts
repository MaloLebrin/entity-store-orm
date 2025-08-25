// Main export file for the entity-store package

// Types and interfaces
export type {
    Entity, EntityFilter, EntityId, EntitySorter, EntityState, JotaiStoreConfig, ReduxStoreConfig, StoreAdapter, StoreConfig, ValtioStoreConfig, ZustandStoreConfig
} from './types/index.js';

// Core classes
export { EntityStore } from './core/EntityStore.js';
export { BaseAdapter } from './core/BaseAdapter.js';
export { EntityGetters } from './core/EntityGetters.js';
export { EntityActions } from './core/EntityActions.js';

// Adapters (coming soon)
// export { ReduxAdapter } from './adapters/ReduxAdapter.js';
// export { ZustandAdapter } from './adapters/ZustandAdapter.js';
// export { JotaiAdapter } from './adapters/JotaiAdapter.js';
// export { ValtioAdapter } from './adapters/ValtioAdapter.js';

// Utilities (coming soon)
// export * from './utils/index.js';
