# @entity-store/zustand

Zustand adapter for Entity Store. Vanilla store, no React dependency.

```bash
pnpm add @entity-store/zustand @entity-store/core zustand
```

```ts
import { createEntityStore } from '@entity-store/zustand'
import { useStore } from 'zustand'

interface User {
  id: number
  name: string
}

export const usersStore = createEntityStore<User>()

usersStore.getState().createOne({ id: 1, name: 'Ada' })

// React
const ids = useStore(usersStore, (s) => s.entities.allIds)
const ada = useStore(usersStore, (s) => s.getOne(1))
```

The store holds `entities` plus every action and getter. Actions replace `entities` immutably and are no-ops (no notification) when nothing changes. Prefer selecting `entities` (or a field of it) over calling a getter that builds a new array in a selector, to avoid needless re-renders.

Peer dependency: `zustand` ^5. For SSR, create the store per request rather than sharing a module-level one between requests.
