# @entity-store/valtio

Valtio adapter for Entity Store.

```bash
pnpm add @entity-store/valtio @entity-store/core valtio
```

```ts
import { createEntityStore } from '@entity-store/valtio'
import { useSnapshot } from 'valtio'

interface User {
  id: number
  name: string
}

export const users = createEntityStore<User>()

users.createOne({ id: 1, name: 'Ada' })

// React
const snap = useSnapshot(users)
snap.entities.allIds
snap.getOne(1)
```

The `entities` object is stored with Valtio's `ref()` and replaced on every action, so entities are never deeply proxied: change detection comes from the replacement, which matches the immutable core. Call actions on the proxy (not on a snapshot) and read through `useSnapshot`.
