# Vanilla (no framework)

```bash
pnpm add @entity-store/vanilla
```

`createEntityStore<T>()` returns `{ getState, getInitialState, subscribe, actions, getters }`. Nothing else to install.

```ts
import { createEntityStore } from '@entity-store/vanilla'

const users = createEntityStore<User>()
users.actions.createOne({ id: 1, name: 'Ada' })
const off = users.subscribe(() => console.log(users.getters.getAllArray()))
```

## React with `useSyncExternalStore`

```tsx
import { useSyncExternalStore } from 'react'

function Users() {
  const all = useSyncExternalStore(
    users.subscribe,
    users.getters.getAllArray,
    users.getters.getAllArray,
  )
  return <ul>{all.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
}
```

`getAllArray` is memoized, so it returns the same array until the collection changes, which `useSyncExternalStore` requires. Don't pass `{ memoize: false }` here.

Listeners only fire when an action really changes the state.
