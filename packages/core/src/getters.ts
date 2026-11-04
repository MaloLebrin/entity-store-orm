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

export function getAllArray<T extends WithId>(
  state: State<T>,
): EntityWithMeta<T>[] {
  return getMany(state, state.entities.allIds)
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

export function getWhereArray<T extends WithId>(
  state: State<T>,
  filter?: Predicate<T> | null,
  options?: SortOptions<T>,
): EntityWithMeta<T>[] {
  const all = getAllArray(state)
  if (typeof filter !== 'function') return all
  const filtered = all.filter((item) => filter(item))
  return options?.orderBy ? sortEntities(filtered, options) : filtered
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
