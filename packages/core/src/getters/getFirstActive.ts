import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 *  @return first entity get from array of active entities stored in state
 */
export function getFirstActive<T extends WithId>(currentState: State<T>) {
  return currentState.entities.active[0]
}
