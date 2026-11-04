import type { Id, WithId } from './WithId.js'

/** One field touched by an optimistic update. */
export interface PendingField<T extends WithId> {
  key: keyof T
  /** Value before the optimistic update. */
  previous: T[keyof T]
  /** Value written by the optimistic update. */
  applied: T[keyof T]
  /** Whether the field was already in `changedFields` before. */
  wasChanged: boolean
}

/** An optimistic update waiting to be committed or rolled back. */
export interface PendingChange<T extends WithId> {
  txId: Id
  fields: readonly PendingField<T>[]
  /** `$isDirty` before the update. */
  wasDirty: boolean
  /** `updatedAt` before the update. */
  updatedAtBefore: number | null
}

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
  /** Optimistic updates not yet committed or rolled back (oldest first). */
  pending?: readonly PendingChange<T>[] | undefined
}

export type EntityWithMeta<T extends WithId> = T & {
  $isDirty: boolean
  $meta: EntityMeta<T>
}
