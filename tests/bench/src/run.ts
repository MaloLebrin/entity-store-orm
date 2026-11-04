import {
  createMany,
  createState,
  deleteOne,
  getAllArray,
  getOne,
  updateOne,
} from '@entity-store/core'
import { createEntityAdapter } from '@reduxjs/toolkit'
import { Bench } from 'tinybench'

interface User {
  id: number
  name: string
  age: number
}

const make = (n: number): User[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `user-${i}`,
    age: i % 90,
  }))

const adapter = createEntityAdapter<User>()
const selectors = adapter.getSelectors()
const SIZES = [1_000, 10_000, 100_000]
const rows: string[] = []

const fmt = (ops: number) =>
  ops >= 1000 ? `${Math.round(ops).toLocaleString('en')}` : ops.toFixed(1)

for (const n of SIZES) {
  const items = make(n)
  const coreState = createMany(createState<User>(), items)
  const rtkState = adapter.addMany(adapter.getInitialState(), items)
  const mid = Math.floor(n / 2)

  const bench = new Bench({ time: 500, warmupTime: 200 })
  bench
    .add('create (core)', () => createMany(createState<User>(), items))
    .add('create (rtk)', () =>
      adapter.addMany(adapter.getInitialState(), items),
    )
    .add('update (core)', () =>
      updateOne(coreState, mid, { id: mid, name: 'changed', age: 1 }),
    )
    .add('update (rtk)', () =>
      adapter.updateOne(rtkState, { id: mid, changes: { name: 'changed' } }),
    )
    .add('delete (core)', () => deleteOne(coreState, mid))
    .add('delete (rtk)', () => adapter.removeOne(rtkState, mid))
    .add('getOne (core)', () => getOne(coreState, mid))
    .add('getOne (rtk)', () => selectors.selectById(rtkState, mid))
    .add('getAll (core, memoized)', () => getAllArray(coreState))
    .add('getAll (core, not memoized)', () =>
      getAllArray(coreState, { memoize: false }),
    )
    // RTK's selectAll is memoized on state.ids / state.entities: this is a cache hit.
    .add('getAll (rtk, cached)', () => selectors.selectAll(rtkState))
    // New `ids` reference: forces the selector to recompute (includes the O(n) copy).
    .add('getAll (rtk, recomputed)', () =>
      selectors.selectAll({ ...rtkState, ids: rtkState.ids.slice() }),
    )
  await bench.run()

  const ops = (name: string) =>
    bench.getTask(name)?.result?.throughput.mean ?? 0
  const pairs: [string, string, string][] = [
    ['create', 'create (core)', 'create (rtk)'],
    ['update one', 'update (core)', 'update (rtk)'],
    ['delete one', 'delete (core)', 'delete (rtk)'],
    ['get one', 'getOne (core)', 'getOne (rtk)'],
    [
      'get all (not memoized vs RTK recomputed)',
      'getAll (core, not memoized)',
      'getAll (rtk, recomputed)',
    ],
    [
      'get all (memoized vs RTK cached)',
      'getAll (core, memoized)',
      'getAll (rtk, cached)',
    ],
  ]
  for (const [label, core, rtk] of pairs) {
    const c = ops(core)
    const r = ops(rtk)
    rows.push(
      `| ${n.toLocaleString('en')} | ${label} | ${fmt(c)} | ${fmt(r)} | ${(c / r).toFixed(2)}x |`,
    )
  }
}

console.log(`node ${process.version}`)
console.log(
  '| entities | operation | core (ops/s) | RTK (ops/s) | core / RTK |',
)
console.log('| --- | --- | --- | --- | --- |')
console.log(rows.join('\n'))
