import * as core from '@entity-store/core'
import { createEntityAtoms } from '@entity-store/jotai'
import { defineEntityStore } from '@entity-store/pinia'
import { createEntitySlice } from '@entity-store/redux'
import { createEntityStore as v } from '@entity-store/valtio'
import { createEntityStore as z } from '@entity-store/zustand'
import { configureStore } from '@reduxjs/toolkit'
import { createStore } from 'jotai/vanilla'
import { createPinia, setActivePinia } from 'pinia'

setActivePinia(createPinia())
const u = { id: 1, name: 'Ada' }
const p = defineEntityStore('users')()
p.createOne(u)
const zs = z()
zs.getState().createOne(u)
const sl = createEntitySlice('users')
const rs = configureStore({ reducer: { users: sl.reducer } })
rs.dispatch(sl.actions.createOne(u))
const j = createEntityAtoms()
const js = createStore()
js.set(j.actions.createOne, u)
const vs = v()
vs.createOne(u)
const results = [
  p.getAllIds(),
  zs.getState().getAllIds(),
  sl.getSelectors((r) => r.users).getAllIds(rs.getState()),
  js.get(j.getters.getAllIds)(),
  vs.getAllIds(),
]
for (const r of results) {
  if (JSON.stringify(r) !== '[1]')
    throw new Error(`unexpected ids: ${JSON.stringify(results)}`)
}
if (typeof core.actions.createOne !== 'function')
  throw new Error('core.actions missing')
console.log('%s ok', 'ESM')
