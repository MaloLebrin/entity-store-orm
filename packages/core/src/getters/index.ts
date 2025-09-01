import type { EntityWithMeta } from '../types/EntityMeta.js'
import type { SortOptions } from '../types/SortOptions.js'
import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

// Import all getter functions
import { findManyById } from './findManyById.js'
import { findOneById } from './findOneById.js'
import { getActive } from './getActive.js'
import { getAll } from './getAll.js'
import { getAllArray } from './getAllArray.js'
import { getAllIds } from './getAllIds.js'
import { getCurrent } from './getCurrent.js'
import { getCurrentById } from './getCurrentById.js'
import { getFirstActive } from './getFirstActive.js'
import { getFirstWhere } from './getFirstWhere.js'
import { getIsEmpty } from './getIsEmpty.js'
import { getIsNotEmpty } from './getIsNotEmpty.js'
import { getMany } from './getMany.js'
import { getMissingEntities } from './getMissingEntities.js'
import { getMissingIds } from './getMissingIds.js'
import { getOne } from './getOne.js'
import { getWhere } from './getWhere.js'
import { getWhereArray } from './getWhereArray.js'
import { isAlreadyActive } from './isAlreadyActive.js'
import { isAlreadyInStore } from './isAlreadyInStore.js'
import { isDirty } from './isDirty.js'
import { search } from './search.js'

export default function createGetters<T extends WithId>(currentState: State<T>) {
  return {
    // Functions that return values directly
    getAll: () => getAll(currentState),
    getAllArray: () => getAllArray(currentState),
    getAllIds: () => getAllIds(currentState),
    getIsEmpty: () => getIsEmpty(currentState),
    getIsNotEmpty: () => getIsNotEmpty(currentState),
    getCurrent: () => getCurrent(currentState),
    getActive: () => getActive(currentState),
    getFirstActive: () => getFirstActive(currentState),
    getCurrentById: () => getCurrentById(currentState),
    
    // Functions that return functions taking parameters (curried pattern)
    findOneById: () => findOneById(currentState),
    findManyById: () => findManyById(currentState),
    getMissingIds: () => getMissingIds(currentState),
    getMissingEntities: () => getMissingEntities(currentState),
    getWhere: () => getWhere(currentState),
    getWhereArray: (filter: (arg: EntityWithMeta<T>) => boolean | null, options?: SortOptions<T>) => getWhereArray(currentState)(filter, options),
    getFirstWhere: () => getFirstWhere(currentState),
    getOne: (id: Id) => getOne(currentState)(id),
    getMany: (ids: Id[]) => getMany(currentState)(ids),
    isAlreadyInStore: () => isAlreadyInStore(currentState),
    isAlreadyActive: () => isAlreadyActive(currentState),
    isDirty: () => isDirty(currentState),
    search: (field: string) => search(currentState)(field),
  }
}

// Export individual functions for testing
export {
    findManyById, findOneById, getActive, getAll,
    getAllArray,
    getAllIds, getCurrent, getCurrentById, getFirstActive, getFirstWhere,
    getIsEmpty,
    getIsNotEmpty, getMany, getMissingEntities, getMissingIds, getOne, getWhere,
    getWhereArray, isAlreadyActive, isAlreadyInStore, isDirty,
    search
}

