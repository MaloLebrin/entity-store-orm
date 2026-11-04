# Comparison

| | Entity Store | RTK `createEntityAdapter` | NgRx Entity | normalizr |
|---|---|---|---|---|
| Framework | Any (Pinia, Zustand, Redux, Jotai, Valtio, vanilla) | Redux only | Angular + NgRx | None (data only) |
| State shape | `{ entities: { byId, allIds, current, currentById, active } }` | `{ ids, entities }` | `{ ids, entities }` | Normalized result object |
| Dirty tracking | Built in (`$isDirty`, `changedFields`) | No | No | No |
| Optimistic updates with rollback | Built in | Manual | Manual | No |
| Memoized getters | Built in | Via `createSelector` | Via selectors | No |
| Object filters, sort, `getByField` | Built in | Manual | Manual | No |
| Nested relations | Not yet | No | No | Yes |

Pick Entity Store when you want the same collection API across state managers, or dirty tracking and optimistic updates without writing them. Pick RTK/NgRx if you already live in them and need nothing more. Use normalizr to flatten nested API payloads, then feed the result to `setAll` or `upsertMany`.
