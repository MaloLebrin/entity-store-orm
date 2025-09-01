import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * helper to determine if the entity is already set as Active in state
 * @param id - The id of the item
 *  @return boolean
 */
export function isAlreadyActive<T extends WithId>(currentState: State<T>) {
  return (id: Id) => currentState.entities.active.includes(id)
}
