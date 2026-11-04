import { createEntitySlice } from '@entity-store/redux'
import { configureStore } from '@reduxjs/toolkit'

interface User {
  id: number
  name: string
}

const users = createEntitySlice<User>('users')
export const store = configureStore({ reducer: { users: users.reducer } })

type RootState = ReturnType<typeof store.getState>
const select = users.getSelectors((root: RootState) => root.users)

declare function renameOnServer(id: number, name: string): Promise<void>

// Redux actions are plain dispatches, so run the three steps yourself.
// Payloads are objects: { id, patch, txId } / { id, txId }.
export async function rename(id: number, name: string) {
  const txId = `rename-${id}-${Date.now()}`
  store.dispatch(users.actions.optimisticUpdate({ id, patch: { name }, txId }))
  try {
    await renameOnServer(id, name)
    store.dispatch(users.actions.commitOptimistic({ id, txId }))
  } catch (error) {
    store.dispatch(users.actions.rollbackOptimistic({ id, txId }))
    throw error
  }
}

// Spinner flag, e.g. inside useSelector
export const isSaving = (id: number) => select.isPending(store.getState(), id)
