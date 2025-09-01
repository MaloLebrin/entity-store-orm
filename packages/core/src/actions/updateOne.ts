import type { State } from '../types/State.js'
import type { Id, WithId } from '../types/WithId.js'
import { createOne } from './createOne.js'

/**
 * Update One entiy in Store
 * @param id of entity to update
 * @param payload data of entity to update
 */
export function updateOne<T extends WithId>(state: State<T>) {
  const createOneFn = createOne(state)
  return (id: Id, payload: T): void => {
    if (state.entities.byId[id]) {
      const proxy = state.entities.byId[id]
      Object.keys(payload).forEach((k) => {
        const key = k as keyof T
        // @ts-expect-error index write
        proxy[key] = payload[key]
      })
    }
    else {
      createOneFn(payload)
    }
  }
}
