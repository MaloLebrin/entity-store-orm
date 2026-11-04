# @entity-store/jotai

Jotai adapter for Entity Store (built on `jotai/vanilla`).

```bash
pnpm add @entity-store/jotai @entity-store/core jotai
```

```ts
import { createEntityAtoms } from '@entity-store/jotai'
import { useAtomValue, useSetAtom } from 'jotai'

interface User {
  id: number
  name: string
}

export const users = createEntityAtoms<User>()

// React
const createOne = useSetAtom(users.actions.createOne)
const getOne = useAtomValue(users.getters.getOne)

createOne({ id: 1, name: 'Ada' })
getOne(1)
```

- `users.state`: the primitive atom holding `{ entities }`.
- `users.actions.*`: write-only atoms, one per action; call them with the action's arguments.
- `users.getters.*`: read atoms that hold the bound getter function. Consumers re-render when the state changes. With a vanilla store: `store.get(users.getters.getOne)(1)`.

Peer dependency: `jotai` ^2 or ^3. For SSR, scope the atoms with a per-request `Provider` / `createStore()`.
