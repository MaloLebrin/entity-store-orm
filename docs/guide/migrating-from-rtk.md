# Migrating from RTK `createEntityAdapter`

| RTK | Entity Store |
|---|---|
| `addOne` / `addMany` | `addOne` / `addMany` (skip existing ids) |
| `setOne` | `createOne` |
| `setAll` | `setAll` |
| `upsertOne` / `upsertMany` | `upsertOne` / `upsertMany` (merge, not dirty) |
| `updateOne({ id, changes })` | `updateOne(id, payload)` (marks dirty) |
| `removeOne` / `removeMany` | `deleteOne` / `deleteMany` |
| `removeAll` | `removeAll` |
| `selectAll` / `selectById` | `getAllArray` / `getOne` |
| `selectIds` / `selectEntities` | `getAllIds` / `getAll` |

Differences to know: entities must have an `id` field (no `selectId`), stored entities carry `$isDirty` and `$meta`, and arrays returned by getters are shared and read-only. Sort with `getSortedArray` rather than a `sortComparer`.

With the Redux adapter, `createEntitySlice` gives you a slice with the same action names, so most call sites only change their import.
