---
"@entity-store/core": minor
"@entity-store/pinia": minor
"@entity-store/zustand": minor
"@entity-store/redux": minor
"@entity-store/jotai": minor
"@entity-store/valtio": minor
---

New `setAll(payload)` action (replace the whole collection with clean entities; `active`, `current` and `currentById` are kept only if they still exist), and two memoized getters: `getSortedArray({ orderBy, sortBy })` (the sort runs once per change) and `getByField(field, value)` (an index built on first use, then O(1) lookups). `getWhereArray(filter)` now also returns the previous array when called again with the same `filter` and `orderBy` references on an unchanged collection; its result is therefore shared and read-only (frozen outside production) like `getAllArray`. All of them honour `{ memoize: false }`.
