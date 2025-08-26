/**
 * Adapters index file
 * Export all available state manager adapters
 */

// Pinia adapter
export { createPiniaEntityStore } from './pinia/index.js'
export type { PiniaEntityStore } from './pinia/index.js'

// Future adapters will be exported here
// export { createReduxEntityStore } from './redux/index.js'
// export { createZustandEntityStore } from './zustand/index.js'
// export { createJotaiEntityStore } from './jotai/index.js'
// export { createValtioEntityStore } from './valtio/index.js'
