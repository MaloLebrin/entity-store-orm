import {
  createEntityApi,
  createState,
  type EntityActions,
  type EntityGetters,
  type State,
  type WithId,
} from '@entity-store/core'
import { createStore, type StoreApi } from 'zustand/vanilla'

export type {
  EntityActions,
  EntityGetters,
  EntityWithMeta,
  Id,
  SortOptions,
  State,
  WithId,
} from '@entity-store/core'

/** Everything a store created by `createEntityStore` exposes. */
export type EntityStore<T extends WithId> = State<T> &
  EntityActions<T> &
  EntityGetters<T>

/**
 * Create a vanilla Zustand store holding a normalized entity collection.
 *
 * ```ts
 * const usersStore = createEntityStore<User>()
 * usersStore.getState().createOne({ id: 1, name: 'Ada' })
 * // React: const users = useStore(usersStore, (s) => s.getAllArray())
 * ```
 *
 * Pass `initial` entities to seed the store. This matters for SSR: Zustand
 * renders the *initial* state on the server (`getInitialState`), so seed the
 * store at creation, one store per request.
 *
 * Every action replaces `entities` immutably, which is what Zustand selectors
 * and React rendering rely on. Getters are plain functions: call them inside a
 * selector, or select `entities` and derive from it.
 */
export function createEntityStore<T extends WithId>(
  initial?: State<T>['entities'],
): StoreApi<EntityStore<T>> {
  return createStore<EntityStore<T>>()((set, get) => {
    const { actions, getters } = createEntityApi<T>({
      get: () => ({ entities: get().entities }),
      set: (next) => set({ entities: next.entities }),
    })
    return {
      ...(initial ? { entities: initial } : createState<T>()),
      ...actions,
      ...getters,
    }
  })
}
