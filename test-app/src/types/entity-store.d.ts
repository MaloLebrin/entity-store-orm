declare module 'entity-store' {
  import type { WithId } from './WithId'
  
  export interface WithId {
    id: number | string
  }
  
  export function createPiniaEntityStore<T extends WithId>(storeName: string): any
}

declare module 'entity-store/adapters/pinia' {
  import type { WithId } from './WithId'
  
  export interface WithId {
    id: number | string
  }
  
  export function createPiniaEntityStore<T extends WithId>(storeName: string): any
}
