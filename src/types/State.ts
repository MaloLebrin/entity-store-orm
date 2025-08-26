import type { Id, WithId } from './WithId'

export interface State<T extends WithId> {
  entities: {
    byId: Record<Id, T & { $isDirty: boolean }>
    allIds: Id[]
    current: T & { $isDirty: boolean } | null
    currentById: Id | null
    active: Id[]
  }
}

// export type CreatedEntity<T> = T & { $isDirty: boolean }
