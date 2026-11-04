---

## "@entity-store/valtio": minor

Add `snapshotGetters(snap)`: getters bound to a `useSnapshot` snapshot. Calling getters directly on the snapshot does not subscribe the component, because they read the live store.
