import type { WithId } from '@entity-store/core'
import { createActions, createGetters, createState } from '@entity-store/core'
import type { PiniaPluginContext } from 'pinia'
import { ref, toRef } from 'vue'

/**
 * Plugin Pinia qui ajoute automatiquement la gestion d'entités à tous les stores
 * Toutes les propriétés ajoutées sont préfixées avec $ pour éviter les conflits
 */
export function entityStorePlugin(ctx: PiniaPluginContext) {
  const store = ctx.store
    // Créer l'état des entités en utilisant le core
    const baseState = createState<WithId>()
    
    // Créer les actions et getters avec l'état
    const actions = createActions(baseState)
    const getters = createGetters(baseState)
    
      // to correctly handle SSR, we need to make sure we are not overriding an
  // existing value
  if (!store.$state.hasOwnProperty('$entities')) {
    // hasError is defined within the plugin, so each store has their individual
    // state property
    const entities = ref(baseState.entities)
    // setting the variable on `$state`, allows it be serialized during SSR
    store.$state.$entities = entities
  }
  // we need to transfer the ref from the state to the store, this way
  // both accesses: store.hasError and store.$state.hasError will work
  // and share the same variable
  // See https://vuejs.org/api/reactivity-utilities.html#toref
  store.$entities = toRef(store.$state, '$entities')

  for (const key in actions) {
    if (!store.$state.hasOwnProperty(`$${key}`)) {
      store[`$${key}`] = actions[key]
    }
  }
  for (const key in getters) {
    if (!store.$state.hasOwnProperty(`$${key}`)) {
      store[`$${key}`] = getters[key]
    }
  }

  // in this case it's better not to return `hasError` since it
  // will be displayed in the `state` section in the devtools
  // anyway and if we return it, devtools will display it twice.
    
    // // Ajouter l'état des entités au store principal (pour l'accès direct)
    // store.$entities = baseState.entities
    
    // // Ajouter toutes les actions préfixées
    // store.$createOne = actions.createOne
    // store.$createMany = actions.createMany
    // store.$updateOne = actions.updateOne
    // store.$updateMany = actions.updateMany
    // store.$deleteOne = actions.deleteOne
    // store.$deleteMany = actions.deleteMany
    // store.$setCurrent = actions.setCurrent
    // store.$setCurrentById = actions.setCurrentById
    // store.$removeCurrent = actions.removeCurrent
    // store.$removeCurrentById = actions.removeCurrentById
    // store.$setActive = actions.setActive
    // store.$resetActive = actions.resetActive
    // store.$setIsDirty = actions.setIsDirty
    // store.$setIsNotDirty = actions.setIsNotDirty
    // store.$updateField = actions.updateField
    
    // // Ajouter tous les getters préfixés
    // store.$getOne = getters.getOne
    // store.$getMany = getters.getMany
    // store.$getAll = getters.getAll
    // store.$getAllArray = getters.getAllArray
    // store.$getAllIds = getters.getAllIds
    // store.$getCurrent = getters.getCurrent
    // store.$getCurrentById = getters.getCurrentById
    // store.$getActive = getters.getActive
    // store.$getFirstActive = getters.getFirstActive
    // store.$getWhere = getters.getWhere
    // store.$getWhereArray = getters.getWhereArray
    // store.$getFirstWhere = getters.getFirstWhere
    // store.$getIsEmpty = getters.getIsEmpty
    // store.$getIsNotEmpty = getters.getIsNotEmpty
    // store.$isAlreadyInStore = getters.isAlreadyInStore
    // store.$isAlreadyActive = getters.isAlreadyActive
    // store.$isDirty = getters.isDirty
    // store.$search = getters.search
    // store.$getMissingIds = getters.getMissingIds
    // store.$getMissingEntities = getters.getMissingEntities
    
    // Ajouter les propriétés personnalisées pour les devtools
    if (process.env.NODE_ENV === 'development') {
      store._customProperties.add('$entities')
      store._customProperties.add('$createOne')
      store._customProperties.add('$createMany')
      store._customProperties.add('$updateOne')
      store._customProperties.add('$updateMany')
      store._customProperties.add('$deleteOne')
      store._customProperties.add('$deleteMany')
      store._customProperties.add('$setCurrent')
      store._customProperties.add('$setCurrentById')
      store._customProperties.add('$removeCurrent')
      store._customProperties.add('$removeCurrentById')
      store._customProperties.add('$setActive')
      store._customProperties.add('$resetActive')
      store._customProperties.add('$setIsDirty')
      store._customProperties.add('$setIsNotDirty')
      store._customProperties.add('$updateField')
      store._customProperties.add('$getOne')
      store._customProperties.add('$getMany')
      store._customProperties.add('$getAll')
      store._customProperties.add('$getAllArray')
      store._customProperties.add('$getAllIds')
      store._customProperties.add('$getCurrent')
      store._customProperties.add('$getCurrentById')
      store._customProperties.add('$getActive')
      store._customProperties.add('$getFirstActive')
      store._customProperties.add('$getWhere')
      store._customProperties.add('$getWhereArray')
      store._customProperties.add('$getFirstWhere')
      store._customProperties.add('$getIsEmpty')
      store._customProperties.add('$getIsNotEmpty')
      store._customProperties.add('$isAlreadyInStore')
      store._customProperties.add('$isAlreadyActive')
      store._customProperties.add('$isDirty')
      store._customProperties.add('$search')
      store._customProperties.add('$getMissingIds')
      store._customProperties.add('$getMissingEntities')
    }
    
    // Retourner un objet vide car nous modifions directement le store
    // Cela permet aux devtools de tracker les propriétés
    return {}
  }

