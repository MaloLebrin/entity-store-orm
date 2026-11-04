import type { EntityWithMeta } from './EntityMeta.js'
import type { WithId } from './WithId.js'

/** Predicate over an item; a falsy result excludes it. */
export type FilterFn<T> = (item: T) => boolean | null

/** A {@link FilterFn} or `null` for "no filter". */
export type OptionalFilterFn<T> = FilterFn<T> | null

/**
 * Declarative filter: every listed field must equal its value (SameValueZero,
 * like `getByField`), combined with a logical AND. Typed on the entity, so
 * `{ age: '30' }` does not compile when `age` is a number. An empty object
 * matches everything.
 */
export type WhereObject<T extends WithId> = {
  [K in keyof EntityWithMeta<T>]?: EntityWithMeta<T>[K]
}

/**
 * What `getWhere`, `getWhereArray` and `getFirstWhere` accept: a predicate, or
 * a `WhereObject`. The object form is memoized by value (an inline literal
 * hits the cache), the function form by reference.
 */
export type EntityFilter<T extends WithId> =
  | ((item: EntityWithMeta<T>) => boolean | null)
  | WhereObject<T>
