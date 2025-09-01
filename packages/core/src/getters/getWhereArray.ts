import type { EntityWithMeta } from '../types/EntityMeta.js'
import type { SortOptions } from '../types/SortOptions.js'
import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'
import { sortEntities } from '../utils/sortEntities.js'

/**
 * Get all the items that pass the given filter callback as an array of values.
 * @param filter - The filtering callback that will be used to filter the items.
 * @param options - Optional sorting options (orderBy and sortBy)
 */
export function getWhereArray<T extends WithId>(currentState: State<T>) {
  return (filter: (arg: EntityWithMeta<T>) => boolean | null, options?: SortOptions<T>) => {
    if (typeof filter !== 'function')
      return Object.values(currentState.entities.byId)

    const filtered = currentState.entities.allIds.reduce((acc: Record<Id, EntityWithMeta<T>>, id: Id) => {
      const item = currentState.entities.byId[id]
      if (!item || !filter(item))
        return acc

      acc[id] = item
      return acc
    }, {} as Record<Id, EntityWithMeta<T>>)

    const filteredArray = Object.values(filtered)
    
    // If no sorting options, return filtered results as is
    if (!options?.orderBy) {
      return filteredArray
    }

    // Sort the filtered array
    return sortEntities(filteredArray, options)
  }
}
