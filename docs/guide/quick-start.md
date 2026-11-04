# Quick start

## Install

Pick the adapter for your state manager; it brings `@entity-store/core` along.

```bash
pnpm add @entity-store/zustand zustand   # or pinia (+ vue) / redux (+ @reduxjs/toolkit) / jotai / valtio
```

ESM and CommonJS, full TypeScript types, `sideEffects: false`, Node >= 18.

| Package                 | For                          | Entry point                             |
| ----------------------- | ---------------------------- | --------------------------------------- |
| `@entity-store/core`    | Pure state, actions, getters | `actions`, `getters`, `createEntityApi` |
| `@entity-store/pinia`   | Vue / Pinia                  | `defineEntityStore<User>('users')`      |
| `@entity-store/zustand` | Zustand                      | `createEntityStore<User>()`             |
| `@entity-store/redux`   | Redux Toolkit                | `createEntitySlice<User>('users')`      |
| `@entity-store/jotai`   | Jotai                        | `createEntityAtoms<User>()`             |
| `@entity-store/valtio`  | Valtio                       | `createEntityStore<User>()`             |

## First steps with the pure core

The core has no dependency: you can use it on its own, in a reducer, a worker or a test.

<<< @/../examples/docs/src/core-pure.ts

## Your own container

Adapters are tiny: they give `createEntityApi` a `get` and a `set`. You can do the same for any container.

<<< @/../examples/docs/src/core-custom-container.ts

## Next

- Understand the [concepts](./concepts) (normalized state, immutability, memoization).
- Learn [filtering](./filters) (predicates and object filters) and [optimistic updates](./optimistic-updates).
- Follow the guide for your adapter: [Pinia](./adapters/pinia), [Zustand](./adapters/zustand), [Redux Toolkit](./adapters/redux), [Jotai](./adapters/jotai), [Valtio](./adapters/valtio).
- Browse the generated [API reference](/api/index.html){target="_self"}.
