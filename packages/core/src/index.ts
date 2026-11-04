import {
  createMany,
  createOne,
  deleteMany,
  deleteOne,
  removeCurrent,
  removeCurrentById,
  resetActive,
  setActive,
  setCurrent,
  setCurrentById,
  setIsDirty,
  setIsNotDirty,
  updateField,
  updateMany,
  updateOne,
} from './actions.js'
import {
  getActive,
  getAll,
  getAllArray,
  getAllIds,
  getCurrent,
  getCurrentById,
  getFirstActive,
  getFirstWhere,
  getIsEmpty,
  getIsNotEmpty,
  getMany,
  getMissingEntities,
  getMissingIds,
  getOne,
  getWhere,
  getWhereArray,
  isAlreadyActive,
  isAlreadyInStore,
  isDirty,
  search,
} from './getters.js'

export {
  createMany,
  createOne,
  deleteMany,
  deleteOne,
  removeCurrent,
  removeCurrentById,
  resetActive,
  setActive,
  setCurrent,
  setCurrentById,
  setIsDirty,
  setIsNotDirty,
  updateField,
  updateMany,
  updateOne,
} from './actions.js'
export type { GetterOptions } from './getters.js'
export {
  getActive,
  getAll,
  getAllArray,
  getAllIds,
  getCurrent,
  getCurrentById,
  getFirstActive,
  getFirstWhere,
  getIsEmpty,
  getIsNotEmpty,
  getMany,
  getMissingEntities,
  getMissingIds,
  getOne,
  getWhere,
  getWhereArray,
  isAlreadyActive,
  isAlreadyInStore,
  isDirty,
  search,
  uncachedGetters,
} from './getters.js'

/** All actions as one object (convenient, but not tree-shakable: prefer named imports). */
export const actions = {
  createMany,
  createOne,
  deleteMany,
  deleteOne,
  removeCurrent,
  removeCurrentById,
  resetActive,
  setActive,
  setCurrent,
  setCurrentById,
  setIsDirty,
  setIsNotDirty,
  updateField,
  updateMany,
  updateOne,
}

/** All getters as one object (convenient, but not tree-shakable: prefer named imports). */
export const getters = {
  getActive,
  getAll,
  getAllArray,
  getAllIds,
  getCurrent,
  getCurrentById,
  getFirstActive,
  getFirstWhere,
  getIsEmpty,
  getIsNotEmpty,
  getMany,
  getMissingEntities,
  getMissingIds,
  getOne,
  getWhere,
  getWhereArray,
  isAlreadyActive,
  isAlreadyInStore,
  isDirty,
  search,
}

export { createEntityApi } from './createEntityApi.js'
export { default as createState } from './createState.js'
export { patchEntity, withMeta } from './entity.js'
export type { ByIdParams } from './types/ByIdParams.js'
export type {
  EntityActions,
  EntityApi,
  EntityGetters,
  EntityStateAccess,
} from './types/EntityApi.js'
export type { EntityMeta, EntityWithMeta } from './types/EntityMeta.js'
export type { FilterFn, OptionalFilterFn } from './types/Filter.js'
export type { SortOptions } from './types/SortOptions.js'
export type { State } from './types/State.js'
export type { Id, WithId } from './types/WithId.js'
