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

| Adapter   | Peer dependency            | Verified with                                   |
| --------- | -------------------------- | ----------------------------------------------- |
| `pinia`   | `pinia` ^3 \|\| ^4          | Vue app, SSR, Nuxt 4 (`@pinia/nuxt`)            |
| `zustand` | `zustand` ^5               | React app, SSR, non-DOM React renderer          |
| `redux`   | `@reduxjs/toolkit` ^2      | React app, SSR                                  |
| `jotai`   | `jotai` ^2 \|\| ^3          | React app, SSR                                  |
| `valtio`  | `valtio` ^2                | React app, SSR                                  |

The state is plain JSON, so it serializes for SSR and hydrates as is. The repository's `tests/` folder holds the consumer checks: ESM/CJS packaging, Vue and React apps, SSR, esbuild/webpack bundling with tree-shaking, a non-DOM renderer and a Nuxt app.

## Actions

`createOne`, `createMany`, `updateOne`, `updateMany`, `updateField`, `deleteOne`, `deleteMany`, `setCurrent`, `removeCurrent`, `setCurrentById`, `removeCurrentById`, `setActive`, `resetActive`, `setIsDirty`, `setIsNotDirty`.

## Getters

`getAll`, `getAllArray`, `getAllIds`, `getIsEmpty`, `getIsNotEmpty`, `getCurrent`, `getCurrentById`, `getActive`, `getFirstActive`, `getOne`, `getMany`, `getWhere`, `getWhereArray` (with `orderBy` / `sortBy`), `getFirstWhere`, `isAlreadyInStore`, `isAlreadyActive`, `isDirty`, `getMissingIds`, `getMissingEntities`, `search`.

## Dirty tracking

Updating an entity (`updateOne`, `updateMany`, `updateField`) marks it dirty, records the changed fields and sets `$meta.updatedAt`. `setIsNotDirty(id)` clears that. Setting a field to the value it already has is a no-op.

## Tree-shaking

In `@entity-store/core`, every action and getter is also a named export (`import { createOne, getOne } from '@entity-store/core'`), so bundlers keep only what you use. The `actions` / `getters` objects are convenient but pull everything in.

## Development

```bash
pnpm install
pnpm build        # the adapters resolve @entity-store/core through its build
pnpm lint && pnpm type-check && pnpm test
pnpm check:package   # publint + are-the-types-wrong
pnpm test:consumer   # install the packed tarballs in ESM and CJS projects
pnpm changeset       # describe a change for the next release
```

Releases are automated with [Changesets](https://github.com/changesets/changesets): merging to `main` opens (or updates) a "version packages" PR; merging that publishes to npm.

## License

MIT
