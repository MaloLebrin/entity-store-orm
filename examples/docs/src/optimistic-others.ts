import { withOptimisticUpdate } from '@entity-store/core'
import { createEntityAtoms } from '@entity-store/jotai'
import { defineEntityStore } from '@entity-store/pinia'
import { createEntityStore } from '@entity-store/valtio'
import { createStore } from 'jotai/vanilla'

interface User {
  id: number
  name: string
}

declare function renameOnServer(id: number, name: string): Promise<void>

// Pinia: the store itself has the three actions
const useUsers = defineEntityStore<User>('users')
export async function renameWithPinia() {
  // biome-ignore lint/correctness/useHookAtTopLevel: a Pinia store accessor, not a React hook
  await withOptimisticUpdate(useUsers(), 1, { name: 'Ada L.' }, () =>
    renameOnServer(1, 'Ada L.'),
  )
}

// Valtio: same, on the proxy
const users = createEntityStore<User>()
export async function renameWithValtio() {
  await withOptimisticUpdate(users, 1, { name: 'Ada L.' }, () =>
    renameOnServer(1, 'Ada L.'),
  )
}

// Jotai: actions are write-only atoms, so go through `store.set`
const atoms = createEntityAtoms<User>()
const jotaiStore = createStore()
export async function renameWithJotai() {
  const txId = 'rename-1'
  jotaiStore.set(atoms.actions.optimisticUpdate, 1, { name: 'Ada L.' }, txId)
  try {
    await renameOnServer(1, 'Ada L.')
    jotaiStore.set(atoms.actions.commitOptimistic, 1, txId)
  } catch (error) {
    jotaiStore.set(atoms.actions.rollbackOptimistic, 1, txId)
    throw error
  }
}
