# @entity-store/redux

Redux Toolkit adapter for Entity Store.

```bash
pnpm add @entity-store/redux @entity-store/core @reduxjs/toolkit
```

```ts
import { configureStore } from '@reduxjs/toolkit'
import { createEntitySlice } from '@entity-store/redux'

interface User {
  id: number
  name: string
}

export const users = createEntitySlice<User>('users')
export const store = configureStore({ reducer: { users: users.reducer } })
type RootState = ReturnType<typeof store.getState>

const select = users.getSelectors((root: RootState) => root.users)

store.dispatch(users.actions.createOne({ id: 1, name: 'Ada' }))
store.dispatch(
  users.actions.updateField({ field: 'name', value: 'Ada L.', id: 1 }),
)

select.getOne(store.getState(), 1)
select.getWhereArray(store.getState(), (u) => u.name.startsWith('A'))
```

- Action payloads: single-argument actions take the value directly (`createOne(user)`, `deleteOne(id)`); multi-argument ones take an object: `updateOne({ id, payload })`, `updateField({ field, value, id })`.
- Reducers run the pure core on the base state, so no Immer drafts leak into your data and untouched entities keep their reference. Selectors with arguments return new arrays/objects on each call; wrap them with `createSelector` if you need memoization.

Peer dependency: `@reduxjs/toolkit` ^2. The slice state is plain JSON, so it serializes for SSR (`preloadedState`) without extra work.
