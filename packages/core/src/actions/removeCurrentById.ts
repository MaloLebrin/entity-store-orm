import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * remove currentById entity
 */
export function removeCurrentById<T extends WithId>(state: State<T>) {
  return () => {
    state.entities.currentById = null
  }
}
