import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'
import { createOne } from './createOne.js'

/**
 * Create Many entity in store
 * @params payload Entities to create
 */
export function createMany<T extends WithId>(state: State<T>) {
  const createOneFn = createOne(state)
  return (payload: T[]): void => {
    payload.forEach(entity => createOneFn(entity))
  }
}
