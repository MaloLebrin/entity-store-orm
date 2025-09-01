import type { EntityWithMeta } from './EntityMeta.js'
import type { WithId } from './WithId.js'

export type OrderDirection = 'asc' | 'desc'

export interface SortOptions<T extends WithId> {
  /**
   * The field to sort by. Can be a key of the entity or a function that returns a value to sort by.
   */
  orderBy?: keyof T | ((item: EntityWithMeta<T>) => string | number | Date)
  
  /**
   * The direction to sort in. Defaults to 'asc'.
   */
  sortBy?: OrderDirection
}
