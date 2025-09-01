import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * remove current used entity
 * @param payload
 */
export function removeCurrent<T extends WithId>(state: State<T>) {
  return () => {
    state.entities.current = null
  }
}
