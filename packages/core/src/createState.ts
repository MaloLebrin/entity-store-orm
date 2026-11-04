import type { State } from './types/State.js'
import type { WithId } from './types/WithId.js'

/**
 * Create an empty {@link State}.
 *
 * ```ts
 * const state = createState<User>()
 * ```
 */
export default function <T extends WithId>(): State<T> {
  return {
    entities: {
      byId: {},
      allIds: [],
      current: null,
      currentById: null,
      active: [],
    },
  }
}
