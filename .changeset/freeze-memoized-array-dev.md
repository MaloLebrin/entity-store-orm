---
"@entity-store/core": patch
---

Outside production (`NODE_ENV !== 'production'`) the memoized array returned by `getAllArray` is frozen, so an in-place `sort()` / `push()` throws a `TypeError` instead of silently corrupting the shared cache. Copy before sorting: `[...getAllArray(state)].sort(...)`. Production builds are unaffected (no freeze, no cost).
