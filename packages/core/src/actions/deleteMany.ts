import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'
import { deleteOne } from './deleteOne.js'

/**
 * delete many entities in Store
 * @param ids of entities to delete
 */
export function deleteMany<T extends WithId>(state: State<T>) {
  const deleteOneFn = deleteOne(state)
  return (ids: Id[]) => {
    ids.forEach(id => deleteOneFn(id))
  }
}
