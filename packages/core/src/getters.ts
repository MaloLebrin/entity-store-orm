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

declare const process: { env?: { NODE_ENV?: string } } | undefined

/**
 * Outside production the memoized array is frozen, so an in-place `sort()` or
 * `push()` throws instead of silently corrupting the shared cache. Bundlers
 * replace `process.env.NODE_ENV`; with no bundler and no `process`, no freeze.
 */
const freezeInDev =
  typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'

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
  if (freezeInDev) Object.freeze(result)
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
 * shared: treat it as read-only (copy before sorting); outside production it is
 * frozen so a mutation throws. Pass
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

interface WhereEntry {
  allIds: Id[]
  filter: unknown
  orderBy: unknown
  sortBy: unknown
  result: EntityWithMeta<never>[]
}

/** One remembered filtered result per `byId`: pays off when the filter (and
 * `orderBy`) are stable references, never worse than recomputing. */
const whereCache = new WeakMap<object, WhereEntry>()

function whereArray<T extends WithId>(
  memoize: boolean,
  state: State<T>,
  filter?: Predicate<T> | null,
  options?: SortOptions<T>,
): EntityWithMeta<T>[] {
  const all = readAll(state, memoize)
  if (typeof filter !== 'function') return all
  const { byId, allIds } = state.entities
  if (memoize) {
    const hit = whereCache.get(byId)
    if (
      hit &&
      hit.allIds === allIds &&
      hit.filter === filter &&
      hit.orderBy === options?.orderBy &&
      hit.sortBy === options?.sortBy
    )
      return hit.result as unknown as EntityWithMeta<T>[]
  }
  const filtered = all.filter((item) => filter(item))
  const result = options?.orderBy ? sortEntities(filtered, options) : filtered
  if (memoize) {
    if (freezeInDev) Object.freeze(result)
    whereCache.set(byId, {
      allIds,
      filter,
      orderBy: options?.orderBy,
      sortBy: options?.sortBy,
      result: result as unknown as EntityWithMeta<never>[],
    })
  }
  return result
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

interface SortedEntry {
  orderBy: unknown
  sortBy: unknown
  result: EntityWithMeta<never>[]
}

const MAX_SORTED_PER_COLLECTION = 4
const sortedCache = new WeakMap<
  object,
  { allIds: Id[]; entries: SortedEntry[] }
>()

function sortedArray<T extends WithId>(
  memoize: boolean,
  state: State<T>,
  options: SortOptions<T>,
): EntityWithMeta<T>[] {
  if (!options.orderBy) return readAll(state, memoize)
  if (!memoize) return sortEntities(readAll(state, false), options)
  const { byId, allIds } = state.entities
  let slot = sortedCache.get(byId)
  if (!slot || slot.allIds !== allIds) {
    slot = { allIds, entries: [] }
    sortedCache.set(byId, slot)
  }
  const found = slot.entries.find(
    (e) => e.orderBy === options.orderBy && e.sortBy === options.sortBy,
  )
  if (found) return found.result as unknown as EntityWithMeta<T>[]
  const result = sortEntities(readAll(state, true), options)
  if (freezeInDev) Object.freeze(result)
  slot.entries.push({
    orderBy: options.orderBy,
    sortBy: options.sortBy,
    result: result as unknown as EntityWithMeta<never>[],
  })
  if (slot.entries.length > MAX_SORTED_PER_COLLECTION) slot.entries.shift()
  return result
}

/**
 * Every entity sorted by `options.orderBy` / `options.sortBy`. Memoized per
 * `(byId, allIds, orderBy, sortBy)`, so the sort runs once per change instead of
 * once per read. Use a field name (or a stable function reference) for
 * `orderBy`: an inline arrow function is a new key on every call and never hits.
 * Up to 4 distinct orderings are remembered per collection. Without `orderBy`
 * it is `getAllArray`. The result is shared and read-only (frozen outside
 * production).
 */
export function getSortedArray<T extends WithId>(
  state: State<T>,
  options: SortOptions<T>,
): EntityWithMeta<T>[] {
  return sortedArray(true, state, options)
}

const NONE = Object.freeze([]) as unknown as EntityWithMeta<never>[]
const indexCache = new WeakMap<
  object,
  Map<
    PropertyKey,
    { allIds: Id[]; index: Map<unknown, EntityWithMeta<never>[]> }
  >
>()

function byField<T extends WithId, K extends keyof EntityWithMeta<T>>(
  memoize: boolean,
  state: State<T>,
  field: K,
  value: EntityWithMeta<T>[K],
): EntityWithMeta<T>[] {
  if (!memoize)
    return readAll(state, false).filter((item) => Object.is(item[field], value))
  const { byId, allIds } = state.entities
  let perField = indexCache.get(byId)
  if (!perField) {
    perField = new Map()
    indexCache.set(byId, perField)
  }
  let entry = perField.get(field)
  if (!entry || entry.allIds !== allIds) {
    const index = new Map<unknown, EntityWithMeta<never>[]>()
    for (const item of readAll(state, true)) {
      const key = (item as EntityWithMeta<T>)[field]
      const bucket = index.get(key)
      if (bucket) bucket.push(item as unknown as EntityWithMeta<never>)
      else index.set(key, [item as unknown as EntityWithMeta<never>])
    }
    if (freezeInDev) for (const bucket of index.values()) Object.freeze(bucket)
    entry = { allIds, index }
    perField.set(field, entry)
  }
  return (entry.index.get(value) ?? NONE) as unknown as EntityWithMeta<T>[]
}

/**
 * The entities whose `field` equals `value` (SameValueZero, like `Map`), in
 * `allIds` order. The first call per `(collection, field)` builds an index in
 * O(n); every later lookup is O(1) until the collection changes. Prefer it over
 * `getWhereArray((e) => e.field === value)` for repeated lookups on large
 * collections (foreign keys, status, ...). The result is shared and read-only
 * (frozen outside production); a miss returns one shared empty array.
 */
export function getByField<T extends WithId, K extends keyof EntityWithMeta<T>>(
  state: State<T>,
  field: K,
  value: EntityWithMeta<T>[K],
): EntityWithMeta<T>[] {
  return byField(true, state, field, value)
}

/**
 * The same getters without memoization: `getAllArray`, `getWhereArray`,
 * `getSortedArray` and `getByField` build a fresh array on every call. Used by the adapters when
 * created with `{ memoize: false }`.
 */
export const uncachedGetters = {
  getAllArray: <T extends WithId>(state: State<T>) => readAll(state, false),
  getWhereArray: <T extends WithId>(
    state: State<T>,
    filter?: Predicate<T> | null,
    options?: SortOptions<T>,
  ) => whereArray(false, state, filter, options),
  getSortedArray: <T extends WithId>(
    state: State<T>,
    options: SortOptions<T>,
  ) => sortedArray(false, state, options),
  getByField: <T extends WithId, K extends keyof EntityWithMeta<T>>(
    state: State<T>,
    field: K,
    value: EntityWithMeta<T>[K],
  ) => byField(false, state, field, value),
}
