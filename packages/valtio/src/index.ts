import {
  createEntityApi,
  createState,
  type EntityActions,
  type EntityGetters,
  type State,
  type WithId,
} from '@entity-store/core'
import { proxy, ref, type Snapshot } from 'valtio/vanilla'

export type {
  EntityActions,
  EntityGetters,
  EntityWithMeta,
  Id,
  SortOptions,
  State,
  WithId,
} from '@entity-store/core'

/** The Valtio proxy: `entities` plus every action and getter. */
export type EntityStore<T extends WithId> = State<T> &
  EntityActions<T> &
  EntityGetters<T>

/**
 * Create a Valtio proxy holding a normalized entity collection.
 *
 * ```ts
 * const users = createEntityStore<User>()
 * users.createOne({ id: 1, name: 'Ada' })
 * // React: const snap = useSnapshot(users); snap.entities.allIds
 * ```
 *
 * The entities object is stored with Valtio's `ref()` and replaced on every
 * action: the core is immutable, so we skip deep proxying and subscribers are
 * notified by the replacement of `entities`.
 */
export function createEntityStore<T extends WithId>(): EntityStore<T> {
  const store = proxy<{ entities: State<T>['entities'] }>({
    entities: ref(createState<T>().entities),
  })

  const { actions, getters } = createEntityApi<T>({
    get: () => ({ entities: store.entities }),
    set: (next) => {
      store.entities = ref(next.entities)
    },
  })

  return Object.assign(store, actions, getters) as EntityStore<T>
}

/**
 * Getters bound to a `useSnapshot` snapshot, so reading them subscribes the
 * component to `entities`.
 *
 * Calling `snap.getOne(1)` directly does NOT subscribe: the functions on the
 * proxy read the live store, and `useSnapshot` only tracks the properties you
 * read from the snapshot. Use this instead:
 *
 * ```ts
 * const snap = useSnapshot(users)
 * const { getOne, getAllArray } = snapshotGetters<User>(snap)
 * ```
 */
export function snapshotGetters<T extends WithId>(snap: {
  readonly entities: Snapshot<State<T>['entities']>
}): EntityGetters<T> {
  // Reading `snap.entities` here is what registers the subscription. The
  // snapshot is deeply readonly; the getters never write to it.
  const entities = snap.entities as unknown as State<T>['entities']
  return createEntityApi<T>({
    get: () => ({ entities }),
    set: () => {},
  }).getters
}
