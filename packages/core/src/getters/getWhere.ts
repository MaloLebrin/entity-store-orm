import type { EntityWithMeta } from '../types/EntityMeta.js'
import type { SortOptions } from '../types/SortOptions.js'
import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * Get all the items that pass the given filter callback as a dictionnary of values.
 * @param filter - The filtering callback that will be used to filter the items.
 * Note: Sorting options are ignored for getWhere as dictionaries don't maintain order.
 * Use getWhereArray with sorting options instead.
 */
export function getWhere<T extends WithId>(currentState: State<T>) {
  return (filter: (arg: EntityWithMeta<T>) => boolean | null, options?: SortOptions<T>) => {
    if (typeof filter !== 'function')
      return currentState.entities.byId

    const filtered = currentState.entities.allIds.reduce((acc: Record<Id, EntityWithMeta<T>>, id: Id) => {
      const item = currentState.entities.byId[id]
      if (!item || !filter(item))
        return acc

      acc[id] = item
      return acc
    }, {} as Record<Id, EntityWithMeta<T>>)

    // Sorting is ignored for dictionaries as they don't maintain order
    // Use getWhereArray with sorting options instead
    return filtered
  }
}
