# @entity-store/valtio

Valtio adapter for Entity Store.

```bash
pnpm add @entity-store/valtio @entity-store/core valtio
```

```ts
import { createEntityStore, snapshotGetters } from '@entity-store/valtio'
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

// Getters: bind them to the snapshot so the component subscribes.
const { getOne, getAllArray } = snapshotGetters<User>(snap)
getOne(1)
```

> **Don't call `snap.getOne(1)` directly.** The functions on the proxy read the live store, and `useSnapshot` only re-renders for the properties you read from the snapshot, so the component would not update. Use `snapshotGetters(snap)` (or read `snap.entities`).

The `entities` object is stored with Valtio's `ref()` and replaced on every action, so entities are never deeply proxied: change detection comes from the replacement, which matches the immutable core. Call actions on the proxy (not on a snapshot) and read through `useSnapshot`.

Peer dependency: `valtio` ^2. For SSR, create the store per request rather than sharing a module-level one between requests.
