import { getOwn } from './entity.js'
import type { EntityWithMeta } from './types/EntityMeta.js'
import type { EntityFilter, WhereObject } from './types/Filter.js'
import type { SortOptions } from './types/SortOptions.js'
import type { State } from './types/State.js'
import type { Id, WithId } from './types/WithId.js'
import { sortEntities } from './utils/sortEntities.js'

/**
 * Pure getters: `(state, ...args) => value`. They never mutate the state.
 * Results are derived from `allIds` order, so ordering is deterministic.
 */

/**
 * The `byId` dictionary (same reference as in the state).
 */
export const getAll = <T extends WithId>(state: State<T>) => state.entities.byId

/**
 * Ids in insertion order (same reference as `state.entities.allIds`).
 */
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

/**
 * `true` when the collection has no entity.
 */
export const getIsEmpty = <T extends WithId>(state: State<T>) =>
  state.entities.allIds.length === 0

/**
 * `true` when the collection has at least one entity.
 */
export const getIsNotEmpty = <T extends WithId>(state: State<T>) =>
  state.entities.allIds.length > 0

/**
 * The entity set with `setCurrent`, or `null`.
 */
export const getCurrent = <T extends WithId>(state: State<T>) =>
  state.entities.current

/**
 * The stored entity pointed to by `currentById`, or `null` (also `null` when the
 * entity was deleted since).
 */
export const getCurrentById = <T extends WithId>(state: State<T>) =>
  state.entities.currentById === null
    ? null
    : (getOwn(state.entities.byId, state.entities.currentById) ?? null)

/**
 * Active ids (e.g. selected rows), in activation order.
 */
export const getActive = <T extends WithId>(state: State<T>) =>
  state.entities.active

/**
 * The first active id, or `undefined`.
 */
export const getFirstActive = <T extends WithId>(state: State<T>) =>
  state.entities.active[0]

/**
 * The entity with this id, or `undefined`.
 */
export const getOne = <T extends WithId>(state: State<T>, id: Id) =>
  getOwn(state.entities.byId, id)

/**
 * The stored entities for `ids`, in the given order; unknown ids are skipped.
 */
export function getMany<T extends WithId>(
  state: State<T>,
  ids: Id[],
): EntityWithMeta<T>[] {
  if (!Array.isArray(ids)) return []
  const out: EntityWithMeta<T>[] = []
  for (const id of ids) {
    const item = getOwn(state.entities.byId, id)
    if (item) out.push(item)
  }
  return out
}

/** SameValueZero, the equality `getByField` and `Map` use. */
const sameValue = (a: unknown, b: unknown) =>
  a === b ||
  (typeof a === 'number' &&
    typeof b === 'number' &&
    Number.isNaN(a) &&
    Number.isNaN(b))

function matches(
  item: object,
  filter: object,
  keys: readonly string[],
): boolean {
  for (const key of keys)
    if (
      !sameValue(
        (item as Record<string, unknown>)[key],
        (filter as Record<string, unknown>)[key],
      )
    )
      return false
  return true
}

/** Same fields, same values: the by-value identity of an object filter. */
function sameFilter(a: object, b: object): boolean {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  for (const key of keys)
    if (
      !Object.hasOwn(b, key) ||
      !sameValue(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      )
    )
      return false
  return true
}

interface ObjectWhereEntry {
  filter: object
  orderBy: unknown
  sortBy: unknown
  result: EntityWithMeta<never>[]
}

const MAX_OBJECT_WHERE_PER_COLLECTION = 8
const objectWhereCache = new WeakMap<
  object,
  { allIds: Id[]; entries: ObjectWhereEntry[] }
>()
const recordCache = new WeakMap<object, Record<Id, EntityWithMeta<never>>>()

function whereObjectArray<T extends WithId>(
  memoize: boolean,
  state: State<T>,
  filter: WhereObject<T>,
  options?: SortOptions<T>,
): EntityWithMeta<T>[] {
  const keys = Object.keys(filter)
  const first = keys[0]
  if (first === undefined)
    return options?.orderBy
      ? sortedArray(memoize, state, options)
      : readAll(state, memoize)
  if (!memoize) {
    const filtered = readAll(state, false).filter((item) =>
      matches(item, filter, keys),
    )
    return options?.orderBy ? sortEntities(filtered, options) : filtered
  }
  const lookup = () =>
    byField(
      true,
      state,
      first as keyof EntityWithMeta<T>,
      (filter as Record<string, unknown>)[first] as never,
    )
  // One field, no sort: the index bucket is already the answer.
  if (keys.length === 1 && !options?.orderBy) return lookup()

  const { byId, allIds } = state.entities
  let slot = objectWhereCache.get(byId)
  if (!slot || slot.allIds !== allIds) {
    slot = { allIds, entries: [] }
    objectWhereCache.set(byId, slot)
  }
  const found = slot.entries.find(
    (e) =>
      e.orderBy === options?.orderBy &&
      e.sortBy === options?.sortBy &&
      sameFilter(e.filter, filter),
  )
  if (found) return found.result as unknown as EntityWithMeta<T>[]
  const bucket = lookup()
  const rest = keys.slice(1)
  const filtered =
    rest.length === 0 ? bucket : bucket.filter((i) => matches(i, filter, rest))
  const result = options?.orderBy ? sortEntities(filtered, options) : filtered
  if (freezeInDev) Object.freeze(result)
  slot.entries.push({
    // Snapshot: a later mutation of the caller's object must not change the key.
    filter: { ...filter },
    orderBy: options?.orderBy,
    sortBy: options?.sortBy,
    result: result as unknown as EntityWithMeta<never>[],
  })
  if (slot.entries.length > MAX_OBJECT_WHERE_PER_COLLECTION)
    slot.entries.shift()
  return result
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
  filter?: EntityFilter<T> | null,
  options?: SortOptions<T>,
): EntityWithMeta<T>[] {
  if (typeof filter === 'object' && filter !== null)
    return whereObjectArray(memoize, state, filter, options)
  if (typeof filter !== 'function')
    return options?.orderBy
      ? sortedArray(memoize, state, options)
      : readAll(state, memoize)
  const all = readAll(state, memoize)
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

/**
 * Entities passing the filter, in `allIds` order (sorted when `orderBy` is
 * set). `filter` is either a predicate or a declarative object such as
 * `{ role: 'admin', age: 30 }` (strict equality on every field, AND).
 *
 * Memoized per `byId`/`allIds`. A predicate is keyed by reference, so an inline
 * arrow never hits; an object filter is keyed by VALUE, so an inline literal
 * hits, and its first field is resolved through the `getByField` index. The
 * result is shared and read-only (frozen outside production).
 */
export function getWhereArray<T extends WithId>(
  state: State<T>,
  filter?: EntityFilter<T> | null,
  options?: SortOptions<T>,
): EntityWithMeta<T>[] {
  return whereArray(true, state, filter, options)
}

function whereRecord<T extends WithId>(
  memoize: boolean,
  state: State<T>,
  filter?: EntityFilter<T> | null,
): Record<Id, EntityWithMeta<T>> {
  if (typeof filter === 'object' && filter !== null) {
    if (Object.keys(filter).length === 0) return state.entities.byId
    const arr = whereObjectArray(memoize, state, filter)
    if (memoize) {
      const hit = recordCache.get(arr)
      if (hit) return hit as Record<Id, EntityWithMeta<T>>
    }
    const out: Record<Id, EntityWithMeta<T>> = {}
    for (const item of arr) out[item.id] = item
    if (memoize) {
      if (freezeInDev) Object.freeze(out)
      recordCache.set(arr, out as unknown as Record<Id, EntityWithMeta<never>>)
    }
    return out
  }
  if (typeof filter !== 'function') return state.entities.byId
  const out: Record<Id, EntityWithMeta<T>> = {}
  for (const item of getAllArray(state)) if (filter(item)) out[item.id] = item
  return out
}

/**
 * Dictionary of the entities passing the filter (sorting is not applicable).
 * With an object filter the dictionary is memoized like `getWhereArray` (same
 * reference while nothing changed, frozen outside production).
 */
export function getWhere<T extends WithId>(
  state: State<T>,
  filter?: EntityFilter<T> | null,
): Record<Id, EntityWithMeta<T>> {
  return whereRecord(true, state, filter)
}

function firstWhere<T extends WithId>(
  memoize: boolean,
  state: State<T>,
  filter?: EntityFilter<T> | null,
): EntityWithMeta<T> | undefined {
  if (typeof filter === 'object' && filter !== null) {
    const keys = Object.keys(filter)
    const first = keys[0]
    if (first === undefined) return readAll(state, memoize)[0]
    const rest = keys.slice(1)
    const bucket = byField(
      memoize,
      state,
      first as keyof EntityWithMeta<T>,
      (filter as Record<string, unknown>)[first] as never,
    )
    return rest.length === 0
      ? bucket[0]
      : bucket.find((item) => matches(item, filter, rest))
  }
  const all = readAll(state, memoize)
  return typeof filter === 'function' ? all.find((i) => filter(i)) : all[0]
}

/**
 * First entity (in `allIds` order) passing the filter. With an object filter
 * the first field goes through the `getByField` index, so a single-field
 * lookup is O(1) once the index is built.
 */
export function getFirstWhere<T extends WithId>(
  state: State<T>,
  filter?: EntityFilter<T> | null,
): EntityWithMeta<T> | undefined {
  return firstWhere(true, state, filter)
}

/**
 * `true` when an entity with this id is stored.
 */
export const isAlreadyInStore = <T extends WithId>(state: State<T>, id: Id) =>
  state.entities.allIds.includes(id)

/**
 * `true` when this id is in `active`.
 */
export const isAlreadyActive = <T extends WithId>(state: State<T>, id: Id) =>
  state.entities.active.includes(id)

/**
 * `true` when the entity exists and is dirty; `false` otherwise.
 */
export const isDirty = <T extends WithId>(state: State<T>, id: Id) =>
  getOwn(state.entities.byId, id)?.$isDirty ?? false

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

/**
 * The entities of the list whose id is not stored yet.
 */
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
 * `getSortedArray` and `getByField` build a fresh array on every call (and
 * `getWhere` / `getFirstWhere` skip the object-filter caches). Used by the adapters when
 * created with `{ memoize: false }`.
 */
export const uncachedGetters = {
  getAllArray: <T extends WithId>(state: State<T>) => readAll(state, false),
  getWhereArray: <T extends WithId>(
    state: State<T>,
    filter?: EntityFilter<T> | null,
    options?: SortOptions<T>,
  ) => whereArray(false, state, filter, options),
  getWhere: <T extends WithId>(
    state: State<T>,
    filter?: EntityFilter<T> | null,
  ) => whereRecord(false, state, filter),
  getFirstWhere: <T extends WithId>(
    state: State<T>,
    filter?: EntityFilter<T> | null,
  ) => firstWhere(false, state, filter),
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
