import { createEntityAtoms } from '@entity-store/jotai'
import { useAtomValue, useSetAtom } from 'jotai'

interface Todo {
  id: number
  title: string
  done: boolean
}

export const todos = createEntityAtoms<Todo>()

export function TodoList() {
  // Each getter atom holds the bound getter function and changes whenever
  // the state does, which re-renders this component.
  const getSortedArray = useAtomValue(todos.getters.getSortedArray)
  const createMany = useSetAtom(todos.actions.createMany)
  const updateField = useSetAtom(todos.actions.updateField)
  const deleteOne = useSetAtom(todos.actions.deleteOne)

  const items = getSortedArray({ orderBy: 'title' })

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          createMany([
            { id: 1, title: 'Read the docs', done: false },
            { id: 2, title: 'Ship it', done: false },
          ])
        }
      >
        Load
      </button>
      <ul>
        {items.map((todo) => (
          <li key={todo.id}>
            <label>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => updateField('done', !todo.done, todo.id)}
              />
              {todo.title}
            </label>
            <button type="button" onClick={() => deleteOne(todo.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
