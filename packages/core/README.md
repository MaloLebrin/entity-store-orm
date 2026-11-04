# @entity-store/core

Pure, immutable core of Entity Store: the state shape, every action and getter as a plain function, and a helper to bind them to any state container. Zero dependencies.

```bash
pnpm add @entity-store/core
```

## Pure functions

```ts
import { actions, getters, createState } from '@entity-store/core'

interface User {
  id: number
  name: string
}

let state = createState<User>()
state = actions.createOne(state, { id: 1, name: 'Ada' })
state = actions.updateField(state, 'name', 'Ada Lovelace', 1)

getters.getOne(state, 1)?.$isDirty // true
getters.getWhereArray(state, (u) => u.name.startsWith('Ada'), {
  orderBy: 'name',
})
```

- For tree-shaking, import actions and getters by name: `import { createOne, getOne } from '@entity-store/core'`. The `actions` / `getters` objects bundle them all.
- Actions take the state first and return the next state. The input is never mutated; unchanged entities keep their reference; if nothing changes, **the same state object is returned** (cheap to compare, no useless re-renders).
- Getters take the state first and return a value.
- Each stored entity is `T & { $isDirty, $meta: { changedFields, createdAt, updatedAt } }`. Metadata is plain data (arrays, numbers), so the whole state is JSON-serializable.
- Time-dependent actions accept an optional trailing `now` timestamp for deterministic tests.

## Binding to a state container

`createEntityApi` is what adapters use. Give it a `get` and a `set` and you get state-less actions and getters:

```ts
import { createEntityApi, createState, type State } from '@entity-store/core'

let state: State<User> = createState<User>()
const { actions, getters } = createEntityApi<User>({
  get: () => state,
  set: (next) => {
    state = next
  },
})

actions.createOne({ id: 1, name: 'Ada' })
getters.getAllIds() // [1]
```

## Exports

Every action and getter by name, `actions`, `getters`, `createState`, `createEntityApi`, `withMeta`, `patchEntity`, and the types `State`, `WithId`, `Id`, `EntityWithMeta`, `EntityMeta`, `SortOptions`, `FilterFn`, `EntityActions`, `EntityGetters`, `EntityApi`.

ESM and CommonJS builds, Node >= 18, `sideEffects: false`.
