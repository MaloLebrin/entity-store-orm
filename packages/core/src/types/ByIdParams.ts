import type { Id } from './WithId'

/** An id with the payload to apply to it. */
export interface ByIdParams<T> {
  id: Id
  payload: T
}
