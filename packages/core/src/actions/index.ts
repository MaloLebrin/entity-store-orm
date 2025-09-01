import type { State } from '../types/State.js'
import type { WithId } from '../types/WithId.js'

// Import all action functions
import { createMany } from './createMany.js'
import { createOne } from './createOne.js'
import { deleteMany } from './deleteMany.js'
import { deleteOne } from './deleteOne.js'
import { removeCurrent } from './removeCurrent.js'
import { removeCurrentById } from './removeCurrentById.js'
import { resetActive } from './resetActive.js'
import { setActive } from './setActive.js'
import { setCurrent } from './setCurrent.js'
import { setCurrentById } from './setCurrentById.js'
import { setIsDirty } from './setIsDirty.js'
import { setIsNotDirty } from './setIsNotDirty.js'
import { updateField } from './updateField.js'
import { updateMany } from './updateMany.js'
import { updateOne } from './updateOne.js'

export default function createActions<T extends WithId>(state: State<T>) {
  return {
    createOne: createOne(state),
    createMany: createMany(state),
    setCurrent: setCurrent(state),
    removeCurrent: removeCurrent(state),
    updateOne: updateOne(state),
    updateMany: updateMany(state),
    deleteOne: deleteOne(state),
    deleteMany: deleteMany(state),
    resetActive: resetActive(state),
    setActive: setActive(state),
    setIsDirty: setIsDirty(state),
    setIsNotDirty: setIsNotDirty(state),
    updateField: updateField(state),
    setCurrentById: setCurrentById(state),
    removeCurrentById: removeCurrentById(state),
  }
}

// Export individual functions for testing
export {
    createMany, createOne, deleteMany, deleteOne, removeCurrent, removeCurrentById, resetActive,
    setActive, setCurrent, setCurrentById, setIsDirty,
    setIsNotDirty,
    updateField, updateMany, updateOne
}

