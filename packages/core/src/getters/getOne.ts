import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * Get a single item from the state by its id.
 * @param id - The id of the item
 */
export function getOne<T extends WithId>(currentState: State<T>) {
  return (id: Id) => currentState.entities.byId[id]
}
