import { createEntityStore } from '@entity-store/valtio'
import { act, render, screen } from '@testing-library/react'
import { useSnapshot } from 'valtio'
import { describe, expect, test } from 'vitest'
import { type Todo, todo } from './shared.js'

const store = createEntityStore<Todo>()

function List() {
  const snap = useSnapshot(store)
  return (
    <div>
      <p data-testid="count">{snap.entities.allIds.length}</p>
      <p data-testid="first">{snap.getOne(1)?.title}</p>
    </div>
  )
}

describe('React + @entity-store/valtio', () => {
  test('useSnapshot re-renders on actions', async () => {
    render(<List />)
    await act(async () => store.createMany([todo(1), todo(2)]))
    expect(screen.getByTestId('count').textContent).toBe('2')

    await act(async () => store.updateField('title', 'renamed', 1))
    expect(screen.getByTestId('first').textContent).toBe('renamed')
  })
})
