// Types de base pour l'ORM agnostique
// Inspiré de pinia-entity-store mais adapté pour être agnostique

export interface Entity {
  id: string | number;
  [key: string]: any;
}

// Structure du state identique pour tous les adaptateurs
export interface EntityState<T extends Entity = Entity> {
  entities: {
    byId: Record<string | number, T>;
    allIds: (string | number)[];
    current: T | null;
    active: (string | number)[];
  };
}

// Configuration de base pour chaque store
export interface StoreConfig {
  name: string;
  adapter: string;
  options?: Record<string, any>;
}

// Interface que tous les adaptateurs doivent implémenter
export interface StoreAdapter<T extends Entity = Entity> {
  // Getters
  getOne(id: string | number): T | null;
  getMany(ids: (string | number)[]): T[];
  getAll(): Record<string | number, T>;
  getAllArray(): T[];
  getAllIds(): (string | number)[];
  getMissingIds(ids: (string | number)[]): (string | number)[];
  getMissingEntities(entities: T[]): T[];
  getWhere(filter: (entity: T) => boolean): Record<string | number, T>;
  getWhereArray(filter: (entity: T) => boolean): T[];
  getIsEmpty(): boolean;
  getIsNotEmpty(): boolean;
  getCurrent(): T | null;
  getActive(): T[];
  getFirstActive(): T | null;
  isAlreadyInStore(id: string | number): boolean;
  isAlreadyActive(id: string | number): boolean;
  isDirty(id: string | number): boolean;

  // Actions
  createOne(entity: Omit<T, 'id'>): T;
  createMany(entities: Omit<T, 'id'>[]): T[];
  setCurrent(entity: T | null): void;
  removeCurrent(): void;
  updateOne(entity: T): T;
  updateMany(entities: T[]): T[];
  deleteOne(id: string | number): boolean;
  deleteMany(ids: (string | number)[]): boolean;
  setActive(id: string | number): void;
  resetActive(): void;
  setIsDirty(id: string | number): void;
  setIsNotDirty(id: string | number): void;
  updateField(id: string | number, field: keyof T, value: any): void;
  
  // Gestion du state
  getState(): EntityState<T>;
  setState(state: EntityState<T>): void;
  resetState(): void;
}

// Types pour les adaptateurs spécifiques
export interface ReduxStoreConfig extends StoreConfig {
  adapter: 'redux';
  store: any; // Redux store
}

export interface ZustandStoreConfig extends StoreConfig {
  adapter: 'zustand';
  store: any; // Zustand store
}

export interface JotaiStoreConfig extends StoreConfig {
  adapter: 'jotai';
  store: any; // Jotai store
}

export interface ValtioStoreConfig extends StoreConfig {
  adapter: 'valtio';
  store: any; // Valtio store
}

// Types utilitaires
export type EntityId = string | number;
export type EntityFilter<T extends Entity = Entity> = (entity: T) => boolean;
export type EntitySorter<T extends Entity = Entity> = (a: T, b: T) => number;
