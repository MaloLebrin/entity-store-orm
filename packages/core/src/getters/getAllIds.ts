import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * Get an array containing the ids of all the items in the state.
 */
export function getAllIds<T extends WithId>(currentState: State<T>) {
  return currentState.entities.allIds
}
