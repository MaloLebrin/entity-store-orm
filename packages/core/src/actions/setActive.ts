import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * set one entity as active with his id
 * @param id of entity to set as active
 */
export function setActive<T extends WithId>(state: State<T>) {
  return (id: Id) => {
    if (!state.entities.active.includes(id) && state.entities.byId[id])
      state.entities.active.push(id)
  }
}
