import type { EntityWithMeta } from './EntityMeta.js'
import type { EntityFilter } from './Filter.js'
import type { SortOptions } from './SortOptions.js'
import type { State } from './State.js'
import type { Id, WithId } from './WithId.js'

/** State-bound actions: they update the store and return nothing. */
export interface EntityActions<T extends WithId> {
  /** Add an entity (replaces it when the id exists). See `createOne`. */
  createOne(payload: T): void
  /** Add several entities in one pass. */
  createMany(payload: T[]): void
  /** Replace the whole collection (clean entities); see `setAll`. */
  setAll(payload: T[]): void
  /** Patch an entity and mark it dirty; creates it when missing. */
  updateOne(id: Id, payload: T): void
  /** Patch or create several entities in one pass. */
  updateMany(payload: T[]): void
  /** Set one field of an entity and mark it dirty. */
  updateField<K extends keyof T>(field: K, value: T[K], id: Id): void
  /** Delete an entity (also removed from `active`). */
  deleteOne(id: Id): void
  /** Delete several entities. */
  deleteMany(ids: Id[]): void
  /** Set the `current` entity (a free-standing copy). */
  setCurrent(payload: T): void
  /** Clear `current`. */
  removeCurrent(): void
  /** Point `currentById` to a stored entity. */
  setCurrentById(id: Id): void
  /** Clear `currentById`. */
  removeCurrentById(): void
  /** Add a stored id to `active`. */
  setActive(id: Id): void
  /** Empty `active`. */
  resetActive(): void
  /** Mark an entity as dirty. */
  setIsDirty(id: Id): void
  /** Mark an entity as clean and forget its changed fields. */
  setIsNotDirty(id: Id): void
  /** Apply a patch now and remember how to undo it, under `txId`; see `optimisticUpdate`. */
  optimisticUpdate(id: Id, patch: Partial<T>, txId: Id): void
  /** The server accepted update `txId`: keep the values. */
  commitOptimistic(id: Id, txId: Id): void
  /** The server refused update `txId`: restore the previous values. */
  rollbackOptimistic(id: Id, txId: Id): void
}

/** State-bound getters. */
export interface EntityGetters<T extends WithId> {
  /** The `byId` dictionary. */
  getAll(): Record<Id, EntityWithMeta<T>>
  /** Every entity in insertion order. Memoized and shared (read-only, frozen in dev) unless created with `memoize: false`. */
  getAllArray(): EntityWithMeta<T>[]
  /** Ids in insertion order. */
  getAllIds(): Id[]
  /** `true` when the collection is empty. */
  getIsEmpty(): boolean
  /** `true` when the collection has entities. */
  getIsNotEmpty(): boolean
  /** The `current` entity or `null`. */
  getCurrent(): EntityWithMeta<T> | null
  /** The stored entity pointed to by `currentById`, or `null`. */
  getCurrentById(): EntityWithMeta<T> | null
  /** Active ids. */
  getActive(): Id[]
  /** First active id. */
  getFirstActive(): Id | undefined
  /** One entity by id. */
  getOne(id: Id): EntityWithMeta<T> | undefined
  /** Several entities by id (unknown ids skipped). */
  getMany(ids: Id[]): EntityWithMeta<T>[]
  /** Dictionary of the entities passing `filter` (predicate or object). */
  getWhere(filter?: EntityFilter<T> | null): Record<Id, EntityWithMeta<T>>
  /** Entities passing `filter`, optionally sorted. Memoized: stable predicate reference, or any object filter. */
  getWhereArray(
    filter?: EntityFilter<T> | null,
    options?: SortOptions<T>,
  ): EntityWithMeta<T>[]
  /** Every entity sorted by `options`. Memoized per ordering; pass a field name or a stable function. */
  getSortedArray(options: SortOptions<T>): EntityWithMeta<T>[]
  /** Entities whose `field` equals `value`, through a per-field index (O(1) after the first call). */
  getByField<K extends keyof EntityWithMeta<T>>(
    field: K,
    value: EntityWithMeta<T>[K],
  ): EntityWithMeta<T>[]
  /** First entity passing `filter`. */
  getFirstWhere(filter?: EntityFilter<T> | null): EntityWithMeta<T> | undefined
  /** `true` when the id is stored. */
  isAlreadyInStore(id: Id): boolean
  /** `true` when the id is active. */
  isAlreadyActive(id: Id): boolean
  /** `true` when the entity is dirty. */
  isDirty(id: Id): boolean
  /** Whether the entity has optimistic updates not yet committed or rolled back. */
  isPending(id: Id): boolean
  /** Ids of the list that are not stored (deduplicated unless `canHaveDuplicates`). */
  getMissingIds(ids: Id[], canHaveDuplicates?: boolean): Id[]
  /** Entities of the list that are not stored. */
  getMissingEntities(entities: T[]): T[]
  /** Case-insensitive regex search over string fields. */
  search(query: string): EntityWithMeta<T>[]
}

/** What `createEntityApi` returns: actions that write the state, getters that read it. */
export interface EntityApi<T extends WithId> {
  actions: EntityActions<T>
  getters: EntityGetters<T>
}

/** How an adapter lets `createEntityApi` read and write its state container. */
export interface EntityStateAccess<T extends WithId> {
  /** Read the current state. */
  get: () => State<T>
  /** Store the next state (never mutate the one given to `get`). */
  set: (state: State<T>) => void
  /**
   * Memoize `getAllArray` (and unfiltered `getWhereArray`): the same array is
   * returned while `byId` and `allIds` are unchanged. Defaults to `true`.
   */
  memoize?: boolean | undefined
}
