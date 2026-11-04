# Entity Store

A tiny, framework-agnostic way to keep **normalized collections of entities** in your state manager, with the same actions and getters everywhere.

```ts
interface User {
  id: number
  name: string
}

users.createOne({ id: 1, name: 'Ada' })
users.updateField('name', 'Ada Lovelace', 1)
users.isDirty(1) // true
users.getWhereArray((u) => u.name.startsWith('Ada'))
```

State is always the same plain, serializable shape:

```ts
{
  entities: {
    byId: Record<Id, T & { $isDirty: boolean; $meta: { changedFields; createdAt; updatedAt } }>,
    allIds: Id[],
    current: T | null,      // the entity being edited / displayed
    currentById: Id | null,
    active: Id[],           // e.g. selected rows
  }
}
```

Every action is a **pure function** `(state, ...args) => nextState` in `@entity-store/core`: no mutation, no `Proxy`, structural sharing, and the same state reference when nothing changed. Adapters only plug that core into a state container.

## Install

Pick the adapter for your state manager; it brings `@entity-store/core` along.

```bash
pnpm add @entity-store/pinia pinia vue          # or zustand / redux / jotai / valtio
```

ESM and CommonJS, full TypeScript types, `sideEffects: false`, Node >= 18. No runtime dependency besides the state manager you already use.

## Packages

| Package                                       | For                          | Entry point                             |
| --------------------------------------------- | ---------------------------- | --------------------------------------- |
| [`@entity-store/core`](./packages/core)       | Pure state, actions, getters | `actions`, `getters`, `createEntityApi` |
| [`@entity-store/pinia`](./packages/pinia)     | Vue / Pinia                  | `defineEntityStore<User>('users')`      |
| [`@entity-store/zustand`](./packages/zustand) | Zustand                      | `createEntityStore<User>()`             |
| [`@entity-store/redux`](./packages/redux)     | Redux Toolkit                | `createEntitySlice<User>('users')`      |
| [`@entity-store/jotai`](./packages/jotai)     | Jotai                        | `createEntityAtoms<User>()`             |
| [`@entity-store/valtio`](./packages/valtio)   | Valtio                       | `createEntityStore<User>()`             |

All adapters expose the same action and getter names; they only differ in how you call them (store methods, dispatch, atoms, selectors).

## Compatibility

| Adapter   | Peer dependency       | Verified with                          |
| --------- | --------------------- | -------------------------------------- |
| `pinia`   | `pinia` ^3 \|\| ^4    | Vue app, SSR, Nuxt 4 (`@pinia/nuxt`)   |
| `zustand` | `zustand` ^5          | React app, SSR, non-DOM React renderer |
| `redux`   | `@reduxjs/toolkit` ^2 | React app, SSR                         |
| `jotai`   | `jotai` ^2 \|\| ^3    | React app, SSR                         |
| `valtio`  | `valtio` ^2           | React app, SSR                         |

The state is plain JSON, so it serializes for SSR and hydrates as is. The repository's `tests/` folder holds the consumer checks: ESM/CJS packaging, Vue and React apps, SSR, esbuild/webpack bundling with tree-shaking, a non-DOM renderer and a Nuxt app.

## Actions

`createOne`, `createMany`, `updateOne`, `updateMany`, `updateField`, `deleteOne`, `deleteMany`, `setCurrent`, `removeCurrent`, `setCurrentById`, `removeCurrentById`, `setActive`, `resetActive`, `setIsDirty`, `setIsNotDirty`.

## Getters

`getAll`, `getAllArray`, `getAllIds`, `getIsEmpty`, `getIsNotEmpty`, `getCurrent`, `getCurrentById`, `getActive`, `getFirstActive`, `getOne`, `getMany`, `getWhere`, `getWhereArray` (with `orderBy` / `sortBy`), `getFirstWhere`, `isAlreadyInStore`, `isAlreadyActive`, `isDirty`, `getMissingIds`, `getMissingEntities`, `search`.

## Dirty tracking

Updating an entity (`updateOne`, `updateMany`, `updateField`) marks it dirty, records the changed fields and sets `$meta.updatedAt`. `setIsNotDirty(id)` clears that. Setting a field to the value it already has is a no-op.

## Tree-shaking

In `@entity-store/core`, every action and getter is also a named export (`import { createOne, getOne } from '@entity-store/core'`), so bundlers keep only what you use. The `actions` / `getters` objects are convenient but pull everything in.

## Performance

`pnpm bench` runs `tests/bench`, which compares the core with Redux Toolkit's `createEntityAdapter` (Immer-based) on 1k, 10k and 100k entities. Numbers below come from one run on a shared cloud container (Node 22, no pinned CPU): read them as orders of magnitude, not guarantees, and run `pnpm bench` on your own machine.

| entities | operation                                | core (ops/s) | RTK (ops/s) | core / RTK |
| -------- | ---------------------------------------- | ------------ | ----------- | ---------- |
| ---      | ---                                      | ---          | ---         | ---        |
| 1,000    | create                                   | 6,300        | 335         | 18.80x     |
| 1,000    | update one                               | 1,232,016    | 4,793       | 257.03x    |
| 1,000    | delete one                               | 8,267        | 3,522       | 2.35x      |
| 1,000    | get one                                  | 17,578,289   | 12,538,139  | 1.40x      |
| 1,000    | get all (not memoized vs RTK recomputed) | 175,002      | 25,275      | 6.92x      |
| 1,000    | get all (memoized vs RTK cached)         | 15,205,162   | 13,605,876  | 1.12x      |
| 10,000   | create                                   | 509          | 29.4        | 17.32x     |
| 10,000   | update one                               | 241,491      | 341         | 708.30x    |
| 10,000   | delete one                               | 615          | 304         | 2.02x      |
| 10,000   | get one                                  | 15,818,505   | 11,205,494  | 1.41x      |
| 10,000   | get all (not memoized vs RTK recomputed) | 17,380       | 2,192       | 7.93x      |
| 10,000   | get all (memoized vs RTK cached)         | 15,282,147   | 12,661,530  | 1.21x      |
| 100,000  | create                                   | 20.5         | 2.1         | 9.64x      |
| 100,000  | update one                               | 1,629        | 24.6        | 66.17x     |
| 100,000  | delete one                               | 50.2         | 24.4        | 2.06x      |
| 100,000  | get one                                  | 16,760,084   | 12,324,667  | 1.36x      |
| 100,000  | get all (not memoized vs RTK recomputed) | 378          | 140         | 2.70x      |
| 100,000  | get all (memoized vs RTK cached)         | 14,924,842   | 13,902,988  | 1.07x      |

What to take from it:

- Writes copy the touched maps (`byId`, `allIds`), so they are O(n) in the collection size, but cheaper than Immer's proxy and freezing work.
- `getAllArray` is **memoized** (and so is `getWhereArray` without a filter): while `byId` and `allIds` keep the same references you get the very same array back, so it is safe as a React/Vue dependency or a Zustand/Redux selector. Changing `current` or `active` does not invalidate it. The array is shared: treat it as read-only and copy before sorting.
- To rebuild the array on every call, pass `{ memoize: false }`: `getAllArray(state, { memoize: false })`, `createEntityStore({ memoize: false })`, `createEntityAtoms({ memoize: false })`, `defineEntityStore<User>()('users', { memoize: false })`, `createEntitySlice('users', { memoize: false })`.
- Beyond tens of thousands of entities, prefer paging or `createMany` batches over single updates in a loop.

## Development

```bash
pnpm install
pnpm build        # the adapters resolve @entity-store/core through its build
pnpm lint && pnpm type-check && pnpm test
pnpm check:package   # publint + are-the-types-wrong
pnpm test:consumer   # install the packed tarballs in ESM and CJS projects
pnpm bench           # core vs Redux Toolkit createEntityAdapter
pnpm changeset       # describe a change for the next release
```

Releases are automated with [Changesets](https://github.com/changesets/changesets): merging to `main` opens (or updates) a "version packages" PR; merging that publishes to npm.

## License

MIT
