# Pinia (Vue)

```bash
pnpm add @entity-store/pinia pinia vue
```

`defineEntityStore<T>(id)` defines a Pinia setup store with `entities`, every action and every getter. Peer dependency: `pinia` ^3 or ^4. Verified with a Vue app, SSR and Nuxt 4 (`@pinia/nuxt`).

## Complete example

<<< @/../examples/docs/src/pinia.ts

In a `.vue` file the component reads:

```vue
<script setup lang="ts">
import { useTodosWithExtras } from './pinia'

const todos = useTodosWithExtras()
</script>

<template>
  <ul>
    <li v-for="todo in todos.getSortedArray({ orderBy: 'title' })" :key="todo.id">
      <label>
        <input type="checkbox" :checked="todo.done" @change="todos.toggle(todo.id)" />
        {{ todo.title }}
      </label>
      <button @click="todos.deleteOne(todo.id)">Delete</button>
    </li>
  </ul>
</template>
```

## Notes

- The state is replaced on every action and held in a `shallowRef`: Vue tracks the replacement, not deep writes. Getters called in a template, `computed` or render function are tracked automatically.
- To add your own state, getters and actions, call the builder form `defineEntityStore<T>()('id', { extend })` (TypeScript can't infer the extension type when `T` is given explicitly). `extend` receives the base store and whatever it returns is merged in: refs become state, `computed`s getters, functions actions.
- `{ memoize: false }` goes in the options of the builder form.
