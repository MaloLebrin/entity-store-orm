# Zustand

```bash
pnpm add @entity-store/zustand zustand
```

`createEntityStore<T>()` returns a vanilla Zustand store whose state is `{ entities }` plus every action and getter. Peer dependency: `zustand` ^5.

## Complete React example

<<< @/../examples/docs/src/zustand.tsx

## Notes

- Getters are plain functions on the state: call them **inside the selector** (`useStore(store, s => s.getSortedArray(...))`). Because they are memoized, the selector returns the same reference until the collection changes.
- Don't build a new array in the selector (`s.getAllArray().filter(...)`): it changes on every call and triggers extra renders (or a loop with `useSyncExternalStore`). Use `getWhereArray` with a stable predicate or `getByField` instead.
- Seeding: `createEntityStore<User>(initialEntities)`. For SSR Zustand renders the _initial_ state, so seed at creation and create one store per request.
- `createEntityStore<User>(undefined, { memoize: false })` disables memoization.
- Outside React: `store.getState().createOne(...)`, `store.subscribe(...)`.
