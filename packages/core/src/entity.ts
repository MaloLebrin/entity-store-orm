import type { EntityWithMeta } from './types/EntityMeta.js'
import type { WithId } from './types/WithId.js'

/** Wrap a plain entity with fresh (clean) metadata. */
export function withMeta<T extends WithId>(
  entity: T,
  now: number = Date.now(),
): EntityWithMeta<T> {
  return {
    ...entity,
    $isDirty: false,
    $meta: { changedFields: [], createdAt: now, updatedAt: null },
  }
}

/**
 * Apply a patch to a stored entity without mutating it.
 * Returns the same reference when nothing actually changed.
 */
export function patchEntity<T extends WithId>(
  entity: EntityWithMeta<T>,
  patch: Partial<T>,
  now: number = Date.now(),
): EntityWithMeta<T> {
  const changed: (keyof T)[] = []
  for (const key of Object.keys(patch) as (keyof T)[]) {
    if (key === 'id') continue
    if (!Object.is(entity[key], patch[key])) changed.push(key)
  }
  if (changed.length === 0) return entity

  const fields = [...entity.$meta.changedFields]
  for (const key of changed) if (!fields.includes(key)) fields.push(key)

  return {
    ...entity,
    ...patch,
    id: entity.id,
    $isDirty: true,
    $meta: { ...entity.$meta, changedFields: fields, updatedAt: now },
  }
}
