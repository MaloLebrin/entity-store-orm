import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'
import { createEntityProxy } from '../utils/createEntityProxy.js'

/**
 * set current used entity
 * @param payload
 */
export function setCurrent<T extends WithId>(state: State<T>) {
  return (payload: T) => {
    state.entities.current = createEntityProxy(payload)
  }
}
