import { createEntityApi, createState, type State } from '@entity-store/core'

interface Todo {
  id: number
  title: string
  done: boolean
}

// Any container works: all you provide is `get` and `set`.
let state: State<Todo> = createState<Todo>()
const listeners = new Set<() => void>()

const { actions, getters } = createEntityApi<Todo>({
  get: () => state,
  set: (next) => {
    state = next
    for (const listener of listeners) listener()
  },
  // memoize: false, // rebuild derived arrays on each call
})

actions.createMany([
  { id: 1, title: 'Write docs', done: false },
  { id: 2, title: 'Ship', done: false },
])
actions.updateField('done', true, 1)

console.log(getters.getByField('done', true).map((t) => t.title))
