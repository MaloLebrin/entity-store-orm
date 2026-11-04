import { getOwn, patchEntity, putOwn, withMeta } from './entity.js'
import type { EntityWithMeta } from './types/EntityMeta.js'
import type { State } from './types/State.js'
import type { Id, WithId } from './types/WithId.js'

/**
 * Pure actions: each one takes a state and returns the next state.
 * The input state is never mutated; unchanged parts are shared structurally,
 * and the very same state reference is returned when nothing changed.
 */

function setEntities<T extends WithId>(
  state: State<T>,
  entities: Partial<State<T>['entities']>,
): State<T> {
  return { ...state, entities: { ...state.entities, ...entities } }
}

/** Create an entity (replaces it, resetting its metadata, if the id exists). */
export function createOne<T extends WithId>(
  state: State<T>,
  payload: T,
  now?: number,
): State<T> {
  const { byId, allIds } = state.entities
  return setEntities(state, {
    byId: { ...byId, [payload.id]: withMeta(payload, now) },
    allIds: allIds.includes(payload.id) ? allIds : [...allIds, payload.id],
  })
}

export function createMany<T extends WithId>(
  state: State<T>,
  payload: T[],
  now?: number,
): State<T> {
  if (payload.length === 0) return state
  // One pass, one copy: chaining createOne would copy byId/allIds per entity.
  const { byId, allIds } = state.entities
  const nextById = { ...byId }
  const known = new Set<Id>(allIds)
  const nextIds = [...allIds]
  for (const entity of payload) {
    putOwn(nextById, entity.id, withMeta(entity, now))
    if (!known.has(entity.id)) {
      known.add(entity.id)
      nextIds.push(entity.id)
    }
  }
  return setEntities(state, { byId: nextById, allIds: nextIds })
}

/**
 * Replace the whole collection with `payload` (every entity clean, metadata
 * reset), e.g. after loading a list from an API. `active`, `current` and
 * `currentById` are kept only when they still point to an entity of the new
 * list; `current` is refreshed to the new copy.
 */
export function setAll<T extends WithId>(
  state: State<T>,
  payload: T[],
  now?: number,
): State<T> {
  const byId: Record<Id, EntityWithMeta<T>> = {}
  const allIds: Id[] = []
  for (const entity of payload) {
    if (getOwn(byId, entity.id) === undefined) allIds.push(entity.id)
    putOwn(byId, entity.id, withMeta(entity, now))
  }
  const { active, current, currentById } = state.entities
  return setEntities(state, {
    byId,
    allIds,
    active: active.filter((id) => getOwn(byId, id) !== undefined),
    current: current ? (getOwn(byId, current.id) ?? null) : null,
    currentById:
      currentById !== null && getOwn(byId, currentById) !== undefined
        ? currentById
        : null,
  })
}

/**
 * Patch an existing entity (marks it dirty), or create it when missing.
 * (`updateOne` / `updateMany` are already upserts.)
 */
export function updateOne<T extends WithId>(
  state: State<T>,
  id: Id,
  payload: T,
  now?: number,
): State<T> {
  const existing = getOwn(state.entities.byId, id)
  if (!existing) return createOne(state, payload, now)
  const next = patchEntity(existing, payload, now)
  if (next === existing) return state
  return setEntities(state, {
    byId: { ...state.entities.byId, [id]: next },
  })
}

export function updateMany<T extends WithId>(
  state: State<T>,
  payload: T[],
  now?: number,
): State<T> {
  if (payload.length === 0) return state
  // One pass, copy-on-first-write: no per-entity copy of byId/allIds.
  const { byId, allIds } = state.entities
  let nextById = byId
  let nextIds = allIds
  let known: Set<Id> | undefined
  for (const entity of payload) {
    const existing = getOwn(nextById, entity.id)
    const next = existing
      ? patchEntity(existing, entity, now)
      : withMeta(entity, now)
    if (next === existing) continue
    if (nextById === byId) nextById = { ...byId }
    putOwn(nextById, entity.id, next)
    known ??= new Set<Id>(allIds)
    if (!known.has(entity.id)) {
      known.add(entity.id)
      if (nextIds === allIds) nextIds = [...allIds]
      nextIds.push(entity.id)
    }
  }
  if (nextById === byId) return state
  return setEntities(state, { byId: nextById, allIds: nextIds })
}

export function updateField<T extends WithId, K extends keyof T>(
  state: State<T>,
  field: K,
  value: T[K],
  id: Id,
  now?: number,
): State<T> {
  const existing = getOwn(state.entities.byId, id)
  if (!existing) return state
  const next = patchEntity(
    existing,
    { [field]: value } as unknown as Partial<T>,
    now,
  )
  if (next === existing) return state
  return setEntities(state, {
    byId: { ...state.entities.byId, [id]: next },
  })
}

/** Drop `current` / `currentById` when they point to one of the removed ids. */
function clearRemovedPointers<T extends WithId>(
  { current, currentById }: State<T>['entities'],
  isRemoved: (id: Id) => boolean,
): Partial<State<T>['entities']> {
  const patch: Partial<State<T>['entities']> = {}
  if (current !== null && isRemoved(current.id)) patch.current = null
  if (currentById !== null && isRemoved(currentById)) patch.currentById = null
  return patch
}

export function deleteOne<T extends WithId>(state: State<T>, id: Id): State<T> {
  const { byId, allIds, active } = state.entities
  if (!Object.hasOwn(byId, id) && !allIds.includes(id) && !active.includes(id))
    return state
  const { [id]: _removed, ...rest } = byId
  return setEntities(state, {
    byId: rest,
    allIds: allIds.filter((entityId) => entityId !== id),
    active: active.filter((entityId) => entityId !== id),
    ...clearRemovedPointers(state.entities, (other) => other === id),
  })
}

export function deleteMany<T extends WithId>(
  state: State<T>,
  ids: Id[],
): State<T> {
  if (ids.length === 0) return state
  // One filter pass instead of one per id.
  const { byId, allIds, active } = state.entities
  const doomed = new Set<Id>(ids)
  const nextIds = allIds.filter((id) => !doomed.has(id))
  const nextActive = active.filter((id) => !doomed.has(id))
  let nextById = byId
  for (const id of doomed) {
    if (!Object.hasOwn(nextById, id)) continue
    if (nextById === byId) nextById = { ...byId }
    delete nextById[id]
  }
  if (
    nextById === byId &&
    nextIds.length === allIds.length &&
    nextActive.length === active.length
  )
    return state
  return setEntities(state, {
    byId: nextById,
    allIds: nextIds,
    active: nextActive,
    ...clearRemovedPointers(state.entities, (id) => doomed.has(id)),
  })
}

export function setCurrent<T extends WithId>(
  state: State<T>,
  payload: T,
  now?: number,
): State<T> {
  return setEntities(state, { current: withMeta(payload, now) })
}

export function removeCurrent<T extends WithId>(state: State<T>): State<T> {
  return state.entities.current === null
    ? state
    : setEntities(state, { current: null })
}

export function setCurrentById<T extends WithId>(
  state: State<T>,
  id: Id,
): State<T> {
  if (!getOwn(state.entities.byId, id) || state.entities.currentById === id)
    return state
  return setEntities(state, { currentById: id })
}

export function removeCurrentById<T extends WithId>(state: State<T>): State<T> {
  return state.entities.currentById === null
    ? state
    : setEntities(state, { currentById: null })
}

export function setActive<T extends WithId>(state: State<T>, id: Id): State<T> {
  const { active, byId } = state.entities
  if (active.includes(id) || !getOwn(byId, id)) return state
  return setEntities(state, { active: [...active, id] })
}

export function resetActive<T extends WithId>(state: State<T>): State<T> {
  return state.entities.active.length === 0
    ? state
    : setEntities(state, { active: [] })
}

export function setIsDirty<T extends WithId>(
  state: State<T>,
  id: Id,
): State<T> {
  const existing = getOwn(state.entities.byId, id)
  if (!existing || existing.$isDirty) return state
  return setEntities(state, {
    byId: { ...state.entities.byId, [id]: { ...existing, $isDirty: true } },
  })
}

/** Mark an entity clean and forget its changed fields. */
export function setIsNotDirty<T extends WithId>(
  state: State<T>,
  id: Id,
): State<T> {
  const existing = getOwn(state.entities.byId, id)
  if (!existing) return state
  if (!existing.$isDirty && existing.$meta.changedFields.length === 0)
    return state
  return setEntities(state, {
    byId: {
      ...state.entities.byId,
      [id]: {
        ...existing,
        $isDirty: false,
        $meta: { ...existing.$meta, changedFields: [] },
      },
    },
  })
}
