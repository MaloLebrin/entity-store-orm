import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'
import { createEntityProxy } from '../utils/createEntityProxy.js'

/**
 * Create single entity in Store
 * @param payload Entity to create
 */
export function createOne<T extends WithId>(state: State<T>) {
  return (payload: T): void => {
    if (!state.entities.byId[payload.id] && !state.entities.allIds.includes(payload.id)) {
      state.entities.allIds.push(payload.id)
    }
    state.entities.byId[payload.id] = createEntityProxy(payload)
  }
}
