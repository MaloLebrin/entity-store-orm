/**
 * Regression gate for the benchmark. Unlike `run.ts` (informational), this
 * exits non-zero on a clear regression, and is built to stay stable on noisy
 * shared CI runners:
 *
 * - it never compares absolute ops/s, only RATIOS between two scenarios run
 *   back to back in the same process (machine speed cancels out);
 * - each ratio is the MEDIAN of several rounds (one noisy round is ignored);
 * - the floors are far below the measured values (see `floor`): they only
 *   trip on an algorithmic regression (e.g. an O(1) path becoming O(n)), not
 *   on a few percent of jitter.
 */
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

const N = 10_000
const ROUNDS = 3
const items: User[] = Array.from({ length: N }, (_, i) => ({
  id: i + 1,
  name: `user-${i}`,
  age: i % 90,
}))
const mid = N / 2

const adapter = createEntityAdapter<User>()
const selectors = adapter.getSelectors()
const core = createMany(createState<User>(), items)
const rtk = adapter.addMany(adapter.getInitialState(), items)

interface Check {
  label: string
  /** The scenario that must stay fast, and the reference it is compared to. */
  subject: () => unknown
  reference: () => unknown
  /** Minimum acceptable subject / reference throughput ratio. */
  floor: number
  /** Ratio observed when the gate was written, for the report only. */
  typical: string
}

const checks: Check[] = [
  {
    label: 'update one: core vs RTK',
    subject: () => updateOne(core, mid, { id: mid, name: 'changed', age: 1 }),
    reference: () =>
      adapter.updateOne(rtk, { id: mid, changes: { name: 'changed' } }),
    floor: 20,
    typical: '~750x',
  },
  {
    label: 'delete one: core vs RTK',
    subject: () => deleteOne(core, mid),
    reference: () => adapter.removeOne(rtk, mid),
    floor: 0.3,
    typical: '~1.8x',
  },
  {
    label: 'create many: core vs RTK',
    subject: () => createMany(createState<User>(), items),
    reference: () => adapter.addMany(adapter.getInitialState(), items),
    floor: 3,
    typical: '~15x',
  },
  {
    label: 'get one: core vs RTK',
    subject: () => getOne(core, mid),
    reference: () => selectors.selectById(rtk, mid),
    floor: 0.3,
    typical: '~1.2x',
  },
  {
    // The memoized read is a cache hit, the other one an O(n) copy: the gap
    // is orders of magnitude, so a broken cache shows up as a ratio near 1.
    label: 'get all: memoized vs not memoized',
    subject: () => getAllArray(core),
    reference: () => getAllArray(core, { memoize: false }),
    floor: 50,
    typical: '~1600x',
  },
]

const median = (xs: number[]) =>
  [...xs].sort((a, b) => a - b)[xs.length >> 1] ?? 0

const failures: string[] = []
console.log(`node ${process.version}, ${N.toLocaleString('en')} entities`)
console.log('| check | ratio (median) | floor | typical | |')
console.log('| --- | --- | --- | --- | --- |')
for (const c of checks) {
  const ratios: number[] = []
  for (let round = 0; round < ROUNDS; round++) {
    const bench = new Bench({ time: 300, warmupTime: 100 })
    bench.add('subject', c.subject).add('reference', c.reference)
    await bench.run()
    const ops = (name: string) =>
      bench.getTask(name)?.result?.throughput.mean ?? 0
    ratios.push(ops('subject') / ops('reference'))
  }
  const ratio = median(ratios)
  const ok = ratio >= c.floor
  if (!ok) failures.push(`${c.label}: ${ratio.toFixed(2)}x < ${c.floor}x`)
  console.log(
    `| ${c.label} | ${ratio.toFixed(2)}x | >= ${c.floor}x | ${c.typical} | ${ok ? 'ok' : 'REGRESSION'} |`,
  )
}

if (failures.length > 0) {
  console.error(`\nBenchmark regression:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
