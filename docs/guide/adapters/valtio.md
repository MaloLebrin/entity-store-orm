# Valtio

```bash
pnpm add @entity-store/valtio valtio
```

`createEntityStore<T>()` returns a Valtio proxy holding `entities` plus every action and getter. The entities object is stored with `ref()` and replaced on every action, so it is never deeply proxied: subscribers are notified by the replacement. Peer dependency: `valtio` ^2.

## The pitfall: `snap.getOne(1)` does not subscribe

::: danger Don't call getters on the snapshot
```ts
const snap = useSnapshot(todos)
const first = snap.getOne(1) // ❌ the component will NOT re-render
```
The functions on the proxy read the **live** store, and `useSnapshot` only tracks the properties you actually read from the snapshot. `snap.getOne(1)` never reads anything from `snap`, so Valtio has nothing to subscribe to: the first render looks right, then the component silently stops updating.
:::

Bind the getters to the snapshot instead with `snapshotGetters`:

```ts
const snap = useSnapshot(todos)
const { getOne, getAllArray } = snapshotGetters<Todo>(snap) // ✅ reads snap.entities
const first = getOne(1)
```

Reading `snap.entities` directly (e.g. `snap.entities.allIds`) also subscribes.

## Complete React example

<<< @/../examples/docs/src/valtio.tsx

## Notes

- Call **actions on the proxy** (`todos.updateField(...)`), never on the snapshot (it is read-only), and read through `useSnapshot`.
- `snapshotGetters(snap, { memoize: false })` disables memoization.
- For SSR create the store per request instead of sharing a module-level one.
