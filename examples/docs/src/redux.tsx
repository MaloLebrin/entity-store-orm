import { createEntitySlice } from '@entity-store/redux'
import { configureStore } from '@reduxjs/toolkit'
import { Provider, useDispatch, useSelector } from 'react-redux'

interface Todo {
  id: number
  title: string
  done: boolean
}

const todos = createEntitySlice<Todo>('todos')

export const store = configureStore({
  reducer: { todos: todos.reducer },
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

// Selectors bound to the slice's location in the root state.
const select = todos.getSelectors((root: RootState) => root.todos)

store.dispatch(
  todos.actions.createMany([
    { id: 1, title: 'Read the docs', done: false },
    { id: 2, title: 'Ship it', done: false },
  ]),
)

function TodoList() {
  const dispatch = useDispatch<AppDispatch>()
  // Memoized on the state: useSelector gets the same array until it changes.
  const items = useSelector((root: RootState) =>
    select.getSortedArray(root, { orderBy: 'title' }),
  )

  return (
    <ul>
      {items.map((todo) => (
        <li key={todo.id}>
          <label>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() =>
                dispatch(
                  todos.actions.updateField({
                    field: 'done',
                    value: !todo.done,
                    id: todo.id,
                  }),
                )
              }
            />
            {todo.title}
          </label>
          <button
            type="button"
            onClick={() => dispatch(todos.actions.deleteOne(todo.id))}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}

export function App() {
  return (
    <Provider store={store}>
      <TodoList />
    </Provider>
  )
}
