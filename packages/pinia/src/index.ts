import {
  createEntityApi,
  createState,
  type EntityActions,
  type EntityGetters,
  type State,
  type WithId,
} from '@entity-store/core'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export type {
  EntityActions,
  EntityGetters,
  EntityWithMeta,
  Id,
  SortOptions,
  State,
  WithId,
} from '@entity-store/core'

/** What `defineEntityStore` hands to the `extend` callback. */
export interface EntityStoreBase<T extends WithId>
  extends EntityActions<T>,
    EntityGetters<T> {
  /** Normalized state: `byId`, `allIds`, `current`, `currentById`, `active`. */
  entities: State<T>['entities']
}

export interface DefineEntityStoreOptions<
  T extends WithId,
  X extends object = object,
> {
  /**
   * Add your own state, getters and actions, setup-store style. Whatever you
   * return is merged into the store (refs become state, computeds become
   * getters, functions become actions) and fully typed.
   */
  extend?: (base: EntityStoreBase<T>) => X
}

function setupEntityStore<T extends WithId, X extends object>(
  options: DefineEntityStoreOptions<T, X>,
) {
  const entities = shallowRef<State<T>['entities']>(createState<T>().entities)

  const { actions, getters } = createEntityApi<T>({
    get: () => ({ entities: entities.value }),
    set: (next: State<T>) => {
      entities.value = next.entities
    },
  })

  const base: EntityStoreBase<T> = {
    entities: entities as unknown as State<T>['entities'],
    ...actions,
    ...getters,
  }
  // The Pinia setup store must expose the ref itself (that is what makes it state).
  const exposed = { ...base, entities }
  const extra = options.extend?.(base) ?? ({} as X)
  return { ...exposed, ...extra }
}

/**
 * Define a Pinia store that manages a normalized collection of entities.
 *
 * ```ts
 * const useUsers = defineEntityStore<User>('users')
 * useUsers().createOne({ id: 1, name: 'Ada' })
 * ```
 *
 * Call it without arguments to get a builder that also accepts `extend`
 * (TypeScript cannot infer the extension type when `T` is given explicitly):
 *
 * ```ts
 * const useUsers = defineEntityStore<User>()('users', {
 *   extend: (base) => ({ adults: computed(() => base.getWhereArray((u) => u.age >= 18)) }),
 * })
 * ```
 *
 * The state is replaced (never mutated) on every action, so it is held in a
 * `shallowRef`: Vue tracks the replacement, not deep property writes.
 */
export function defineEntityStore<T extends WithId>(
  id: string,
): ReturnType<typeof defineEntityStoreWith<T, object>>
export function defineEntityStore<T extends WithId>(): <
  X extends object = object,
>(
  id: string,
  options?: DefineEntityStoreOptions<T, X>,
) => ReturnType<typeof defineEntityStoreWith<T, X>>
export function defineEntityStore<T extends WithId>(id?: string) {
  if (id === undefined) {
    return <X extends object = object>(
      storeId: string,
      options: DefineEntityStoreOptions<T, X> = {},
    ) => defineEntityStoreWith<T, X>(storeId, options)
  }
  return defineEntityStoreWith<T, object>(id, {})
}

function defineEntityStoreWith<T extends WithId, X extends object>(
  id: string,
  options: DefineEntityStoreOptions<T, X>,
) {
  return defineStore(id, () => setupEntityStore<T, X>(options))
}
