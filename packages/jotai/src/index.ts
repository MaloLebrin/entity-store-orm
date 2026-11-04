import {
  createEntityApi,
  createState,
  type EntityActions,
  type EntityGetters,
  type State,
  type WithId,
} from '@entity-store/core'
import {
  type Atom,
  atom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai/vanilla'

export type {
  EntityActions,
  EntityGetters,
  EntityWithMeta,
  Id,
  SortOptions,
  State,
  WithId,
} from '@entity-store/core'

/** One write-only atom per action: `set(atoms.actions.createOne, payload)`. */
export type EntityActionAtoms<T extends WithId> = {
  [K in keyof EntityActions<T>]: WritableAtom<
    null,
    Parameters<EntityActions<T>[K]>,
    void
  >
}

/**
 * One read atom per getter. Each atom holds the bound getter function, so it
 * re-renders consumers when the state changes: `useAtomValue(getters.getOne)(1)`.
 */
export type EntityGetterAtoms<T extends WithId> = {
  [K in keyof EntityGetters<T>]: Atom<EntityGetters<T>[K]>
}

export interface EntityAtoms<T extends WithId> {
  /** The whole normalized state (`{ entities }`), replaced on every action. */
  state: PrimitiveAtom<State<T>>
  actions: EntityActionAtoms<T>
  getters: EntityGetterAtoms<T>
}

const ACTION_KEYS = [
  'createOne',
  'createMany',
  'updateOne',
  'updateMany',
  'updateField',
  'deleteOne',
  'deleteMany',
  'setCurrent',
  'removeCurrent',
  'setCurrentById',
  'removeCurrentById',
  'setActive',
  'resetActive',
  'setIsDirty',
  'setIsNotDirty',
] as const satisfies readonly (keyof EntityActions<WithId>)[]

const GETTER_KEYS = [
  'getAll',
  'getAllArray',
  'getAllIds',
  'getIsEmpty',
  'getIsNotEmpty',
  'getCurrent',
  'getCurrentById',
  'getActive',
  'getFirstActive',
  'getOne',
  'getMany',
  'getWhere',
  'getWhereArray',
  'getFirstWhere',
  'isAlreadyInStore',
  'isAlreadyActive',
  'isDirty',
  'getMissingIds',
  'getMissingEntities',
  'search',
] as const satisfies readonly (keyof EntityGetters<WithId>)[]

/**
 * Create the atoms managing a normalized entity collection.
 *
 * ```ts
 * const users = createEntityAtoms<User>()
 * // in React
 * const createOne = useSetAtom(users.actions.createOne)
 * const getOne = useAtomValue(users.getters.getOne)
 * ```
 */
export function createEntityAtoms<T extends WithId>({
  memoize,
}: {
  memoize?: boolean | undefined
} = {}): EntityAtoms<T> {
  const state = atom<State<T>>(createState<T>())

  const actions = Object.fromEntries(
    ACTION_KEYS.map((key) => [
      key,
      atom(null, (get, set, ...args: unknown[]) => {
        const api = createEntityApi<T>({
          get: () => get(state),
          set: (next) => set(state, next),
          memoize,
        })
        const run = api.actions[key] as (...a: unknown[]) => void
        run(...args)
      }),
    ]),
  ) as unknown as EntityActionAtoms<T>

  const getters = Object.fromEntries(
    GETTER_KEYS.map((key) => [
      key,
      atom((get) => {
        const snapshot = get(state)
        return createEntityApi<T>({
          get: () => snapshot,
          set: () => {},
          memoize,
        }).getters[key]
      }),
    ]),
  ) as unknown as EntityGetterAtoms<T>

  return { state, actions, getters }
}
