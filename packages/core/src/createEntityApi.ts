import * as a from './actions.js'
import * as g from './getters.js'
import * as o from './optimistic.js'
import type {
  EntityActions,
  EntityApi,
  EntityGetters,
  EntityStateAccess,
} from './types/EntityApi.js'
import type { WithId } from './types/WithId.js'

/**
 * Bind the pure actions and getters to a state container.
 * `get` reads the current state, `set` stores the next one. Adapters only have
 * to provide these two functions (a Vue ref, a Zustand store, a Jotai atom...).
 */
export function createEntityApi<T extends WithId>({
  get,
  set,
  memoize = true,
}: EntityStateAccess<T>): EntityApi<T> {
  // Pick the memoizable getters explicitly: spreading the `g` namespace
  // would force bundlers to keep every getter.
  const read = memoize
    ? {
        getAllArray: g.getAllArray,
        getWhereArray: g.getWhereArray,
        getSortedArray: g.getSortedArray,
        getByField: g.getByField,
        getWhere: g.getWhere,
        getFirstWhere: g.getFirstWhere,
      }
    : g.uncachedGetters
  const actions: EntityActions<T> = {
    createOne: (p) => set(a.createOne(get(), p)),
    createMany: (p) => set(a.createMany(get(), p)),
    setAll: (p) => set(a.setAll(get(), p)),
    updateOne: (id, p) => set(a.updateOne(get(), id, p)),
    updateMany: (p) => set(a.updateMany(get(), p)),
    updateField: (field, value, id) =>
      set(a.updateField(get(), field, value, id)),
    deleteOne: (id) => set(a.deleteOne(get(), id)),
    deleteMany: (ids) => set(a.deleteMany(get(), ids)),
    setCurrent: (p) => set(a.setCurrent(get(), p)),
    removeCurrent: () => set(a.removeCurrent(get())),
    setCurrentById: (id) => set(a.setCurrentById(get(), id)),
    removeCurrentById: () => set(a.removeCurrentById(get())),
    setActive: (id) => set(a.setActive(get(), id)),
    resetActive: () => set(a.resetActive(get())),
    setIsDirty: (id) => set(a.setIsDirty(get(), id)),
    setIsNotDirty: (id) => set(a.setIsNotDirty(get(), id)),
    optimisticUpdate: (id, patch, txId) =>
      set(o.optimisticUpdate(get(), id, patch, txId)),
    commitOptimistic: (id, txId) => set(o.commitOptimistic(get(), id, txId)),
    rollbackOptimistic: (id, txId) =>
      set(o.rollbackOptimistic(get(), id, txId)),
  }

  const getters: EntityGetters<T> = {
    getAll: () => g.getAll(get()),
    getAllArray: () => read.getAllArray(get()),
    getAllIds: () => g.getAllIds(get()),
    getIsEmpty: () => g.getIsEmpty(get()),
    getIsNotEmpty: () => g.getIsNotEmpty(get()),
    getCurrent: () => g.getCurrent(get()),
    getCurrentById: () => g.getCurrentById(get()),
    getActive: () => g.getActive(get()),
    getFirstActive: () => g.getFirstActive(get()),
    getOne: (id) => g.getOne(get(), id),
    getMany: (ids) => g.getMany(get(), ids),
    getWhere: (f) => read.getWhere(get(), f),
    getWhereArray: (f, o) => read.getWhereArray(get(), f, o),
    getSortedArray: (o) => read.getSortedArray(get(), o),
    getByField: (field, value) => read.getByField(get(), field, value),
    getFirstWhere: (f) => read.getFirstWhere(get(), f),
    isAlreadyInStore: (id) => g.isAlreadyInStore(get(), id),
    isAlreadyActive: (id) => g.isAlreadyActive(get(), id),
    isDirty: (id) => g.isDirty(get(), id),
    isPending: (id) => o.isPending(get(), id),
    getMissingIds: (ids, dup) => g.getMissingIds(get(), ids, dup),
    getMissingEntities: (e) => g.getMissingEntities(get(), e),
    search: (q) => g.search(get(), q),
  }

  return { actions, getters }
}
