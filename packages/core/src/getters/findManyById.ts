import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * Get multiple items from the state by their ids.
 * @param ids - The ids of items
 * @Deprecated use getMany
 */
export function findManyById<T extends WithId>(currentState: State<T>) {
  return (ids: Id[]) => {
    if (!ids || !Array.isArray(ids)) return []
    return ids.map(id => currentState.entities.byId[id]).filter(id => id)
  }
}
