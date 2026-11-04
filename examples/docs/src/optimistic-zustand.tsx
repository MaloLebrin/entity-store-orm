import { withOptimisticUpdate } from '@entity-store/core'
import { createEntityStore } from '@entity-store/zustand'
import { useStore } from 'zustand'

interface User {
  id: number
  name: string
}

export const usersStore = createEntityStore<User>()
usersStore.getState().createOne({ id: 1, name: 'Ada' })

// Your API call: rejects when the server refuses.
declare function renameOnServer(id: number, name: string): Promise<void>

export function RenameButton({ id }: { id: number }) {
  const user = useStore(usersStore, (s) => s.getOne(id))
  const pending = useStore(usersStore, (s) => s.isPending(id))

  async function rename() {
    try {
      // apply now -> await the request -> commit, or roll back and rethrow
      await withOptimisticUpdate(
        usersStore.getState(),
        id,
        { name: 'Ada Lovelace' },
        () => renameOnServer(id, 'Ada Lovelace'),
      )
    } catch {
      // the store already restored 'Ada': just tell the user
    }
  }

  return (
    <button type="button" disabled={pending} onClick={rename}>
      {user?.name} {pending ? '(saving…)' : ''}
    </button>
  )
}
