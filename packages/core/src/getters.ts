import type { EntityWithMeta } from './types/EntityMeta.js'
import type { SortOptions } from './types/SortOptions.js'
import type { State } from './types/State.js'
import type { Id, WithId } from './types/WithId.js'
import { sortEntities } from './utils/sortEntities.js'

/**
 * Pure getters: `(state, ...args) => value`. They never mutate the state.
 * Results are derived from `allIds` order, so ordering is deterministic.
 */

type Predicate<T extends WithId> = (item: EntityWithMeta<T>) => boolean | null

export const getAll = <T extends WithId>(state: State<T>) => state.entities.byId

export const getAllIds = <T extends WithId>(state: State<T>) =>
  state.entities.allIds

/** Options accepted by the getters that build a derived array. */
export interface GetterOptions {
  /**
   * Reuse the previous array while `byId` and `allIds` are unchanged (default
   * `true`). Pass `false` to rebuild it on every call.
   */
  memoize?: boolean
}

const allArrayCache = new WeakMap<
  object,
  { allIds: Id[]; result: EntityWithMeta<never>[] }
>()

function readAll<T extends WithId>(
  state: State<T>,
  memoize: boolean,
): EntityWithMeta<T>[] {
  const { byId, allIds } = state.entities
  if (!memoize) return getMany(state, allIds)
  const hit = allArrayCache.get(byId)
  if (hit && hit.allIds === allIds)
    return hit.result as unknown as EntityWithMeta<T>[]
  const result = getMany(state, allIds)
  allArrayCache.set(byId, {
    allIds,
    result: result as unknown as EntityWithMeta<never>[],
  })
  return result
}

/**
 * Every entity, in `allIds` order.
 *
 * Memoized by default: while `byId` and `allIds` keep the same references the
 * very same array is returned, so it is safe as a React/Vue dependency. Changing
 * `current`, `active` or `currentById` does not invalidate it. The array is
 * shared: treat it as read-only (copy before sorting). Pass
 * `{ memoize: false }` to get a fresh array every time.
 */
export function getAllArray<T extends WithId>(
  state: State<T>,
  options?: GetterOptions,
): EntityWithMeta<T>[] {
  return readAll(state, options?.memoize !== false)
}

export const getIsEmpty = <T extends WithId>(state: State<T>) =>
  state.entities.allIds.length === 0

export const getIsNotEmpty = <T extends WithId>(state: State<T>) =>
  state.entities.allIds.length > 0

export const getCurrent = <T extends WithId>(state: State<T>) =>
  state.entities.current

export const getCurrentById = <T extends WithId>(state: State<T>) =>
  state.entities.currentById === null
    ? null
    : (state.entities.byId[state.entities.currentById] ?? null)

export const getActive = <T extends WithId>(state: State<T>) =>
  state.entities.active

export const getFirstActive = <T extends WithId>(state: State<T>) =>
  state.entities.active[0]

export const getOne = <T extends WithId>(state: State<T>, id: Id) =>
  state.entities.byId[id]

export function getMany<T extends WithId>(
  state: State<T>,
  ids: Id[],
): EntityWithMeta<T>[] {
  if (!Array.isArray(ids)) return []
  const out: EntityWithMeta<T>[] = []
  for (const id of ids) {
    const item = state.entities.byId[id]
    if (item) out.push(item)
  }
  return out
}

function whereArray<T extends WithId>(
  memoize: boolean,
  state: State<T>,
  filter?: Predicate<T> | null,
  options?: SortOptions<T>,
): EntityWithMeta<T>[] {
  const all = readAll(state, memoize)
  if (typeof filter !== 'function') return all
  const filtered = all.filter((item) => filter(item))
  return options?.orderBy ? sortEntities(filtered, options) : filtered
}

export function getWhereArray<T extends WithId>(
  state: State<T>,
  filter?: Predicate<T> | null,
  options?: SortOptions<T>,
): EntityWithMeta<T>[] {
  return whereArray(true, state, filter, options)
}

/** Dictionary of the entities passing the filter (sorting is not applicable). */
export function getWhere<T extends WithId>(
  state: State<T>,
  filter?: Predicate<T> | null,
): Record<Id, EntityWithMeta<T>> {
  if (typeof filter !== 'function') return state.entities.byId
  const out: Record<Id, EntityWithMeta<T>> = {}
  for (const item of getAllArray(state)) if (filter(item)) out[item.id] = item
  return out
}

export function getFirstWhere<T extends WithId>(
  state: State<T>,
  filter?: Predicate<T> | null,
): EntityWithMeta<T> | undefined {
  const all = getAllArray(state)
  return typeof filter === 'function' ? all.find((i) => filter(i)) : all[0]
}

export const isAlreadyInStore = <T extends WithId>(state: State<T>, id: Id) =>
  state.entities.allIds.includes(id)

export const isAlreadyActive = <T extends WithId>(state: State<T>, id: Id) =>
  state.entities.active.includes(id)

export const isDirty = <T extends WithId>(state: State<T>, id: Id) =>
  state.entities.byId[id]?.$isDirty ?? false

/** Ids from the list that are not in the store. Deduplicated unless asked. */
export function getMissingIds<T extends WithId>(
  state: State<T>,
  ids: Id[],
  canHaveDuplicates?: boolean,
): Id[] {
  if (!Array.isArray(ids) || ids.length === 0) return []
  const missing = ids.filter((id) => !state.entities.allIds.includes(id))
  return canHaveDuplicates ? missing : [...new Set(missing)]
}

export function getMissingEntities<T extends WithId>(
  state: State<T>,
  entities: T[],
): T[] {
  if (!Array.isArray(entities) || entities.length === 0) return []
  return entities.filter((e) => !state.entities.allIds.includes(e.id))
}

/** Case-insensitive regex search over the string fields of every entity. */
export function search<T extends WithId>(
  state: State<T>,
  query: string,
): EntityWithMeta<T>[] {
  const regex = new RegExp(query, 'i')
  return getAllArray(state).filter((item) =>
    Object.values(item).some((v) => typeof v === 'string' && regex.test(v)),
  )
}

/**
 * The same getters without memoization: `getAllArray` and `getWhereArray`
 * (with no filter) build a fresh array on every call. Used by the adapters when
 * created with `{ memoize: false }`.
 */
export const uncachedGetters = {
  getAllArray: <T extends WithId>(state: State<T>) => readAll(state, false),
  getWhereArray: <T extends WithId>(
    state: State<T>,
    filter?: Predicate<T> | null,
    options?: SortOptions<T>,
  ) => whereArray(false, state, filter, options),
}
