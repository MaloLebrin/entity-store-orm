import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 *  @return array of active entities stored in state
 */
export function getActive<T extends WithId>(currentState: State<T>) {
  return currentState.entities.active
}
