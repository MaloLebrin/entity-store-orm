import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * @return current entity stored in state
 */
export function getCurrent<T extends WithId>(currentState: State<T>) {
  return currentState.entities.current
}
