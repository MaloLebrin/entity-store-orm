import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * helper to know if an entity has been modified
 *  @param id - The id of the item
 *  @return boolean
 */
export function isDirty<T extends WithId>(currentState: State<T>) {
  return (id: Id) => currentState.entities.byId[id]?.$isDirty || false
}
