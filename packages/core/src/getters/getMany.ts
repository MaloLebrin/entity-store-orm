import type { EntityWithMeta } from '../types/EntityMeta.js'
import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * Get a array of items from the state by their ids.
 * @param ids - ids of items
 */
export function getMany<T extends WithId>(currentState: State<T>) {
  return (ids: Id[]) => {
    if (!ids || !Array.isArray(ids)) return []
    return ids.map(id => currentState.entities.byId[id]).filter((item): item is EntityWithMeta<T> => item !== undefined)
  }
}
