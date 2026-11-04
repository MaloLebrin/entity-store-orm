import { createEntitySlice } from '@entity-store/redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen } from '@testing-library/react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { describe, expect, test } from 'vitest'
import { type Todo, todo } from './shared.js'

describe('React + @entity-store/redux', () => {
  test('selectors and dispatch drive the UI', () => {
    const todos = createEntitySlice<Todo>('todos')
    const store = configureStore({ reducer: { todos: todos.reducer } })
    type Root = ReturnType<typeof store.getState>
    const select = todos.getSelectors((r: Root) => r.todos)

    function List() {
      const dispatch = useDispatch()
      const all = useSelector((r: Root) => select.getAllArray(r))
      return (
        <div>
          <p data-testid="count">{all.length}</p>
          <button
            type="button"
            onClick={() =>
              dispatch(todos.actions.createOne(todo(all.length + 1)))
            }
          >
            add
          </button>
        </div>
      )
    }
    render(
      <Provider store={store}>
        <List />
      </Provider>,
    )
    expect(screen.getByTestId('count').textContent).toBe('0')
    act(() => screen.getByText('add').click())
    act(() => screen.getByText('add').click())
    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(select.getAllIds(store.getState())).toEqual([1, 2])
  })
})
