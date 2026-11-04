import { createEntityAtoms } from '@entity-store/jotai'
import { createEntitySlice } from '@entity-store/redux'
import {
  createEntityStore as createValtio,
  snapshotGetters,
} from '@entity-store/valtio'
import { createEntityStore as createZustand } from '@entity-store/zustand'
import { configureStore } from '@reduxjs/toolkit'
import { createStore, Provider as JotaiProvider, useAtomValue } from 'jotai'
import { Provider, useSelector } from 'react-redux'
import { act, create } from 'react-test-renderer'
import { useSnapshot } from 'valtio'
import { describe, expect, test } from 'vitest'
import { useStore } from 'zustand'

// Host components like React Native's <Text>/<View>: plain strings as elements.
const Text = 'Text' as unknown as React.ElementType

interface Item {
  id: number
  name: string
}
const items: Item[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Bob' },
]
const texts = (r: ReturnType<typeof create>) =>
  r.root.findAllByType(Text).map((n) => n.props.children as string)

// (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const zustandStore = createZustand<Item>()
function ZustandList() {
  const byId = useStore(zustandStore, (s) => s.entities.byId)
  return (
    <>
      {Object.values(byId).map((i) => (
        <Text key={i.id}>{i.name}</Text>
      ))}
    </>
  )
}

const slice = createEntitySlice<Item>('items')
const reduxStore = configureStore({ reducer: { items: slice.reducer } })
type Root = ReturnType<typeof reduxStore.getState>
const select = slice.getSelectors((r: Root) => r.items)
function ReduxList() {
  const all = useSelector((r: Root) => select.getAllArray(r))
  return (
    <>
      {all.map((i) => (
        <Text key={i.id}>{i.name}</Text>
      ))}
    </>
  )
}

const atoms = createEntityAtoms<Item>()
function JotaiList() {
  const getAll = useAtomValue(atoms.getters.getAllArray)
  return (
    <>
      {getAll().map((i) => (
        <Text key={i.id}>{i.name}</Text>
      ))}
    </>
  )
}

const valtioStore = createValtio<Item>()
function ValtioList() {
  const snap = useSnapshot(valtioStore)
  // snap.getAllArray() would NOT subscribe (it reads the live store).
  const { getAllArray } = snapshotGetters<Item>(snap)
  return (
    <>
      {getAllArray().map((i) => (
        <Text key={i.id}>{i.name}</Text>
      ))}
    </>
  )
}

describe('adapters in a non-DOM React renderer (React Native-like environment)', () => {
  test('there is no DOM', () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined')
  })

  test('zustand', async () => {
    let r!: ReturnType<typeof create>
    await act(async () => {
      r = create(<ZustandList />)
    })
    await act(async () => zustandStore.getState().createMany(items))
    expect(texts(r)).toEqual(['Ada', 'Bob'])
    await act(async () => zustandStore.getState().deleteOne(1))
    expect(texts(r)).toEqual(['Bob'])
  })

  test('redux', async () => {
    let r!: ReturnType<typeof create>
    await act(async () => {
      r = create(
        <Provider store={reduxStore}>
          <ReduxList />
        </Provider>,
      )
    })
    await act(async () => {
      reduxStore.dispatch(slice.actions.createMany(items))
    })
    expect(texts(r)).toEqual(['Ada', 'Bob'])
  })

  test('jotai', async () => {
    const store = createStore()
    let r!: ReturnType<typeof create>
    await act(async () => {
      r = create(
        <JotaiProvider store={store}>
          <JotaiList />
        </JotaiProvider>,
      )
    })
    await act(async () => store.set(atoms.actions.createMany, items))
    expect(texts(r)).toEqual(['Ada', 'Bob'])
  })

  test('valtio', async () => {
    let r!: ReturnType<typeof create>
    await act(async () => {
      r = create(<ValtioList />)
    })
    await act(async () => valtioStore.createMany(items))
    expect(texts(r)).toEqual(['Ada', 'Bob'])
  })
})
