/** Predicate over an item; a falsy result excludes it. */
export type FilterFn<T> = (item: T) => boolean | null

/** A {@link FilterFn} or `null` for "no filter". */
export type OptionalFilterFn<T> = FilterFn<T> | null
