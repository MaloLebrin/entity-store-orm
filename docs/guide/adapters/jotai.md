# Jotai

```bash
pnpm add @entity-store/jotai jotai
```

`createEntityAtoms<T>()` returns `{ state, actions, getters }`: a primitive atom for the whole state, one write-only atom per action, and one read atom per getter. Peer dependency: `jotai` ^2 or ^3.

## Complete React example

<<< @/../examples/docs/src/jotai.tsx

## Notes

- A **getter atom holds the bound getter function**: `useAtomValue(todos.getters.getOne)` gives you `getOne`, then call `getOne(1)`. The atom changes whenever the state does, which re-renders the component.
- An **action atom is write-only**: use `useSetAtom(todos.actions.createOne)`, or `set(todos.actions.createOne, entity)` inside another atom's write function.
- `todos.state` is the underlying atom; use it with a `Provider`/`createStore` for per-request state or testing.
- `createEntityAtoms<T>({ memoize: false })` disables memoization.
