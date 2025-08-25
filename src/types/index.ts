// Base types for the agnostic ORM
// Inspired by pinia-entity-store but adapted to be agnostic

/**
 * Base interface that all entities must implement
 * 
 * @example
 * ```typescript
 * interface User extends Entity {
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 * 
 * const user: User = {
 *   id: 1,
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   age: 30
 * };
 * ```
 */
export interface Entity {
  /** Unique identifier for the entity */
  id: string | number;
  /** Additional properties that can be added to any entity */
  [key: string]: any;
}

/**
 * Structure of the entity state that is identical for all adapters
 * This provides a consistent data structure regardless of the underlying state manager
 * 
 * @template T - The entity type that extends the base Entity interface
 * 
 * @example
 * ```typescript
 * const state: EntityState<User> = {
 *   entities: {
 *     byId: { 1: user1, 2: user2 },
 *     allIds: [1, 2],
 *     current: user1,
 *     active: [1]
 *   }
 * };
 * ```
 */
export interface EntityState<T extends Entity = Entity> {
  entities: {
    /** Map of entities indexed by their ID for fast lookups */
    byId: Record<string | number, T>;
    /** Array of all entity IDs in the store */
    allIds: (string | number)[];
    /** Currently selected entity */
    current: T | null;
    /** Array of entity IDs that are currently active/selected */
    active: (string | number)[];
  };
}

/**
 * Configuration object for each store
 * 
 * @example
 * ```typescript
 * const config: StoreConfig = {
 *   name: 'user',
 *   adapter: 'redux',
 *   options: { enableLogging: true }
 * };
 * ```
 */
export interface StoreConfig {
  /** Name of the store/entity type */
  name: string;
  /** Type of adapter to use */
  adapter: string;
  /** Additional configuration options */
  options?: Record<string, any>;
}

/**
 * Interface that all store adapters must implement
 * This provides a unified API regardless of the underlying state manager
 * 
 * @template T - The entity type that extends the base Entity interface
 * 
 * @example
 * ```typescript
 * class ReduxAdapter implements StoreAdapter<User> {
 *   // Implementation of all required methods
 * }
 * ```
 */
export interface StoreAdapter<T extends Entity = Entity> {
  // ===== GETTERS =====
  
  /**
   * Retrieves a single entity by its ID
   * 
   * @param id - The unique identifier of the entity
   * @returns The entity if found, null otherwise
   */
  getOne(id: string | number): T | null;

  /**
   * Retrieves multiple entities by their IDs
   * 
   * @param ids - Array of entity IDs to retrieve
   * @returns Array of found entities (may be shorter than requested if some IDs don't exist)
   */
  getMany(ids: (string | number)[]): T[];

  /**
   * Retrieves all entities as a Record object indexed by ID
   * 
   * @returns Record where keys are entity IDs and values are the entities
   */
  getAll(): Record<string | number, T>;

  /**
   * Retrieves all entities as an array
   * 
   * @returns Array of all entities in the store
   */
  getAllArray(): T[];

  /**
   * Retrieves all entity IDs in the store
   * 
   * @returns Array of all entity IDs
   */
  getAllIds(): (string | number)[];

  /**
   * Finds IDs that are missing from the store
   * Useful for determining which entities need to be fetched from an external source
   * 
   * @param ids - Array of IDs to check against the store
   * @returns Array of IDs that don't exist in the store
   */
  getMissingIds(ids: (string | number)[]): (string | number)[];

  /**
   * Finds entities that are missing from the store
   * 
   * @param entities - Array of entities to check against the store
   * @returns Array of entities that aren't in the store
   */
  getMissingEntities(entities: T[]): T[];

  /**
   * Filters entities based on a predicate function
   * 
   * @param filter - Function that returns true for entities to include
   * @returns Record of filtered entities indexed by ID
   */
  getWhere(filter: (entity: T) => boolean): Record<string | number, T>;

  /**
   * Filters entities based on a predicate function
   * 
   * @param filter - Function that returns true for entities to include
   * @returns Array of filtered entities
   */
  getWhereArray(filter: (entity: T) => boolean): T[];

  /**
   * Checks if the store is empty (contains no entities)
   * 
   * @returns true if the store is empty, false otherwise
   */
  getIsEmpty(): boolean;

  /**
   * Checks if the store is not empty (contains at least one entity)
   * 
   * @returns true if the store is not empty, false otherwise
   */
  getIsNotEmpty(): boolean;

  /**
   * Retrieves the currently selected entity
   * 
   * @returns The current entity or null if none is selected
   */
  getCurrent(): T | null;

  /**
   * Retrieves all active entities
   * Active entities are typically those that are selected, highlighted, or in focus
   * 
   * @returns Array of active entities
   */
  getActive(): T[];

  /**
   * Retrieves the first active entity
   * 
   * @returns The first active entity or null if none are active
   */
  getFirstActive(): T | null;

  /**
   * Checks if an entity exists in the store
   * 
   * @param id - The entity ID to check
   * @returns true if the entity exists, false otherwise
   */
  isAlreadyInStore(id: string | number): boolean;

  /**
   * Checks if an entity is marked as active
   * 
   * @param id - The entity ID to check
   * @returns true if the entity is active, false otherwise
   */
  isAlreadyActive(id: string | number): boolean;

  /**
   * Checks if an entity has been modified (is dirty)
   * 
   * @param id - The entity ID to check
   * @returns true if the entity is dirty, false otherwise
   */
  isDirty(id: string | number): boolean;

  // ===== ACTIONS =====

  /**
   * Creates a new entity in the store
   * 
   * @param entity - Entity data without the ID (ID will be generated automatically)
   * @returns The newly created entity with generated ID
   */
  createOne(entity: Omit<T, 'id'>): T;

  /**
   * Creates multiple entities in the store
   * 
   * @param entities - Array of entity data without IDs
   * @returns Array of newly created entities with generated IDs
   */
  createMany(entities: Omit<T, 'id'>[]): T[];

  /**
   * Sets the currently selected entity
   * 
   * @param entity - The entity to set as current, or null to clear selection
   */
  setCurrent(entity: T | null): void;

  /**
   * Removes the currently selected entity
   */
  removeCurrent(): void;

  /**
   * Updates an existing entity in the store
   * 
   * @param entity - The updated entity (must include the ID)
   * @returns The updated entity
   */
  updateOne(entity: T): T;

  /**
   * Updates multiple entities in the store
   * 
   * @param entities - Array of entities to update
   * @returns Array of updated entities
   */
  updateMany(entities: T[]): T[];

  /**
   * Deletes an entity from the store
   * 
   * @param id - The ID of the entity to delete
   * @returns true if the entity was deleted, false if it didn't exist
   */
  deleteOne(id: string | number): boolean;

  /**
   * Deletes multiple entities from the store
   * 
   * @param ids - Array of entity IDs to delete
   * @returns true if all entities were deleted, false if any failed
   */
  deleteMany(ids: (string | number)[]): boolean;

  /**
   * Marks an entity as active
   * 
   * @param id - The entity ID to mark as active
   */
  setActive(id: string | number): void;

  /**
   * Clears all active entities
   */
  resetActive(): void;

  /**
   * Marks an entity as modified (dirty)
   * Useful for tracking unsaved changes
   * 
   * @param id - The entity ID to mark as dirty
   */
  setIsDirty(id: string | number): void;

  /**
   * Marks an entity as not modified (clean)
   * 
   * @param id - The entity ID to mark as clean
   */
  setIsNotDirty(id: string | number): void;

  /**
   * Updates a specific field of an entity
   * 
   * @param id - The entity ID to update
   * @param field - The field name to update
   * @param value - The new value for the field
   */
  updateField(id: string | number, field: keyof T, value: any): void;
  
  // ===== STATE MANAGEMENT =====

  /**
   * Retrieves the complete state of the store
   * 
   * @returns The complete EntityState object
   */
  getState(): EntityState<T>;

  /**
   * Sets the complete state of the store
   * Useful for restoring from external sources or resetting the store
   * 
   * @param state - The complete EntityState object to set
   */
  setState(state: EntityState<T>): void;

  /**
   * Resets the store to its initial empty state
   */
  resetState(): void;
}

// ===== ADAPTER-SPECIFIC CONFIGURATIONS =====

/**
 * Configuration for Redux adapter
 * 
 * @example
 * ```typescript
 * const config: ReduxStoreConfig = {
 *   name: 'user',
 *   adapter: 'redux',
 *   store: reduxStore
 * };
 * ```
 */
export interface ReduxStoreConfig extends StoreConfig {
  /** Must be 'redux' for Redux adapter */
  adapter: 'redux';
  /** Redux store instance */
  store: any; // Redux store
}

/**
 * Configuration for Zustand adapter
 * 
 * @example
 * ```typescript
 * const config: ZustandStoreConfig = {
 *   name: 'user',
 *   adapter: 'zustand',
 *   store: zustandStore
 * };
 * ```
 */
export interface ZustandStoreConfig extends StoreConfig {
  /** Must be 'zustand' for Zustand adapter */
  adapter: 'zustand';
  /** Zustand store instance */
  store: any; // Zustand store
}

/**
 * Configuration for Jotai adapter
 * 
 * @example
 * ```typescript
 * const config: JotaiStoreConfig = {
 *   name: 'user',
 *   adapter: 'jotai',
 *   store: jotaiStore
 * };
 * ```
 */
export interface JotaiStoreConfig extends StoreConfig {
  /** Must be 'jotai' for Jotai adapter */
  adapter: 'jotai';
  /** Jotai store instance */
  store: any; // Jotai store
}

/**
 * Configuration for Valtio adapter
 * 
 * @example
 * ```typescript
 * const config: ValtioStoreConfig = {
 *   name: 'user',
 *   adapter: 'valtio',
 *   store: valtioStore
 * };
 * ```
 */
export interface ValtioStoreConfig extends StoreConfig {
  /** Must be 'valtio' for Valtio adapter */
  adapter: 'valtio';
  /** Valtio store instance */
  store: any; // Valtio store
}

// ===== UTILITY TYPES =====

/** Type alias for entity ID (string or number) */
export type EntityId = string | number;

/** Type alias for entity filter function */
export type EntityFilter<T extends Entity = Entity> = (entity: T) => boolean;

/** Type alias for entity sorting function */
export type EntitySorter<T extends Entity = Entity> = (a: T, b: T) => number;
