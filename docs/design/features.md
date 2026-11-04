# Feature candidates

Four candidates were considered. Only one is implemented in this change.

|                     | (a) Optimistic updates + rollback                                                                                                        | (b) Light relations                                                         | (c) Persistence middleware                                                                                                          | (d) React hooks package                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Value**           | High: every app that talks to an API needs "apply now, undo on failure". Hard to get right by hand (stacked requests, concurrent edits). | Medium: convenient, but `getMany` / `getByField` already cover most joins.  | Medium: storage choice, versioning and SSR are app-specific; the state is already plain JSON, so `JSON.stringify` + `setAll` works. | Medium: adapters already plug into `useStore` / `useAtomValue` / `useSelector`; hooks would only rename them. |
| **Complexity**      | Low-medium: one pure module on top of `patchEntity` and `$meta`.                                                                         | High: a schema/registry concept, cross-collection state, cascade deletes.   | Medium: async storage, migrations, throttling, hydration races.                                                                     | Medium: one hook set per adapter, or a lowest-common-denominator one.                                         |
| **Public API risk** | Low: additive. New optional `$meta.pending`, 3 actions, 1 getter.                                                                        | High: needs a multi-collection concept the core deliberately does not have. | Medium: a middleware contract per adapter.                                                                                          | Low, but a new package family to maintain and version.                                                        |
| **Bundle size**     | ~0.6 kB min, only the bound actions are always included.                                                                                 | Larger, spread across the core.                                             | Adapter-specific.                                                                                                                   | Separate package, no core impact.                                                                             |
| **Pure / testable** | Yes: `(state, ...args) => state`.                                                                                                        | Partly.                                                                     | No (I/O).                                                                                                                           | No (needs React renderer).                                                                                    |

## Recommendation: (a) optimistic updates

It fits the architecture best: a pure, immutable `(state, ...args) => state`
core, serializable state, and it builds directly on the existing dirty
tracking (`$isDirty`, `$meta.changedFields`). It is the only candidate that
adds behaviour users cannot easily write themselves correctly, and it needs
no new concept (collections, storage, framework) in the core.

## Design

- `optimisticUpdate(state, id, patch, txId)` applies the patch (as `updateOne`
  would) and records, in `entity.$meta.pending`, a `PendingChange` for `txId`:
  for each changed field the previous value, the applied value and whether the
  field was already in `changedFields`, plus the previous `$isDirty` and
  `updatedAt`. State shape is unchanged; `pending` is plain JSON.
- `commitOptimistic(state, id, txId)` forgets the record; values are kept.
- `rollbackOptimistic(state, id, txId)` restores the previous values and the
  dirty bookkeeping. Stacked transactions are handled: if a later pending
  transaction touched the same field, it inherits the earlier "previous" value
  (so the visible value stays correct); a field that was changed by something
  else since (current value differs from the applied one) is left alone.
- `isPending(state, id)` getter, for spinners.
- `withOptimisticUpdate(actions, id, patch, request)`: async helper that
  applies, awaits, commits or rolls back and rethrows. Works with any adapter
  whose actions are plain functions (Zustand, Pinia, Valtio).
- Actions are keyed by `txId` (not a returned handle) so they work in Redux
  (serializable actions) and Jotai (write-only atoms) as well.
