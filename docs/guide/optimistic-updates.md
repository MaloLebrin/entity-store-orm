# Optimistic updates

Apply a change right away, then keep it (`commitOptimistic`) or undo it (`rollbackOptimistic`) once the server answers.

| Action / getter | Role |
| --- | --- |
| `optimisticUpdate(id, patch, txId)` | apply `patch` now and remember how to undo it, under a `txId` you choose |
| `commitOptimistic(id, txId)` | the server accepted: keep the values |
| `rollbackOptimistic(id, txId)` | the server refused: restore the previous values |
| `isPending(id)` | `true` while an update waits for its answer (spinner, disabled button) |
| `withOptimisticUpdate(actions, id, patch, request)` | helper: apply, await `request`, commit, or roll back and rethrow |

Each pending update is recorded as plain data in `entity.$meta.pending`, so it works with every adapter (Redux included) and survives serialization and devtools.

## With plain-function actions (Zustand, Pinia, Valtio)

`withOptimisticUpdate` takes anything exposing the three actions: a Zustand state, a Pinia store, a Valtio proxy.

<<< @/../examples/docs/src/optimistic-zustand.tsx

## Redux Toolkit: by hand

Reducers can't await, so dispatch the three steps yourself. Payloads are objects.

<<< @/../examples/docs/src/optimistic-redux.tsx

## Pinia, Valtio and Jotai

<<< @/../examples/docs/src/optimistic-others.ts

## What rollback guarantees

- Values, `$isDirty`, `$meta.changedFields` and `$meta.updatedAt` are restored to what they were before the update.
- **Stacked updates** stay consistent: rolling back an earlier update keeps a later one's value (which then undoes straight to the original).
- A field **modified by something else** since (its value differs from the one the update applied) is not overwritten by a rollback.
- `optimisticUpdate` returns the same state when the entity is missing, nothing changes, or the `txId` is already pending on that entity. `commitOptimistic` / `rollbackOptimistic` do too for an unknown `txId`.
- Committing keeps the values **and the dirty flag**: call `setIsNotDirty(id)` once persisted if you want the entity clean.

::: tip txId
Any `Id` (string or number) unique per entity while pending. `withOptimisticUpdate` generates one for you; with the manual form, use something like `rename-${id}-${Date.now()}`.
:::
