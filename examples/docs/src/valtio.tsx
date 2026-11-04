import { createEntityStore, snapshotGetters } from '@entity-store/valtio'
import { useSnapshot } from 'valtio'

interface Todo {
  id: number
  title: string
  done: boolean
}

// Call actions on the proxy; read through `useSnapshot`.
export const todos = createEntityStore<Todo>()

todos.createMany([
  { id: 1, title: 'Read the docs', done: false },
  { id: 2, title: 'Ship it', done: false },
])

export function TodoList() {
  const snap = useSnapshot(todos)

  // ✅ Bind the getters to the snapshot: reading `snap.entities` inside
  //    `snapshotGetters` is what subscribes the component.
  const { getSortedArray } = snapshotGetters<Todo>(snap)
  const items = getSortedArray({ orderBy: 'title' })

  // ❌ Do NOT do this. `snap.getOne` is the function of the live store: it
  //    never touches `snap`, so useSnapshot has nothing to track and the
  //    component will not re-render when the entity changes.
  // const first = snap.getOne(1)

  return (
    <ul>
      {items.map((todo) => (
        <li key={todo.id}>
          <label>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => todos.updateField('done', !todo.done, todo.id)}
            />
            {todo.title}
          </label>
          <button type="button" onClick={() => todos.deleteOne(todo.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
