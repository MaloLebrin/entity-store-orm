import type { EntityWithMeta } from '../types/EntityMeta.js'
import type { SortOptions } from '../types/SortOptions.js'
import type { WithId } from '../types/WithId.js'

/**
 * Sorts an array of entities based on the provided sort options
 */
export function sortEntities<T extends WithId>(
  entities: EntityWithMeta<T>[],
  options?: SortOptions<T>
): EntityWithMeta<T>[] {
  if (!options?.orderBy) {
    return entities
  }

  const { orderBy, sortBy = 'asc' } = options

  return [...entities].sort((a, b) => {
    let aValue: string | number | Date | null | undefined
    let bValue: string | number | Date | null | undefined

    if (typeof orderBy === 'function') {
      aValue = orderBy(a)
      bValue = orderBy(b)
    } else {
      const aRaw = a[orderBy];
      const bRaw = b[orderBy];
      aValue =
        typeof aRaw === 'string' || typeof aRaw === 'number'
          ? aRaw
          : aRaw instanceof Date
          ? aRaw
          : undefined;
      bValue =
        typeof bRaw === 'string' || typeof bRaw === 'number'
          ? bRaw
          : bRaw instanceof Date
          ? bRaw
          : undefined;
    }

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return sortBy === 'asc' ? -1 : 1
    if (bValue == null) return sortBy === 'asc' ? 1 : -1

    // Handle different types
    if (typeof aValue !== typeof bValue) {
      // Convert to strings for comparison
      aValue = String(aValue)
      bValue = String(bValue)
    }

    let comparison = 0
    if (aValue < bValue) comparison = -1
    else if (aValue > bValue) comparison = 1

    return sortBy === 'asc' ? comparison : -comparison
  })
}
