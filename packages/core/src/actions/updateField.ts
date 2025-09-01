import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * update field of an entity
 * @param field: string field to update
 * @param id: Id of entity
 */
export function updateField<T extends WithId>(state: State<T>) {
  return <K extends keyof T>(field: K, value: T[K], id: Id) => {
    const entity = state.entities.byId[id]
    if (entity) {
      ;(entity as unknown as Record<string, unknown>)[field as string] = value as unknown
    }
  }
}
