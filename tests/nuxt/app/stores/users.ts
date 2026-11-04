import { defineEntityStore } from '@entity-store/pinia'

export interface User {
  id: number
  name: string
}

export const useUsers = defineEntityStore<User>('users')
