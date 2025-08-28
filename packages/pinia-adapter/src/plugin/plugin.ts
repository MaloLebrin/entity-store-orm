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
  
  // Pour gérer correctement SSR, nous devons ajouter l'état dans deux endroits
  if (!store.$state.hasOwnProperty('$entities')) {
    // Créer une ref réactive pour l'état des entités
    const entities = ref(baseState.entities)
    // Ajouter à $state pour la sérialisation SSR
    store.$state.$entities = entities
  }
  
  // Transférer la ref du state au store pour l'accès direct
  ;(store as any).$entities = toRef(store.$state, '$entities')
  
  // Créer un objet d'actions lié au store pour que this.createOne fonctionne
  const boundActions: any = {}
  for (const key in actions) {
    boundActions[key] = (actions as any)[key]
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
      ;(store as any)[`$${key}`] = boundActions[key]
    }
  }
  
  // Ajouter tous les getters préfixés en les traitant selon leur type
  for (const key in getters) {
    if (!store.$state.hasOwnProperty(`$${key}`)) {
      const getter = (getters as any)[key]
      
      if (typeof getter === 'function') {
        const result = getter(baseState)
        
        // Certains getters retournent directement des valeurs
        if (key === 'getAllArray' || key === 'getAllIds' || key === 'getAll' || key === 'getActive' || key === 'getFirstActive' || key === 'getIsEmpty' || key === 'getIsNotEmpty' || key === 'getCurrent' || key === 'getCurrentById') {
          // Créer une fonction qui retourne la valeur actuelle de l'état
          ;(store as any)[`$${key}`] = () => {
            const currentState = createState<WithId>()
            // Copier l'état actuel du store
            currentState.entities.byId = { ...store.$state.$entities.byId }
            currentState.entities.allIds = [...store.$state.$entities.allIds]
            currentState.entities.current = store.$state.$entities.current
            currentState.entities.currentById = store.$state.$entities.currentById
            currentState.entities.active = [...store.$state.$entities.active]
            
            const currentGetters = createGetters(currentState)
            const currentGetter = (currentGetters as any)[key]
            const value = currentGetter(currentState)
            
            // Convertir les IDs en chaînes pour getAllIds
            if (key === 'getAllIds') {
              return value.map((id: any) => String(id))
            }
            
            return value
          }
        } else {
          // D'autres retournent des fonctions qui prennent des paramètres
          ;(store as any)[`$${key}`] = result
        }
      } else {
        ;(store as any)[`$${key}`] = getter
      }
    }
  }
  
  // Ajouter les propriétés personnalisées pour les devtools
  if (process.env.NODE_ENV === 'development') {
    store._customProperties.add('$entities')
    
    // Ajouter toutes les actions et getters aux propriétés personnalisées
    Object.keys(actions).forEach(key => {
      store._customProperties.add(`$${key}`)
    })
    
    Object.keys(getters).forEach(key => {
      store._customProperties.add(`$${key}`)
    })
  }
  
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

