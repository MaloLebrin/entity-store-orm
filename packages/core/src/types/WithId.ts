/** Minimum shape of a stored entity: it needs an `id`. */
export interface WithId {
  id: Id
}

/** Entity identifier. */
export type Id = number | string
