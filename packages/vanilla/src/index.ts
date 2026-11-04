import {
  createEntityApi,
  createState,
  type EntityActions,
  type EntityGetters,
  type State,
  type WithId,
} from '@entity-store/core'

export type {
  EntityActions,
  EntityGetters,
  EntityWithMeta,
  Id,
  SortOptions,
  State,
  WithId,
} from '@entity-store/core'

/** A store created by `createEntityStore`. */
export interface EntityStore<T extends WithId> {
  /** The current normalized state. The reference changes on every action. */
  getState(): State<T>
  /** The state used for server rendering (the one the store was created with). */
  getInitialState(): State<T>
  /** Listen to state changes. Returns the unsubscribe function. */
  subscribe(listener: () => void): () => void
  actions: EntityActions<T>
  getters: EntityGetters<T>
}

/**
 * Create a framework-free entity store.
 *
 * ```ts
 * const users = createEntityStore<User>()
 * users.actions.createOne({ id: 1, name: 'Ada' })
 * users.subscribe(() => render(users.getters.getAllArray()))
 *
 * // React
 * const all = useSyncExternalStore(users.subscribe, users.getters.getAllArray, users.getters.getAllArray)
 * ```
 *
 * `getAllArray` is memoized, so it returns a stable reference between changes,
 * which is what `useSyncExternalStore` requires. Pass `{ memoize: false }`
 * to rebuild it on each call (do not use that with `useSyncExternalStore`).
 */
export function createEntityStore<T extends WithId>(
  initial?: State<T>['entities'],
  { memoize }: { memoize?: boolean | undefined } = {},
): EntityStore<T> {
  const initialState: State<T> = initial
    ? { entities: initial }
    : createState<T>()
  let state = initialState
  const listeners = new Set<() => void>()
  const { actions, getters } = createEntityApi<T>({
    get: () => state,
    set: (next) => {
      if (next === state) return
      state = next
      for (const listener of [...listeners]) listener()
    },
    memoize,
  })
  return {
    getState: () => state,
    getInitialState: () => initialState,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    actions,
    getters,
  }
}
