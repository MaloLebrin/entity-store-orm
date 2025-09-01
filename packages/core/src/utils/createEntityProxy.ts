import type { EntityWithMeta } from '../types/EntityMeta.js'
import type { WithId } from '../types/WithId.js'

export function createEntityProxy<T extends WithId>(entity: T): EntityWithMeta<T> {
  const now = Date.now()
  const target = {
    ...entity,
    $isDirty: false,
    $meta: {
      changedFields: new Set<keyof T>(),
      createdAt: now,
      updatedAt: null,
    },
  } as EntityWithMeta<T>

  return new Proxy(target, {
    set(obj, prop, value) {
      if (prop === '$isDirty' || prop === '$meta') {
        // allow internal flags to be set
        obj[prop] = value
        return true
      }

      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        const key = prop as keyof T
        const previous = obj[key]
        obj[key] = value
        if (previous !== value) {
          obj.$isDirty = true
          obj.$meta.changedFields.add(key)
          obj.$meta.updatedAt = Date.now()
        }
        return true
      }

      // default behavior for unknown fields
      // @ts-expect-error index
      obj[prop] = value
      return true
    },
  })
}



