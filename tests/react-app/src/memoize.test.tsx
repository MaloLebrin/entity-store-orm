import { createEntitySlice } from '@entity-store/redux'
import { createEntityStore } from '@entity-store/zustand'
import { configureStore } from '@reduxjs/toolkit'
import { act, render } from '@testing-library/react'
import { memo } from 'react'
import { Provider, useSelector } from 'react-redux'
import { beforeEach, describe, expect, test } from 'vitest'
import { type StoreApi, useStore } from 'zustand'
import { type Todo, todo } from './shared.js'

/**
 * Render counts with and without memoization. The action under test,
 * `setCurrentById`, changes `current` but not the entities themselves: a
 * consumer of `getAllArray()` should not re-render because of it.
 */

const counts = { renders: 0 }
beforeEach(() => {
  counts.renders = 0
})

type ZStore = StoreApi<
  ReturnType<ReturnType<typeof createEntityStore<Todo>>['getState']>
>

const Items = memo(function Items({ items }: { items: unknown[] }) {
  counts.renders++
  return <p>{items.length}</p>
})

function Parent({ store }: { store: ZStore }) {
  // Re-renders whenever `entities` changes (current included).
  useStore(store, (s) => s.entities)
  return <Items items={store.getState().getAllArray()} />
}

describe('zustand: memo(child) fed with getAllArray()', () => {
  function run(memoize: boolean) {
    const store = createEntityStore<Todo>(undefined, { memoize })
    store.getState().createMany([todo(1), todo(2), todo(3)])
    render(<Parent store={store} />)
    const initial = counts.renders
    for (const id of [1, 2, 3, 2, 1])
      act(() => store.getState().setCurrentById(id))
    const afterCurrent = counts.renders - initial
    act(() => store.getState().createOne(todo(4)))
    return {
      initial,
      afterCurrent,
      afterWrite: counts.renders - initial - afterCurrent,
    }
  }

  test('memoized: unrelated updates do not re-render the child', () => {
    expect(run(true)).toEqual({ initial: 1, afterCurrent: 0, afterWrite: 1 })
  })

  test('memoize: false: the child re-renders on every update', () => {
    expect(run(false)).toEqual({ initial: 1, afterCurrent: 5, afterWrite: 1 })
  })
})

function List({ pick }: { pick: (root: never) => unknown[] }) {
  const items = useSelector(pick)
  counts.renders++
  return <p>{items.length}</p>
}

describe('redux: useSelector(getAllArray)', () => {
  function setup(memoize: boolean) {
    const slice = createEntitySlice<Todo>('todos', { memoize })
    const store = configureStore({
      reducer: { todos: slice.reducer },
      middleware: (m) => m({ serializableCheck: false, immutableCheck: false }),
    })
    type Root = ReturnType<typeof store.getState>
    const select = slice.getSelectors((r: Root) => r.todos)
    return { slice, store, pick: (r: Root) => select.getAllArray(r) }
  }

  function run(memoize: boolean) {
    const { slice, store, pick } = setup(memoize)
    store.dispatch(slice.actions.createMany([todo(1), todo(2), todo(3)]))
    render(
      <Provider store={store}>
        <List pick={pick} />
      </Provider>,
    )
    const initial = counts.renders
    for (const id of [1, 2, 3, 2, 1])
      act(() => {
        store.dispatch(slice.actions.setCurrentById(id))
      })
    return { initial, afterCurrent: counts.renders - initial }
  }

  test('memoized: component does not re-render when only current changes', () => {
    expect(run(true)).toEqual({ initial: 1, afterCurrent: 0 })
  })

  test('memoize: false: component re-renders on every dispatch', () => {
    expect(run(false)).toEqual({ initial: 1, afterCurrent: 5 })
  })
})
