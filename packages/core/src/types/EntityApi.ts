import type { EntityWithMeta } from './EntityMeta.js'
import type { EntityFilter } from './Filter.js'
import type { SortOptions } from './SortOptions.js'
import type { State } from './State.js'
import type { Id, WithId } from './WithId.js'

/** State-bound actions: they update the store and return nothing. */
export interface EntityActions<T extends WithId> {
  createOne(payload: T): void
  createMany(payload: T[]): void
  /** Replace the whole collection (clean entities); see `setAll`. */
  setAll(payload: T[]): void
  updateOne(id: Id, payload: T): void
  updateMany(payload: T[]): void
  updateField<K extends keyof T>(field: K, value: T[K], id: Id): void
  deleteOne(id: Id): void
  deleteMany(ids: Id[]): void
  setCurrent(payload: T): void
  removeCurrent(): void
  setCurrentById(id: Id): void
  removeCurrentById(): void
  setActive(id: Id): void
  resetActive(): void
  setIsDirty(id: Id): void
  setIsNotDirty(id: Id): void
}

/** State-bound getters. */
export interface EntityGetters<T extends WithId> {
  getAll(): Record<Id, EntityWithMeta<T>>
  getAllArray(): EntityWithMeta<T>[]
  getAllIds(): Id[]
  getIsEmpty(): boolean
  getIsNotEmpty(): boolean
  getCurrent(): EntityWithMeta<T> | null
  getCurrentById(): EntityWithMeta<T> | null
  getActive(): Id[]
  getFirstActive(): Id | undefined
  getOne(id: Id): EntityWithMeta<T> | undefined
  getMany(ids: Id[]): EntityWithMeta<T>[]
  getWhere(filter?: EntityFilter<T> | null): Record<Id, EntityWithMeta<T>>
  getWhereArray(
    filter?: EntityFilter<T> | null,
    options?: SortOptions<T>,
  ): EntityWithMeta<T>[]
  getSortedArray(options: SortOptions<T>): EntityWithMeta<T>[]
  getByField<K extends keyof EntityWithMeta<T>>(
    field: K,
    value: EntityWithMeta<T>[K],
  ): EntityWithMeta<T>[]
  getFirstWhere(filter?: EntityFilter<T> | null): EntityWithMeta<T> | undefined
  isAlreadyInStore(id: Id): boolean
  isAlreadyActive(id: Id): boolean
  isDirty(id: Id): boolean
  getMissingIds(ids: Id[], canHaveDuplicates?: boolean): Id[]
  getMissingEntities(entities: T[]): T[]
  search(query: string): EntityWithMeta<T>[]
}

export interface EntityApi<T extends WithId> {
  actions: EntityActions<T>
  getters: EntityGetters<T>
}

export interface EntityStateAccess<T extends WithId> {
  get: () => State<T>
  set: (state: State<T>) => void
  /**
   * Memoize `getAllArray` (and unfiltered `getWhereArray`): the same array is
   * returned while `byId` and `allIds` are unchanged. Defaults to `true`.
   */
  memoize?: boolean | undefined
}
