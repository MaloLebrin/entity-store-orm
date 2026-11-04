# @entity-store/valtio

## 0.1.0

### Minor Changes

- 6674827: New actions `addOne` / `addMany` (skip existing ids), `upsertOne` / `upsertMany` (merge server data without marking dirty) and `removeAll`, exposed by every adapter. New `@entity-store/vanilla` package: a framework-free store with `subscribe`, usable with `useSyncExternalStore`. Added a LICENSE file to each package.
- 6af600c: Declarative object filters: `getWhereArray`, `getWhere` and `getFirstWhere` now also accept `{ role: 'admin', age: 30 }` (strict equality on every field, AND, typed on the entity). The cache key is computed by value, so an inline literal hits the memoized result, and the first field is resolved through the `getByField` index. Function filters are unchanged. Memoized results are frozen outside production; `{ memoize: false }` returns fresh results. New exported types: `EntityFilter`, `WhereObject`; `uncachedGetters` now includes `getWhere` and `getFirstWhere`.
- df61d8d: ---
  
  First public release: immutable pure core and adapters for Pinia, Zustand, Redux Toolkit, Jotai and Valtio.
- 0240f72: `getAllArray` (and `getWhereArray` without a filter) is now memoized: the same array is returned while `byId` and `allIds` keep the same references, so it can be used directly as a React/Vue dependency or a selector. The returned array is shared, so treat it as read-only. Pass `{ memoize: false }` to get a fresh array on every call: `getAllArray(state, { memoize: false })`, `createEntityApi({ get, set, memoize: false })`, `createEntityStore({ memoize: false })` (zustand: second argument), `createEntityAtoms({ memoize: false })`, `defineEntityStore<T>()(id, { memoize: false })`, `createEntitySlice(name, { memoize: false })`. Also exports the `GetterOptions` type and `uncachedGetters`.
- 059e819: Optimistic updates with rollback. New actions `optimisticUpdate(id, patch, txId)`, `commitOptimistic(id, txId)` and `rollbackOptimistic(id, txId)`, and a new getter `isPending(id)`. The previous values and dirty bookkeeping are recorded as plain data in the new optional `$meta.pending`, so rollback restores values, `$isDirty`, `changedFields` and `updatedAt`, handles stacked updates, and never overwrites a field modified by something else since. `withOptimisticUpdate(actions, id, patch, request)` wraps apply / await / commit-or-rollback. Existing APIs and state shape are unchanged.
- 43aa956: New `setAll(payload)` action (replace the whole collection with clean entities; `active`, `current` and `currentById` are kept only if they still exist), and two memoized getters: `getSortedArray({ orderBy, sortBy })` (the sort runs once per change) and `getByField(field, value)` (an index built on first use, then O(1) lookups). `getWhereArray(filter)` now also returns the previous array when called again with the same `filter` and `orderBy` references on an unchanged collection; its result is therefore shared and read-only (frozen outside production) like `getAllArray`. All of them honour `{ memoize: false }`.
- 60827f1: Add `snapshotGetters(snap)`: getters bound to a `useSnapshot` snapshot. Calling getters directly on the snapshot does not subscribe the component, because they read the live store.

### Patch Changes

- Updated dependencies [852ba56]
- Updated dependencies [6674827]
- Updated dependencies [af61e6b]
- Updated dependencies [6b99d44]
- Updated dependencies [6af600c]
- Updated dependencies [43aa956]
- Updated dependencies [df61d8d]
- Updated dependencies [c8519b0]
- Updated dependencies [0240f72]
- Updated dependencies [059e819]
- Updated dependencies [43aa956]
- Updated dependencies [43aa956]
  - @entity-store/core@0.1.0
