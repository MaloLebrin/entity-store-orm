import {
  actions as a,
  createState,
  type EntityGetters,
  type EntityWithMeta,
  getters as gAll,
  type Id,
  type State,
  uncachedGetters,
  type WithId,
} from '@entity-store/core'
import {
  createSlice,
  type Draft,
  original,
  type PayloadAction,
} from '@reduxjs/toolkit'

export type {
  EntityGetters,
  EntityWithMeta,
  Id,
  SortOptions,
  State,
  WithId,
} from '@entity-store/core'

/** Selectors bound to a root state: `(root, ...args) => value`. */
export type EntitySelectors<T extends WithId, Root> = {
  [K in keyof EntityGetters<T>]: (
    root: Root,
    ...args: Parameters<EntityGetters<T>[K]>
  ) => ReturnType<EntityGetters<T>[K]>
}

/**
 * Create a Redux Toolkit slice holding a normalized entity collection.
 *
 * ```ts
 * const users = createEntitySlice<User>('users')
 * store.dispatch(users.actions.createOne({ id: 1, name: 'Ada' }))
 * const { getOne } = users.getSelectors((root: RootState) => root.users)
 * getOne(store.getState(), 1)
 * ```
 *
 * Reducers delegate to the pure core actions, so they stay immutable and the
 * state is plain serializable data. `getAllArray` selectors are memoized on
 * `byId`/`allIds`; pass `{ memoize: false }` to rebuild the array on each call.
 */
export function createEntitySlice<T extends WithId>(
  name: string,
  { memoize = true }: { memoize?: boolean | undefined } = {},
) {
  const g = memoize ? gAll : { ...gAll, ...uncachedGetters }
  // Reducers receive an Immer draft. The core is already immutable, so we run
  // it on the original (frozen) state and return the next state as-is.
  const base = (draft: Draft<State<T>>): State<T> =>
    ((original as (value: unknown) => State<T> | undefined)(draft) ??
      draft) as State<T>
  const reduce =
    <P>(fn: (state: State<T>, payload: P) => State<T>) =>
    (draft: Draft<State<T>>, { payload }: PayloadAction<P>) =>
      fn(base(draft), payload) as Draft<State<T>>

  const slice = createSlice({
    name,
    initialState: createState<T>() as State<T>,
    reducers: {
      createOne: reduce<T>(a.createOne),
      createMany: reduce<T[]>(a.createMany),
      setAll: reduce<T[]>(a.setAll),
      updateOne: reduce<{ id: Id; payload: T }>((s, p) =>
        a.updateOne(s, p.id, p.payload),
      ),
      updateMany: reduce<T[]>(a.updateMany),
      updateField: reduce<{ field: keyof T; value: T[keyof T]; id: Id }>(
        (s, p) => a.updateField(s, p.field, p.value, p.id),
      ),
      deleteOne: reduce<Id>(a.deleteOne),
      deleteMany: reduce<Id[]>(a.deleteMany),
      setCurrent: reduce<T>(a.setCurrent),
      removeCurrent: reduce<void>((s) => a.removeCurrent(s)),
      setCurrentById: reduce<Id>(a.setCurrentById),
      removeCurrentById: reduce<void>((s) => a.removeCurrentById(s)),
      setActive: reduce<Id>(a.setActive),
      resetActive: reduce<void>((s) => a.resetActive(s)),
      setIsDirty: reduce<Id>(a.setIsDirty),
      setIsNotDirty: reduce<Id>(a.setIsNotDirty),
    },
  })

  function getSelectors<Root>(
    select: (root: Root) => State<T>,
  ): EntitySelectors<T, Root> {
    return {
      getAll: (r) => g.getAll(select(r)),
      getAllArray: (r) => g.getAllArray(select(r)),
      getAllIds: (r) => g.getAllIds(select(r)),
      getIsEmpty: (r) => g.getIsEmpty(select(r)),
      getIsNotEmpty: (r) => g.getIsNotEmpty(select(r)),
      getCurrent: (r) => g.getCurrent(select(r)),
      getCurrentById: (r) => g.getCurrentById(select(r)),
      getActive: (r) => g.getActive(select(r)),
      getFirstActive: (r) => g.getFirstActive(select(r)),
      getOne: (r, id) => g.getOne(select(r), id),
      getMany: (r, ids) => g.getMany(select(r), ids),
      getWhere: (r, f) => g.getWhere(select(r), f),
      getWhereArray: (r, f, o) => g.getWhereArray(select(r), f, o),
      getSortedArray: (r, o) => g.getSortedArray(select(r), o),
      getByField: (r, field, value) => g.getByField(select(r), field, value),
      getFirstWhere: (r, f) => g.getFirstWhere(select(r), f),
      isAlreadyInStore: (r, id) => g.isAlreadyInStore(select(r), id),
      isAlreadyActive: (r, id) => g.isAlreadyActive(select(r), id),
      isDirty: (r, id) => g.isDirty(select(r), id),
      getMissingIds: (r, ids, d) => g.getMissingIds(select(r), ids, d),
      getMissingEntities: (r, e) => g.getMissingEntities(select(r), e),
      search: (r, q) => g.search(select(r), q),
    }
  }

  return { ...slice, getSelectors }
}
