import type { WithId } from './WithId.js'

export interface EntityMeta<T extends WithId> {
  changedFields: Set<keyof T>
  createdAt: number
  updatedAt: number | null
}

export type EntityWithMeta<T extends WithId> = T & {
  $isDirty: boolean
  $meta: EntityMeta<T>
}



