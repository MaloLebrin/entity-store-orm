import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * reset entities.active to an empty Array
 */
export function resetActive<T extends WithId>(state: State<T>) {
  return () => {
    state.entities.active = []
  }
}
