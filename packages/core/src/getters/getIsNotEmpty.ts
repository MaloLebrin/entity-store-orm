import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * Returns a boolean indicating wether or not the state is not empty (contains items).
*/
export function getIsNotEmpty<T extends WithId>(currentState: State<T>) {
  return currentState.entities.allIds.length > 0
}
