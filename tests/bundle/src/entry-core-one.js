import { createOne, createState } from '@entity-store/core'

const state = createOne(createState(), { id: 1 })
console.log(state.entities.allIds)
