import { patchEntity, withMeta } from './entity.js'
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

/**
 * Create an entity (replaces it, resetting its metadata, if the id exists).
 *
 * @param state - Current state.
 * @param payload - The entity to add.
 * @param now - Timestamp used for `$meta.createdAt` (defaults to `Date.now()`).
 */
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

/**
 * Create several entities in one pass (existing ids are replaced, metadata reset).
 * Returns the same state when `payload` is empty.
 *
 * @param state - Current state.
 * @param payload - Entities to add.
 * @param now - Timestamp used for `$meta.createdAt` (defaults to `Date.now()`).
 */
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
    nextById[entity.id] = withMeta(entity, now)
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
    if (byId[entity.id] === undefined) allIds.push(entity.id)
    byId[entity.id] = withMeta(entity, now)
  }
  const { active, current, currentById } = state.entities
  return setEntities(state, {
    byId,
    allIds,
    active: active.filter((id) => byId[id] !== undefined),
    current: current ? (byId[current.id] ?? null) : null,
    currentById:
      currentById !== null && byId[currentById] !== undefined
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
  const existing = state.entities.byId[id]
  if (!existing) return createOne(state, payload, now)
  const next = patchEntity(existing, payload, now)
  if (next === existing) return state
  return setEntities(state, {
    byId: { ...state.entities.byId, [id]: next },
  })
}

/**
 * Patch or create several entities in one pass. Entities that already exist are
 * patched (and marked dirty); unknown ones are created. Returns the same state
 * when nothing changed.
 *
 * @param state - Current state.
 * @param payload - Entities (or partial-looking full objects) carrying their `id`.
 * @param now - Timestamp used for `$meta.updatedAt` / `createdAt`.
 */
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
    const existing = nextById[entity.id]
    const next = existing
      ? patchEntity(existing, entity, now)
      : withMeta(entity, now)
    if (next === existing) continue
    if (nextById === byId) nextById = { ...byId }
    nextById[entity.id] = next
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

/**
 * Set one field of an entity (marks it dirty and records the field in
 * `$meta.changedFields`). Returns the same state when the entity is unknown or the
 * value is identical (`Object.is`).
 *
 * @param state - Current state.
 * @param field - Key to change.
 * @param value - New value.
 * @param id - Id of the entity to change.
 * @param now - Timestamp used for `$meta.updatedAt`.
 */
export function updateField<T extends WithId, K extends keyof T>(
  state: State<T>,
  field: K,
  value: T[K],
  id: Id,
  now?: number,
): State<T> {
  const existing = state.entities.byId[id]
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

/**
 * Delete an entity, also removing it from `allIds` and `active`. Returns the same
 * state when the id is unknown. `current` and `currentById` are left untouched.
 *
 * @param state - Current state.
 * @param id - Id to delete.
 */
export function deleteOne<T extends WithId>(state: State<T>, id: Id): State<T> {
  const { byId, allIds, active } = state.entities
  if (!(id in byId) && !allIds.includes(id) && !active.includes(id))
    return state
  const { [id]: _removed, ...rest } = byId
  return setEntities(state, {
    byId: rest,
    allIds: allIds.filter((entityId) => entityId !== id),
    active: active.filter((entityId) => entityId !== id),
  })
}

/**
 * Delete several entities in one pass (see {@link deleteOne}). Returns the same
 * state when nothing was removed.
 *
 * @param state - Current state.
 * @param ids - Ids to delete.
 */
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
    if (!(id in nextById)) continue
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
  })
}

/**
 * Set `current` to a clean copy of `payload`. It is independent from `byId`: use
 * {@link setCurrentById} to point at a stored entity instead.
 *
 * @param state - Current state.
 * @param payload - The entity being edited or displayed.
 * @param now - Timestamp used for `$meta.createdAt`.
 */
export function setCurrent<T extends WithId>(
  state: State<T>,
  payload: T,
  now?: number,
): State<T> {
  return setEntities(state, { current: withMeta(payload, now) })
}

/**
 * Clear `current`. Returns the same state when it is already `null`.
 */
export function removeCurrent<T extends WithId>(state: State<T>): State<T> {
  return state.entities.current === null
    ? state
    : setEntities(state, { current: null })
}

/**
 * Point `currentById` to a stored entity. Ignored (same state returned) when the id
 * is unknown or already current.
 *
 * @param state - Current state.
 * @param id - Id of a stored entity.
 */
export function setCurrentById<T extends WithId>(
  state: State<T>,
  id: Id,
): State<T> {
  if (!state.entities.byId[id] || state.entities.currentById === id)
    return state
  return setEntities(state, { currentById: id })
}

/**
 * Clear `currentById`. Returns the same state when it is already `null`.
 */
export function removeCurrentById<T extends WithId>(state: State<T>): State<T> {
  return state.entities.currentById === null
    ? state
    : setEntities(state, { currentById: null })
}

/**
 * Add an id to `active` (e.g. a selected row). Ignored when the id is unknown or
 * already active.
 *
 * @param state - Current state.
 * @param id - Id of a stored entity.
 */
export function setActive<T extends WithId>(state: State<T>, id: Id): State<T> {
  const { active, byId } = state.entities
  if (active.includes(id) || !byId[id]) return state
  return setEntities(state, { active: [...active, id] })
}

/**
 * Empty `active`. Returns the same state when it is already empty.
 */
export function resetActive<T extends WithId>(state: State<T>): State<T> {
  return state.entities.active.length === 0
    ? state
    : setEntities(state, { active: [] })
}

/**
 * Mark a stored entity as dirty without changing its fields. Returns the same
 * state when the id is unknown or the entity is already dirty.
 *
 * @param state - Current state.
 * @param id - Id of the entity.
 */
export function setIsDirty<T extends WithId>(
  state: State<T>,
  id: Id,
): State<T> {
  const existing = state.entities.byId[id]
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
  const existing = state.entities.byId[id]
  if (!existing) return state
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
