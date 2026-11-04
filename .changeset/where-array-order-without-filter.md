---
"@entity-store/core": patch
---

Fix: `getWhereArray(state, undefined | null, { orderBy, sortBy })` ignored the sort options when no filter was given and returned the unsorted array. It now sorts (memoized, same as `getSortedArray`).
