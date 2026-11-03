/**
 * Basic usage of @entity-store/pinia.
 */
import { defineEntityStore } from '@entity-store/pinia'
import { computed, ref } from 'vue'

interface User {
  id: number
  name: string
  age: number
  role: 'admin' | 'user'
}

// Plain store
export const useUsers = defineEntityStore<User>('users')

// Store with your own typed state, getters and actions
export const useUsersWithExtras = defineEntityStore<User>()('users-extra', {
  extend: (base) => {
    const isLoading = ref(false)
    const admins = computed(() =>
      base.getWhereArray((user) => user.role === 'admin'),
    )
    function load(users: User[]) {
      isLoading.value = true
      base.createMany(users)
      isLoading.value = false
    }
    return { isLoading, admins, load }
  },
})
