import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * set currentById entity
 * @param payload
 */
export function setCurrentById<T extends WithId>(state: State<T>) {
  return (payload: Id) => {
    if (state.entities.byId[payload]) {
      state.entities.currentById = payload
    }
  }
}
