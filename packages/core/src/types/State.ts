import type { Id, WithId } from './WithId'
import type { EntityWithMeta } from './EntityMeta.js'

export interface State<T extends WithId> {
  entities: {
    byId: Record<Id, EntityWithMeta<T>>
    allIds: Id[]
    current: EntityWithMeta<T> | null
    currentById: Id | null
    active: Id[]
  }
}

// export type CreatedEntity<T> = T & { $isDirty: boolean }
