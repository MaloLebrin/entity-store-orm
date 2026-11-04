import * as core from '@entity-store/core'
import { createEntityAtoms } from '@entity-store/jotai'
import { defineEntityStore } from '@entity-store/pinia'
import { createEntitySlice } from '@entity-store/redux'
import { createEntityStore as valtio } from '@entity-store/valtio'
import { createEntityStore as zustand } from '@entity-store/zustand'

console.log(
  core,
  defineEntityStore,
  createEntityAtoms,
  createEntitySlice,
  valtio,
  zustand,
)
