# @entity-store/vanilla

Framework-free entity store with `subscribe`. No dependency besides `@entity-store/core`.

```ts
import { createEntityStore } from '@entity-store/vanilla'

const users = createEntityStore<User>()
users.actions.createOne({ id: 1, name: 'Ada' })
users.subscribe(() => console.log(users.getters.getAllArray()))
```

React, without any other library:

```ts
const all = useSyncExternalStore(
  users.subscribe,
  users.getters.getAllArray,
  users.getters.getAllArray,
)
```

See the [main documentation](https://github.com/MaloLebrin/entity-store-orm#readme).

MIT
