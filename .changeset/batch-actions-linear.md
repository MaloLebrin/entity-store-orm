---
"@entity-store/core": patch
---

`createMany`, `updateMany` and `deleteMany` now run in a single pass instead of chaining the single-entity actions, which copied the whole collection once per entity (quadratic). Creating 10,000 entities went from ~210 ms to ~2 ms; 100,000 no longer takes minutes. Behaviour is unchanged.
