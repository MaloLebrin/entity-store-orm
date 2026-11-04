# Redux Toolkit

```bash
pnpm add @entity-store/redux @reduxjs/toolkit react-redux
```

`createEntitySlice<T>(name)` returns a Redux Toolkit slice (`reducer`, `actions`, ...) plus `getSelectors(select)`. Reducers delegate to the pure core actions, so the state stays plain and serializable. Peer dependency: `@reduxjs/toolkit` ^2.

## Complete React example

<<< @/../examples/docs/src/redux.tsx

## Notes

- Action creators take a single payload: `todos.actions.updateField({ field, value, id })` and `todos.actions.updateOne({ id, payload })`; the others take the same argument as the core action (`createOne(entity)`, `deleteOne(id)`, ...).
- `getSelectors(root => root.todos)` returns every getter as `(root, ...args) => value`. The array selectors are memoized on the slice state, so `useSelector` receives a stable reference until the collection changes.
- `createEntitySlice<T>(name, { memoize: false })` disables memoization.
