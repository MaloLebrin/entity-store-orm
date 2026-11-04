import { createEntityStore } from '@entity-store/zustand'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useStore } from 'zustand'
import { type Todo, todo } from './shared.js'

const store = createEntityStore<Todo>()

function List() {
  const ids = useStore(store, (s) => s.entities.allIds)
  const first = useStore(store, (s) => s.getOne(1))
  return (
    <div>
      <p data-testid="count">{ids.length}</p>
      <p data-testid="first">
        {first?.title}
        {first?.$isDirty ? ' dirty' : ''}
      </p>
    </div>
  )
}

describe('React + @entity-store/zustand', () => {
  test('component re-renders on create/update/delete', () => {
    render(<List />)
    expect(screen.getByTestId('count').textContent).toBe('0')

    act(() => store.getState().createMany([todo(1), todo(2)]))
    expect(screen.getByTestId('count').textContent).toBe('2')

    act(() => store.getState().updateField('title', 'renamed', 1))
    expect(screen.getByTestId('first').textContent).toBe('renamed dirty')

    act(() => store.getState().deleteOne(1))
    expect(screen.getByTestId('count').textContent).toBe('1')
  })
})
