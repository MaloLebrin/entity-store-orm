import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * Returns a boolean indicating wether or not the state is empty (contains no items).
 */
export function getIsEmpty<T extends WithId>(currentState: State<T>) {
  return currentState.entities.allIds.length === 0
}
