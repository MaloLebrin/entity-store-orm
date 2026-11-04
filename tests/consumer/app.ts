import { actions, createState, type EntityWithMeta } from '@entity-store/core'
import { createEntityAtoms } from '@entity-store/jotai'
import { defineEntityStore } from '@entity-store/pinia'
import { createEntitySlice } from '@entity-store/redux'
import { createEntityStore as v } from '@entity-store/valtio'
import { createEntityStore as z } from '@entity-store/zustand'
import { computed } from 'vue'

interface User {
  id: number
  name: string
  age: number
}
const u: User = { id: 1, name: 'Ada', age: 3 }

const s = actions.createOne(createState<User>(), u)
const one: EntityWithMeta<User> | undefined = s.entities.byId[1]

const p = defineEntityStore<User>()('users', {
  extend: (b) => ({ n: computed(() => b.getAllIds().length) }),
})()
const n: number = p.n
const name: string | undefined = p.getOne(1)?.name
const zs: string | undefined = z<User>().getState().getOne(1)?.name
const sl = createEntitySlice<User>('users')
sl.actions.updateField({ field: 'name', value: 'x', id: 1 })
const j = createEntityAtoms<User>()
const ja = j.actions.updateField
const vs: number[] = v<User>().getAllIds() as number[]
// @ts-expect-error wrong entity type
z<User>().getState().createOne({ id: 1, name: 5, age: 1 })
void [one, n, name, zs, ja, vs]
