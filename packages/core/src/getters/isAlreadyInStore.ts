import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * helper to determine if the entity is already stored in state
 * @param id - The id of the item
 *  @return boolean
 */
export function isAlreadyInStore<T extends WithId>(currentState: State<T>) {
  return (id: Id) => currentState.entities.allIds.includes(id)
}
