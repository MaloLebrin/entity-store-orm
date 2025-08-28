import type { WithId } from '@entity-store/core'
import type { PiniaPluginContext } from 'pinia'

/**
 * Interface pour étendre les stores Pinia avec les fonctionnalités d'entités
 * Toutes les propriétés ajoutées par le plugin sont préfixées avec $
 */
export interface EntityStorePlugin<T extends WithId = any> {
  // State préfixé
  $entities: {
    byId: Record<string, T & { $isDirty: boolean }>
    allIds: string[]
    current: (T & { $isDirty: boolean }) | null
    currentById: string | null
    active: string[]
  }
  
  // Actions préfixées
  $createOne: (payload: T) => void
  $createMany: (payload: T[]) => void
  $updateOne: (id: string | number, payload: T) => void
  $updateMany: (payload: T[]) => void
  $deleteOne: (id: string | number) => void
  $deleteMany: (ids: (string | number)[]) => void
  $setCurrent: (payload: T) => void
  $setCurrentById: (id: string | number) => void
  $removeCurrent: () => void
  $removeCurrentById: () => void
  $setActive: (id: string | number) => void
  $resetActive: () => void
  $setIsDirty: (id: string | number) => void
  $setIsNotDirty: (id: string | number) => void
  $updateField: (field: string, value: any, id: string | number) => void
  
  // Getters préfixés
  $getOne: (id: string | number) => (T & { $isDirty: boolean }) | undefined
  $getMany: (ids: (string | number)[]) => (T & { $isDirty: boolean })[]
  $getAll: () => Record<string, T & { $isDirty: boolean }>
  $getAllArray: () => (T & { $isDirty: boolean })[]
  $getAllIds: () => string[]
  $getCurrent: () => (T & { $isDirty: boolean }) | null
  $getCurrentById: () => (T & { $isDirty: boolean }) | null
  $getActive: () => (T & { $isDirty: boolean })[]
  $getFirstActive: () => (T & { $isDirty: boolean }) | undefined
  $getWhere: (filter: (entity: T & { $isDirty: boolean }) => boolean | null) => Record<string, T & { $isDirty: boolean }>
  $getWhereArray: (filter: (entity: T & { $isDirty: boolean }) => boolean | null) => (T & { $isDirty: boolean })[]
  $getFirstWhere: (filter: (entity: T & { $isDirty: boolean }) => boolean | null) => (T & { $isDirty: boolean }) | undefined
  $getIsEmpty: () => boolean
  $getIsNotEmpty: () => boolean
  $isAlreadyInStore: (id: string | number) => boolean
  $isAlreadyActive: (id: string | number) => boolean
  $isDirty: (id: string | number) => boolean
  $search: (field: string) => (T & { $isDirty: boolean })[]
  $getMissingIds: (ids: (string | number)[], canHaveDuplicates?: boolean) => (string | number)[]
  $getMissingEntities: (entities: T[]) => T[]
}

/**
 * Type pour le contexte du plugin avec les entités
 */
export interface EntityPluginContext<T extends WithId = any> extends PiniaPluginContext {
  store: EntityStorePlugin<T>
}

/**
 * Options de configuration du plugin (pour l'instant vides, mais extensibles)
 */
export interface EntityPluginOptions {
  // Options futures pour la configuration globale
}

/**
 * Type pour étendre l'interface PiniaCustomProperties
 */
declare module 'pinia' {
  export interface PiniaCustomProperties {
    // State préfixé
    $entities: {
      byId: Record<string, any & { $isDirty: boolean }>
      allIds: string[]
      current: (any & { $isDirty: boolean }) | null
      currentById: string | null
      active: string[]
    }
    
    // Actions préfixées
    $createOne: (payload: any) => void
    $createMany: (payload: any[]) => void
    $updateOne: (id: string | number, payload: any) => void
    $updateMany: (payload: any[]) => void
    $deleteOne: (id: string | number) => void
    $deleteMany: (ids: (string | number)[]) => void
    $setCurrent: (payload: any) => void
    $setCurrentById: (id: string | number) => void
    $removeCurrent: () => void
    $removeCurrentById: () => void
    $setActive: (id: string | number) => void
    $resetActive: () => void
    $setIsDirty: (id: string | number) => void
    $setIsNotDirty: (id: string | number) => void
    $updateField: (field: string, value: any, id: string | number) => void
    
    // Getters préfixés
    $getOne: (id: string | number) => (any & { $isDirty: boolean }) | undefined
    $getMany: (ids: (string | number)[]) => (any & { $isDirty: boolean })[]
    $getAll: () => Record<string, any & { $isDirty: boolean }>
    $getAllArray: () => (any & { $isDirty: boolean })[]
    $getAllIds: () => string[]
    $getCurrent: () => (any & { $isDirty: boolean }) | null
    $getCurrentById: () => (any & { $isDirty: boolean }) | null
    $getActive: () => (any & { $isDirty: boolean })[]
    $getFirstActive: () => (any & { $isDirty: boolean }) | undefined
    $getWhere: (filter: (entity: any & { $isDirty: boolean }) => boolean | null) => Record<string, any & { $isDirty: boolean }>
    $getWhereArray: (filter: (entity: any & { $isDirty: boolean }) => boolean | null) => (any & { $isDirty: boolean })[]
    $getFirstWhere: (filter: (entity: any & { $isDirty: boolean }) => boolean | null) => (any & { $isDirty: boolean }) | undefined
    $getIsEmpty: () => boolean
    $getIsNotEmpty: () => boolean
    $isAlreadyInStore: (id: string | number) => boolean
    $isAlreadyActive: (id: string | number) => boolean
    $isDirty: (id: string | number) => boolean
    $search: (field: string) => (any & { $isDirty: boolean })[]
    $getMissingIds: (ids: (string | number)[], canHaveDuplicates?: boolean) => (string | number)[]
    $getMissingEntities: (entities: any[]) => any[]
  }
}
