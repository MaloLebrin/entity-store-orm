import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * Delete one entity in Store
 * @param id of entity to delete
 */
export function deleteOne<T extends WithId>(state: State<T>) {
  return (id: Id) => {
    delete state.entities.byId[id]
    state.entities.allIds = state.entities.allIds.filter(entityId => entityId !== id)
    state.entities.active = state.entities.active.filter(entityId => entityId !== id)
  }
}
