---
"@entity-store/core": minor
"@entity-store/pinia": minor
"@entity-store/zustand": minor
"@entity-store/redux": minor
"@entity-store/jotai": minor
"@entity-store/valtio": minor
---

Optimistic updates with rollback. New actions `optimisticUpdate(id, patch, txId)`, `commitOptimistic(id, txId)` and `rollbackOptimistic(id, txId)`, and a new getter `isPending(id)`. The previous values and dirty bookkeeping are recorded as plain data in the new optional `$meta.pending`, so rollback restores values, `$isDirty`, `changedFields` and `updatedAt`, handles stacked updates, and never overwrites a field modified by something else since. `withOptimisticUpdate(actions, id, patch, request)` wraps apply / await / commit-or-rollback. Existing APIs and state shape are unchanged.
