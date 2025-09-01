import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
* @param entitiesArray T[]
* @returns returns a list of missing entities in the store
*/
export function getMissingEntities<T extends WithId>(currentState: State<T>) {
  return (entitiesArray: T[]) => {
    if (!entitiesArray || !Array.isArray(entitiesArray) || entitiesArray.length === 0)
      return []

    return entitiesArray.filter(entity => !currentState.entities.allIds.includes(entity.id))
  }
}
