import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

export default function<T extends WithId>(): State<T & { $isDirty: boolean }> {
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
