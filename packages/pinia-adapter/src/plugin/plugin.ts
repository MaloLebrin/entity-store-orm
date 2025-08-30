import type { WithId } from '@entity-store/core'
import { createActions, createGetters, createState } from '@entity-store/core'
import type { PiniaPluginContext } from 'pinia'
import { ref, toRef } from 'vue'

// Types pour améliorer la maintenabilité
interface EntityStore {
  $state: {
    $entities: any
    [key: string]: any
  }
  $entities: any
  [key: string]: any
  _customProperties?: {
    add: (property: string) => void
  }
}

interface Actions {
  [key: string]: Function
}

interface Getters {
  [key: string]: Function | any
}

// Constantes pour les getters qui retournent des valeurs directes
const VALUE_GETTERS = [
  'getAllArray',
  'getAllIds', 
  'getAll',
  'getActive',
  'getFirstActive',
  'getIsEmpty',
  'getIsNotEmpty',
  'getCurrent',
  'getCurrentById'
] as const

type ValueGetterKey = typeof VALUE_GETTERS[number]

/**
 * Crée un état copié à partir de l'état actuel du store
 */
function createCurrentState(store: EntityStore) {
  const currentState = createState<WithId>()
  currentState.entities.byId = { ...store.$state.$entities.byId }
  currentState.entities.allIds = [...store.$state.$entities.allIds]
  currentState.entities.current = store.$state.$entities.current
  currentState.entities.currentById = store.$state.$entities.currentById
  currentState.entities.active = [...store.$state.$entities.active]
  return currentState
}

/**
 * Crée un getter qui retourne la valeur actuelle de l'état
 */
function createValueGetter(store: EntityStore, key: string, baseState: any) {
  return () => {
    const currentState = createCurrentState(store)
    const currentGetters = createGetters(currentState)
    const currentGetter = (currentGetters as any)[key]
    const value = currentGetter(currentState)
    
    // Convertir les IDs en chaînes pour getAllIds
    if (key === 'getAllIds') {
      return value.map((id: any) => String(id))
    }
    
    return value
  }
}

/**
 * Ajoute les actions au store
 */
function addActionsToStore(store: EntityStore, actions: Actions, baseState: any) {
  // Créer un objet d'actions lié au store
  const boundActions: Actions = {}
  for (const key in actions) {
    const action = actions[key]
    if (action) {
      boundActions[key] = action
    }
  }
  
  // Lier le contexte this au store pour toutes les actions
  Object.keys(boundActions).forEach(key => {
    const action = boundActions[key]
    if (typeof action === 'function') {
      boundActions[key] = action.bind(boundActions)
    }
  })
  
  // Ajouter toutes les actions préfixées au store
  for (const key in boundActions) {
    if (!store.$state.hasOwnProperty(`$${key}`)) {
      store[`$${key}`] = boundActions[key]
    }
  }
}

/**
 * Ajoute les getters au store
 */
function addGettersToStore(store: EntityStore, getters: Getters, baseState: any) {
  for (const key in getters) {
    if (!store.$state.hasOwnProperty(`$${key}`)) {
      const getter = getters[key]
      
      if (typeof getter === 'function') {
        const result = getter(baseState)
        
        // Vérifier si c'est un getter qui retourne une valeur directe
        if (VALUE_GETTERS.includes(key as ValueGetterKey)) {
          store[`$${key}`] = createValueGetter(store, key, baseState)
        } else {
          // D'autres retournent des fonctions qui prennent des paramètres
          store[`$${key}`] = result
        }
      } else {
        store[`$${key}`] = getter
      }
    }
  }
}

/**
 * Ajoute les propriétés personnalisées pour les devtools
 */
function addCustomProperties(store: EntityStore, actions: Actions, getters: Getters) {
  if (process.env.NODE_ENV === 'development') {
    store._customProperties?.add('$entities')
    
    // Ajouter toutes les actions et getters aux propriétés personnalisées
    Object.keys(actions).forEach(key => {
      store._customProperties?.add(`$${key}`)
    })
    
    Object.keys(getters).forEach(key => {
      store._customProperties?.add(`$${key}`)
    })
  }
}

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
  
  // Pour gérer correctement SSR, nous devons ajouter l'état dans deux endroits
  if (!store.$state.hasOwnProperty('$entities')) {
    // Créer une ref réactive pour l'état des entités
    const entities = ref(baseState.entities)
    // Ajouter à $state pour la sérialisation SSR
    store.$state.$entities = entities
  }
  
  // Transférer la ref du state au store pour l'accès direct
  ;(store as any).$entities = toRef(store.$state, '$entities')
  
  // Ajouter les actions au store
  addActionsToStore(store as unknown as EntityStore, actions, baseState)
  
  // Ajouter les getters au store
  addGettersToStore(store as unknown as EntityStore, getters, baseState)
  
  // Ajouter les propriétés personnalisées pour les devtools
  addCustomProperties(store as unknown as EntityStore, actions, getters)
  
  // Retourner un objet vide car nous modifions directement le store
  // Cela permet aux devtools de tracker les propriétés
  return {}
}

/**
 * Fonction helper pour installer le plugin
 */
export function installEntityStorePlugin(pinia: any) {
  pinia.use(entityStorePlugin)
}

