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
    let aValue: string | number | Date
    let bValue: string | number | Date

    if (typeof orderBy === 'function') {
      aValue = orderBy(a)
      bValue = orderBy(b)
    } else {
      aValue = a[orderBy] as string | number | Date
      bValue = b[orderBy] as string | number | Date
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
