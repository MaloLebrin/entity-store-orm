import { createEntityAtoms } from '@entity-store/jotai'
import { act, render, screen } from '@testing-library/react'
import { Provider, useAtomValue, useSetAtom } from 'jotai'
import { describe, expect, test } from 'vitest'
import { type Todo, todo } from './shared.js'

const todos = createEntityAtoms<Todo>()

function List({ id }: { id: string }) {
  const getAllIds = useAtomValue(todos.getters.getAllIds)
  const create = useSetAtom(todos.actions.createOne)
  return (
    <div>
      <p data-testid={`count-${id}`}>{getAllIds().length}</p>
      <button
        type="button"
        onClick={() => create(todo(getAllIds().length + 1))}
      >
        add-{id}
      </button>
    </div>
  )
}

describe('React + @entity-store/jotai', () => {
  test('atoms re-render consumers and stay isolated per Provider', () => {
    render(
      <>
        <Provider>
          <List id="a" />
        </Provider>
        <Provider>
          <List id="b" />
        </Provider>
      </>,
    )
    act(() => screen.getByText('add-a').click())
    act(() => screen.getByText('add-a').click())
    expect(screen.getByTestId('count-a').textContent).toBe('2')
    expect(screen.getByTestId('count-b').textContent).toBe('0')
  })
})
