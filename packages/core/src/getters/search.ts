import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

/**
 * Search for an entity in the state
 * @param field - The field to search for
 * @return array of entities
 */
export function search<T extends WithId>(currentState: State<T>) {
  return (field: string) => Object.values(currentState.entities.byId)
    .filter(item => {
      const regex = new RegExp(field, 'i')
      for (const value of Object.values(item)) {
        if (typeof value === 'string' && regex.test(value)) {
          return true
        }
      }
      return false
    })
}
