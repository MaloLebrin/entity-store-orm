import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * set $isDirty property to true to know if the entity has been modified or not
 * @param id of entity
 */
export function setIsDirty<T extends WithId>(state: State<T>) {
  return (id: Id) => {
    if (state.entities.byId[id]) {
      state.entities.byId[id]!.$isDirty = true
    }
  }
}
