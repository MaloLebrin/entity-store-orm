import { patchEntity } from './entity.js'
import type { EntityActions } from './types/EntityApi.js'
import type {
  EntityMeta,
  EntityWithMeta,
  PendingChange,
  PendingField,
} from './types/EntityMeta.js'
import type { State } from './types/State.js'
import type { Id, WithId } from './types/WithId.js'

/**
 * Optimistic updates: apply a patch right away, then either `commit` it (the
 * server accepted) or `rollback` it (the server refused). Each update is
 * identified by a caller-chosen `txId` and recorded, as plain data, in
 * `entity.$meta.pending`, so it works with every adapter (Redux included).
 */

function withEntity<T extends WithId>(
  state: State<T>,
  entity: EntityWithMeta<T>,
): State<T> {
  return {
    ...state,
    entities: {
      ...state.entities,
      byId: { ...state.entities.byId, [entity.id]: entity },
    },
  }
}

/** Rebuild `$meta`, dropping `pending` when it is empty. */
function metaWith<T extends WithId>(
  meta: EntityMeta<T>,
  changes: Partial<EntityMeta<T>>,
  pending: readonly PendingChange<T>[],
): EntityMeta<T> {
  const { pending: _old, ...rest } = meta
  const next = { ...rest, ...changes }
  return pending.length > 0 ? { ...next, pending } : next
}

/**
 * Apply `patch` to an existing entity and remember how to undo it.
 * Returns the same state when the entity is missing, nothing changes, or
 * `txId` is already pending on that entity.
 */
export function optimisticUpdate<T extends WithId>(
  state: State<T>,
  id: Id,
  patch: Partial<T>,
  txId: Id,
  now?: number,
): State<T> {
  const existing = state.entities.byId[id]
  if (!existing) return state
  const pending = existing.$meta.pending ?? []
  if (pending.some((p) => p.txId === txId)) return state

  const next = patchEntity(existing, patch, now)
  if (next === existing) return state

  const fields: PendingField<T>[] = []
  for (const key of Object.keys(patch) as (keyof T)[]) {
    if (key === 'id' || Object.is(existing[key], patch[key])) continue
    fields.push({
      key,
      previous: existing[key],
      applied: patch[key] as T[keyof T],
      wasChanged: existing.$meta.changedFields.includes(key),
    })
  }
  const change: PendingChange<T> = {
    txId,
    fields,
    wasDirty: existing.$isDirty,
    updatedAtBefore: existing.$meta.updatedAt,
  }
  return withEntity(state, {
    ...next,
    $meta: metaWith(next.$meta, {}, [...pending, change]),
  })
}

/** The server accepted the update: forget how to undo it, keep the values. */
export function commitOptimistic<T extends WithId>(
  state: State<T>,
  id: Id,
  txId: Id,
): State<T> {
  const existing = state.entities.byId[id]
  const pending = existing?.$meta.pending
  if (!existing || !pending?.some((p) => p.txId === txId)) return state
  const rest = pending.filter((p) => p.txId !== txId)
  return withEntity(state, {
    ...existing,
    $meta: metaWith(existing.$meta, {}, rest),
  })
}

/**
 * The server refused the update: restore the previous values and dirty
 * bookkeeping. Stacked updates stay consistent: when a later pending update
 * touched the same field it inherits the earlier "previous" value, and a field
 * modified by something else since (value differs from the one applied) is
 * left as is.
 */
export function rollbackOptimistic<T extends WithId>(
  state: State<T>,
  id: Id,
  txId: Id,
): State<T> {
  const existing = state.entities.byId[id]
  const pending = existing?.$meta.pending
  const index = pending ? pending.findIndex((p) => p.txId === txId) : -1
  if (!existing || !pending || index === -1) return state

  const entry = pending[index] as PendingChange<T>
  const earlier = pending.slice(0, index)
  const later = pending.slice(index + 1)
  const restored: Partial<T> = {}
  const cleaned = new Set<keyof T>()

  for (const field of entry.fields) {
    const owner = later.findIndex((l) =>
      l.fields.some((f) => f.key === field.key),
    )
    if (owner !== -1) {
      later[owner] = {
        ...later[owner],
        fields: (later[owner] as PendingChange<T>).fields.map((f) =>
          f.key === field.key
            ? { ...f, previous: field.previous, wasChanged: field.wasChanged }
            : f,
        ),
      } as PendingChange<T>
    } else if (Object.is(existing[field.key], field.applied)) {
      restored[field.key] = field.previous
      if (!field.wasChanged) cleaned.add(field.key)
    }
  }

  // The next pending update now starts from the state this one started from.
  if (later[0])
    later[0] = {
      ...later[0],
      wasDirty: entry.wasDirty,
      updatedAtBefore: entry.updatedAtBefore,
    }

  const changedFields = existing.$meta.changedFields.filter(
    (k) => !cleaned.has(k),
  )
  return withEntity(state, {
    ...existing,
    ...restored,
    $isDirty: changedFields.length > 0 || entry.wasDirty,
    $meta: metaWith(
      existing.$meta,
      {
        changedFields,
        updatedAt:
          later.length === 0 ? entry.updatedAtBefore : existing.$meta.updatedAt,
      },
      [...earlier, ...later],
    ),
  })
}

/** Whether the entity has optimistic updates waiting for an answer. */
export function isPending<T extends WithId>(state: State<T>, id: Id): boolean {
  return (state.entities.byId[id]?.$meta.pending?.length ?? 0) > 0
}

let counter = 0

/**
 * Apply `patch` optimistically, await `request`, then commit on success or
 * roll back and rethrow on failure. Needs plain-function actions (Zustand,
 * Pinia, Valtio); with Redux or Jotai call the three actions yourself.
 *
 * ```ts
 * await withOptimisticUpdate(users.getState(), 1, { name: 'Ada L.' }, () =>
 *   api.rename(1, 'Ada L.'),
 * )
 * ```
 */
export async function withOptimisticUpdate<T extends WithId, R>(
  actions: Pick<
    EntityActions<T>,
    'optimisticUpdate' | 'commitOptimistic' | 'rollbackOptimistic'
  >,
  id: Id,
  patch: Partial<T>,
  request: () => Promise<R>,
): Promise<R> {
  const txId = `optimistic-${++counter}`
  actions.optimisticUpdate(id, patch, txId)
  try {
    const result = await request()
    actions.commitOptimistic(id, txId)
    return result
  } catch (error) {
    actions.rollbackOptimistic(id, txId)
    throw error
  }
}
