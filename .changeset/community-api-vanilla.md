---
"@entity-store/core": minor
"@entity-store/pinia": minor
"@entity-store/zustand": minor
"@entity-store/redux": minor
"@entity-store/jotai": minor
"@entity-store/valtio": minor
"@entity-store/vanilla": minor
---

New actions `addOne` / `addMany` (skip existing ids), `upsertOne` / `upsertMany` (merge server data without marking dirty) and `removeAll`, exposed by every adapter. New `@entity-store/vanilla` package: a framework-free store with `subscribe`, usable with `useSyncExternalStore`. Added a LICENSE file to each package.
