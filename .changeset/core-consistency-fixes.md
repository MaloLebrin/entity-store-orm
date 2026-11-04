---
"@entity-store/core": patch
---

Fixes found by property-based tests:

- `deleteOne` / `deleteMany` now reset `currentById` (and `current`) when they point to a removed entity, instead of leaving a dangling id (consistent with `setAll`).
- `setIsNotDirty` returns the same state when the entity is already clean.
- Ids that collide with `Object.prototype` members (`"constructor"`, `"toString"`, `"__proto__"`, ...) no longer corrupt the store: `setActive`, `setCurrentById`, `setIsDirty`, `updateField`, `getOne`, `getMany`, `isDirty`... ignore them when absent, and `createMany` / `setAll` / `updateMany` store `"__proto__"` as a regular id.
