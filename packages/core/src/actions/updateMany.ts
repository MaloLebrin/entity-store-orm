import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'
import { updateOne } from './updateOne.js'

/**
 * Update many entities in Store
 * @param ids of entities to update
 * @param payload data of entity to update
 */
export function updateMany<T extends WithId>(state: State<T>) {
  const updateOneFn = updateOne(state)
  return (payload: T[]): void => {
    payload.forEach(entity => updateOneFn(entity.id, entity))
  }
}
