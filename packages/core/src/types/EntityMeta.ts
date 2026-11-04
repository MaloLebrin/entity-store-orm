import type { WithId } from './WithId.js'

/**
 * Metadata attached to every stored entity.
 * Plain serializable data (no `Set`, no `Date`) so that it works with
 * Redux, Immer, devtools and persistence out of the box.
 */
export interface EntityMeta<T extends WithId> {
  /** Fields modified since the entity was created or last marked clean. */
  changedFields: readonly (keyof T)[]
  /** Timestamp (ms) of creation in the store. */
  createdAt: number
  /** Timestamp (ms) of the last modification, `null` if never modified. */
  updatedAt: number | null
}

/** A stored entity: your fields plus `$isDirty` and `$meta`. */
export type EntityWithMeta<T extends WithId> = T & {
  $isDirty: boolean
  $meta: EntityMeta<T>
}
