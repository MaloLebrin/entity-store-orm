import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * Get all items from the state as an array of values.
 */
export function getAllArray<T extends WithId>(currentState: State<T>) {
  return Object.values(currentState.entities.byId)
}
