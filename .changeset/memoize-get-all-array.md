---
"@entity-store/core": minor
"@entity-store/pinia": minor
"@entity-store/zustand": minor
"@entity-store/redux": minor
"@entity-store/jotai": minor
"@entity-store/valtio": minor
---

`getAllArray` (and `getWhereArray` without a filter) is now memoized: the same array is returned while `byId` and `allIds` keep the same references, so it can be used directly as a React/Vue dependency or a selector. The returned array is shared, so treat it as read-only. Pass `{ memoize: false }` to get a fresh array on every call: `getAllArray(state, { memoize: false })`, `createEntityApi({ get, set, memoize: false })`, `createEntityStore({ memoize: false })` (zustand: second argument), `createEntityAtoms({ memoize: false })`, `defineEntityStore<T>()(id, { memoize: false })`, `createEntitySlice(name, { memoize: false })`. Also exports the `GetterOptions` type and `uncachedGetters`.
