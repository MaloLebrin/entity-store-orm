<script setup lang="ts">
const users = useUsers()

// Runs on the server during SSR; the state travels in the Nuxt payload.
if (users.getIsEmpty()) {
  users.createMany([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' },
  ])
}

const added = ref(0)
function add() {
  users.createOne({ id: 100 + ++added.value, name: `New ${added.value}` })
}
</script>

<template>
  <main>
    <ul id="users">
      <li v-for="u in users.getAllArray()" :key="u.id">{{ u.name }}</li>
    </ul>
    <p id="count">{{ users.getAllIds().length }}</p>
    <button id="add" @click="add">add</button>
  </main>
</template>
