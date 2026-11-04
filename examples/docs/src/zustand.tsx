import { createEntityStore } from '@entity-store/zustand'
import { useStore } from 'zustand'

interface Todo {
  id: number
  title: string
  done: boolean
}

// One store per module (or one per request on the server).
export const todosStore = createEntityStore<Todo>()

todosStore.getState().createMany([
  { id: 1, title: 'Read the docs', done: false },
  { id: 2, title: 'Ship it', done: false },
])

export function TodoList() {
  // Getters are plain functions: call them inside the selector.
  // `getSortedArray` is memoized, so the selector returns a stable reference
  // until the collection changes (no extra renders).
  const todos = useStore(todosStore, (s) =>
    s.getSortedArray({ orderBy: 'title' }),
  )
  const toggle = useStore(todosStore, (s) => s.updateField)
  const remove = useStore(todosStore, (s) => s.deleteOne)

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <label>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggle('done', !todo.done, todo.id)}
            />
            {todo.title}
          </label>
          <button type="button" onClick={() => remove(todo.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
