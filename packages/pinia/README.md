# @entity-store/pinia

Pinia adapter for Entity Store. One function, fully typed, no `any`.

```bash
pnpm add @entity-store/pinia @entity-store/core pinia vue
```

```ts
import { defineEntityStore } from '@entity-store/pinia'

interface User {
  id: number
  name: string
  age: number
}

export const useUsers = defineEntityStore<User>('users')

const users = useUsers()
users.createMany([{ id: 1, name: 'Ada', age: 36 }])
users.getOne(1) // User & { $isDirty, $meta }
users.getWhereArray((u) => u.age > 30, { orderBy: 'name' })
users.entities.allIds // [1]
```

`entities` is Pinia state (`byId`, `allIds`, `current`, `currentById`, `active`); every action and getter is a store method. Getters are reactive when called inside `computed` or a template.

## Extending the store

Call `defineEntityStore<User>()` with no argument to get a builder that accepts `extend`. It works like a setup store: return refs (state), computeds (getters) and functions (actions); they are merged into the store and keep their types.

```ts
export const useUsers = defineEntityStore<User>()('users', {
  extend: (base) => {
    const isLoading = ref(false)
    const adults = computed(() => base.getWhereArray((u) => u.age >= 18))
    async function fetchAll() {
      isLoading.value = true
      base.createMany(await api.users())
      isLoading.value = false
    }
    return { isLoading, adults, fetchAll }
  },
})
```

(The two-step form exists because TypeScript cannot infer the extension type while `User` is given explicitly.)

## Notes

- Actions replace `entities` rather than mutating it; it is held in a `shallowRef`. Don't write into `store.entities` directly, use the actions.
- Peer dependency: `pinia` ^3 or ^4 (and `vue`).
- SSR / Nuxt: the state is plain JSON, so Pinia serializes it into the payload and hydrates it on the client. With `@pinia/nuxt`, put the store in `app/stores/` and it is auto-imported; this is covered by a Nuxt 4 test in the repository.
