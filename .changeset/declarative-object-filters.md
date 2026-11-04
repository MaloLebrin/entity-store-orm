---
"@entity-store/core": minor
"@entity-store/pinia": minor
"@entity-store/zustand": minor
"@entity-store/redux": minor
"@entity-store/jotai": minor
"@entity-store/valtio": minor
---

Declarative object filters: `getWhereArray`, `getWhere` and `getFirstWhere` now also accept `{ role: 'admin', age: 30 }` (strict equality on every field, AND, typed on the entity). The cache key is computed by value, so an inline literal hits the memoized result, and the first field is resolved through the `getByField` index. Function filters are unchanged. Memoized results are frozen outside production; `{ memoize: false }` returns fresh results. New exported types: `EntityFilter`, `WhereObject`; `uncachedGetters` now includes `getWhere` and `getFirstWhere`.
