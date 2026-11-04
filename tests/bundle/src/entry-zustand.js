import { createEntityStore } from '@entity-store/zustand'

const store = createEntityStore()
store.getState().createOne({ id: 1 })
console.log(store.getState().getAllIds())
