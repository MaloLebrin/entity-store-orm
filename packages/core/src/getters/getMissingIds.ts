import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'

/**
 * @param ids Id[]
 * @param canHaveDuplicates boolean not required
 * @returns returns a list of missing IDs in the store compared to the ids passed to the getter. with an option to filter out duplicates
 */
export function getMissingIds<T extends WithId>(currentState: State<T>) {
  return (ids: Id[], canHaveDuplicates?: boolean) => {
    if (!ids || !Array.isArray(ids)) return []
    const filteredIds = ids.filter(id => !currentState.entities.allIds.includes(id))
    if (!canHaveDuplicates)
      return Array.from(new Set(filteredIds))

    return filteredIds
  }
}
