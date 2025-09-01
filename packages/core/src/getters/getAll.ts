import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * Get all the items from the state as a dictionnary of values.
 */
export function getAll<T extends WithId>(currentState: State<T>) {
  return currentState.entities.byId
}
