---
"@entity-store/core": patch
---

Export every action and getter by name from the package root so bundlers can tree-shake (`import { createOne } from '@entity-store/core'`). `actions` and `getters` remain available as convenience objects.
