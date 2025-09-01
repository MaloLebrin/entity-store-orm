import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * Get currentById entity stored in state
 */
export function getCurrentById<T extends WithId>(currentState: State<T>) {
  return currentState.entities.currentById ? currentState.entities.byId[currentState.entities.currentById] : null
}
