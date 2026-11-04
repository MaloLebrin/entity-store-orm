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

## Documentation

Guides, concepts and a per-adapter walkthrough live in the [documentation site](https://malolebrin.github.io/entity-store-orm/), with the generated [API reference](https://malolebrin.github.io/entity-store-orm/api/index.html). Build it locally with `pnpm run docs` (output in `docs/.vitepress/dist`) or preview with `pnpm docs:dev`.

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

`createOne`, `createMany`, `setAll` (replace the whole collection, e.g. after an API load: clean entities, `active`/`current` kept only if still present), `updateOne`, `updateMany` (`updateOne` and `updateMany` are upserts: a missing id is created), `updateField`, `deleteOne`, `deleteMany`, `setCurrent`, `removeCurrent`, `setCurrentById`, `removeCurrentById`, `setActive`, `resetActive`, `setIsDirty`, `setIsNotDirty`.

## Getters

`getAll`, `getAllArray`, `getAllIds`, `getIsEmpty`, `getIsNotEmpty`, `getCurrent`, `getCurrentById`, `getActive`, `getFirstActive`, `getOne`, `getMany`, `getWhere`, `getWhereArray` (with `orderBy` / `sortBy`), `getSortedArray` (memoized sort), `getByField` (memoized index lookup), `getFirstWhere`, `isAlreadyInStore`, `isAlreadyActive`, `isDirty`, `getMissingIds`, `getMissingEntities`, `search`.

### Repeated reads: `getSortedArray` and `getByField`

Both are memoized on the collection's references, so the work happens once per change, not once per read. Measured warm on the shared container, a repeated lookup runs at about 10 million ops/s whatever the collection size (1k to 100k), against 312 ops/s for an inline `getWhereArray` filter at 100k entities (the first call after a change pays the O(n) build):

```ts
getSortedArray(state, { orderBy: 'name' }) // sorted once per change, shared array
getByField(state, 'authorId', 7) // first call builds an index (O(n)), then O(1)
```

- Give `orderBy` a field name (or one stable function reference). An inline arrow is a new key on every call and never hits. Up to 4 orderings are remembered per collection.
- `getWhereArray(state, filter)` also remembers its last result when `filter` (and `orderBy`) are the same references as the previous call; an inline arrow function does not hit, which is no slower than before.
- All results are shared and read-only (frozen outside production). `{ memoize: false }` / `uncachedGetters` return fresh arrays.

## Dirty tracking

Updating an entity (`updateOne`, `updateMany`, `updateField`) marks it dirty, records the changed fields and sets `$meta.updatedAt`. `setIsNotDirty(id)` clears that. Setting a field to the value it already has is a no-op.

## Tree-shaking

In `@entity-store/core`, every action and getter is also a named export (`import { createOne, getOne } from '@entity-store/core'`), so bundlers keep only what you use. The `actions` / `getters` objects are convenient but pull everything in.

## Performance

`pnpm bench` runs `tests/bench`, which compares the core with Redux Toolkit's `createEntityAdapter` (Immer-based) on 1k, 10k and 100k entities. Numbers below come from one run on a shared cloud container (Node 22, no pinned CPU): read them as orders of magnitude, not guarantees, and run `pnpm bench` on your own machine.

| entities | operation                                | core (ops/s) | RTK (ops/s) | core / RTK |
| -------- | ---------------------------------------- | ------------ | ----------- | ---------- |
| 1,000    | create                                   | 7,126        | 289         | 24.65x     |
| 1,000    | update one                               | 1,151,398    | 3,986       | 288.88x    |
| 1,000    | delete one                               | 8,393        | 3,511       | 2.39x      |
| 1,000    | get one                                  | 18,583,903   | 12,865,344  | 1.44x      |
| 1,000    | get all (not memoized vs RTK recomputed) | 186,677      | 25,716      | 7.26x      |
| 1,000    | get all (memoized vs RTK cached)         | 15,164,427   | 14,432,751  | 1.05x      |
| 10,000   | create                                   | 486          | 29.9        | 16.27x     |
| 10,000   | update one                               | 205,788      | 290         | 708.99x    |
| 10,000   | delete one                               | 590          | 313         | 1.88x      |
| 10,000   | get one                                  | 16,501,898   | 12,323,242  | 1.34x      |
| 10,000   | get all (not memoized vs RTK recomputed) | 18,897       | 2,288       | 8.26x      |
| 10,000   | get all (memoized vs RTK cached)         | 13,172,516   | 12,827,707  | 1.03x      |
| 100,000  | create                                   | 22.1         | 2.1         | 10.29x     |
| 100,000  | update one                               | 1,977        | 25.5        | 77.50x     |
| 100,000  | delete one                               | 47.4         | 23.9        | 1.98x      |
| 100,000  | get one                                  | 16,427,545   | 12,138,880  | 1.35x      |
| 100,000  | get all (not memoized vs RTK recomputed) | 462          | 123         | 3.75x      |
| 100,000  | get all (memoized vs RTK cached)         | 14,645,216   | 13,126,707  | 1.12x      |

What to take from it:

- Writes copy the touched maps (`byId`, `allIds`), so they are O(n) in the collection size, but cheaper than Immer's proxy and freezing work.
- `getAllArray` is **memoized** (and so is `getWhereArray` without a filter): while `byId` and `allIds` keep the same references you get the very same array back, so it is safe as a React/Vue dependency or a Zustand/Redux selector. Changing `current` or `active` does not invalidate it. The array is shared: treat it as read-only and copy before sorting (`[...getAllArray(s)].sort(...)`). Outside production it is frozen, so an in-place mutation throws instead of corrupting the cache.
- To rebuild the array on every call, pass `{ memoize: false }`: `getAllArray(state, { memoize: false })`, `createEntityStore({ memoize: false })`, `createEntityAtoms({ memoize: false })`, `defineEntityStore<User>()('users', { memoize: false })`, `createEntitySlice('users', { memoize: false })`.
- Beyond tens of thousands of entities, prefer paging or `createMany` batches over single updates in a loop.

### Mixed workload and re-renders

The table above reads an unchanged state, the best case for memoization. This one does one write, then reads the whole collection `k` times (each write invalidates the cache, so the first read is always a miss):

| entities | workload            | core memoized (ops/s) | core not memoized (ops/s) | RTK (ops/s) | memoized / not memoized |
| -------- | ------------------- | --------------------- | ------------------------- | ----------- | ----------------------- |
| 1,000    | 1 write + 1 read    | 90,853                | 148,873                   | 4,230       | 0.61x                   |
| 1,000    | 1 write + 10 reads  | 132,231               | 17,533                    | 4,552       | 7.54x                   |
| 1,000    | 1 write + 100 reads | 126,229               | 1,610                     | 4,531       | 78.42x                  |
| 10,000   | 1 write + 1 read    | 16,113                | 17,091                    | 302         | 0.94x                   |
| 10,000   | 1 write + 10 reads  | 16,434                | 1,521                     | 317         | 10.80x                  |
| 10,000   | 1 write + 100 reads | 15,345                | 144                       | 325         | 106.60x                 |
| 100,000  | 1 write + 1 read    | 392                   | 353                       | 20.2        | 1.11x                   |
| 100,000  | 1 write + 10 reads  | 404                   | 45.1                      | 23.9        | 8.94x                   |
| 100,000  | 1 write + 100 reads | 300                   | 4.7                       | 23.8        | 64.41x                  |

- Right after a write with a single read, memoization buys nothing and can cost a little: about 40% slower at 1,000 entities (a few microseconds, the cache entry), about even at 10,000, slightly faster at 100,000. At 10 reads per write it wins by 7.5x to 11x, at 100 reads by 64x to 107x (k = 2 to 9 was not measured).
- It also removes re-renders. In `tests/react-app/src/memoize.test.tsx`, a `React.memo` child fed with `getAllArray()` renders **0** extra times over 5 `setCurrentById` calls when memoized, against **5** with `{ memoize: false }`. The same holds for a Redux `useSelector(getAllArray)` component. In the zustand test, a real write (`createOne`) re-renders the child once in both modes.

## Coming from Redux Toolkit's `createEntityAdapter`

| RTK entity adapter                       | Entity Store                                                    |
| ---------------------------------------- | --------------------------------------------------------------- |
| `addOne` / `addMany`                     | `createOne` / `createMany`                                      |
| `setAll`                                 | `setAll`                                                        |
| `upsertOne` / `upsertMany`               | `updateOne` / `updateMany` (they create missing ids)            |
| `updateOne({ id, changes })`             | `updateOne(id, payload)`, `updateField(field, value, id)`       |
| `removeOne` / `removeMany`               | `deleteOne` / `deleteMany`                                      |
| `selectAll` / `selectById` / `selectIds` | `getAllArray` / `getOne` / `getAllIds`                          |
| `sortComparer` option                    | `getSortedArray({ orderBy, sortBy })` (sorts on read, memoized) |

Differences worth knowing: entities carry `$isDirty` and `$meta` (changed fields, timestamps); `current` and `active` selection live in the same state; there is no Immer, so every action returns a new state and shares the unchanged parts. With the redux adapter you keep using your store: `createEntitySlice('users')` gives you a slice whose `reducer` goes in `configureStore`, and `getSelectors(root => root.users)` replaces `adapter.getSelectors()`.

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
