import type { EntityWithMeta } from '../types/EntityMeta.js'
import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * Get the first item that passes the given filter callback.
 * @param filter - The filtering callback that will be used to filter the items.
 * @returns The first item that passes the filter, or the first item in the state if no filter is provided.
 */
export function getFirstWhere<T extends WithId>(currentState: State<T>) {
  return (filter: (arg: EntityWithMeta<T>) => boolean | null) => {
    if (typeof filter !== 'function')
      return Object.values(currentState.entities.byId)[0]

    return Object.values(currentState.entities.allIds.reduce((acc: Record<Id, EntityWithMeta<T>>, id: Id) => {
      const item = currentState.entities.byId[id]
      if (!item || !filter(item))
        return acc

      acc[id] = item
      return acc
    }, {} as Record<Id, EntityWithMeta<T>>))[0]
  }
}
