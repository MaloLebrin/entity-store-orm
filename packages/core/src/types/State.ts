import type { EntityWithMeta } from './EntityMeta.js'
import type { Id, WithId } from './WithId'

/**
 * The normalized, serializable state shared by every adapter.
 */
export interface State<T extends WithId> {
  entities: {
    /** Entities indexed by id. */
    byId: Record<Id, EntityWithMeta<T>>
    /** Ids in insertion order (drives every derived array). */
    allIds: Id[]
    /** The entity being edited or displayed, independent from `byId`. */
    current: EntityWithMeta<T> | null
    /** Id of a stored entity used as the current one. */
    currentById: Id | null
    /** Active ids, e.g. selected rows. */
    active: Id[]
  }
}

// export type CreatedEntity<T> = T & { $isDirty: boolean }
