import type { Entity, EntityState, EntityId, EntityFilter } from '../types/index.js';

/**
 * EntityGetters - Handles all entity retrieval logic
 * 
 * This class encapsulates all the getter methods for entities, providing
 * a clean separation of concerns and making the code more testable.
 * 
 * @template T - The entity type that extends the base Entity interface
 * 
 * @example
 * ```typescript
 * const getters = new EntityGetters<User>(state);
 * const user = getters.getOne(123);
 * const adults = getters.getWhereArray(user => user.age >= 18);
 * ```
 */
export class EntityGetters<T extends Entity = Entity> {
  constructor(private state: EntityState<T>) {}

  /**
   * Retrieves a single entity by its ID
   * 
   * @param id - The unique identifier of the entity
   * @returns The entity if found, null otherwise
   */
  getOne(id: EntityId): T | null {
    return this.state.entities?.byId?.[id] || null;
  }

  /**
   * Retrieves multiple entities by their IDs
   * 
   * @param ids - Array of entity IDs to retrieve
   * @returns Array of found entities (may be shorter than requested if some IDs don't exist)
   */
  getMany(ids: EntityId[]): T[] {
    return ids.map(id => this.getOne(id)).filter(Boolean) as T[];
  }

  /**
   * Retrieves all entities as a Record object indexed by ID
   * 
   * @returns Record where keys are entity IDs and values are the entities
   */
  getAll(): Record<EntityId, T> {
    return this.state.entities.byId;
  }

  /**
   * Retrieves all entities as an array
   * 
   * @returns Array of all entities in the store
   */
  getAllArray(): T[] {
    return Object.values(this.state.entities.byId);
  }

  /**
   * Retrieves all entity IDs in the store
   * 
   * @returns Array of all entity IDs
   */
  getAllIds(): EntityId[] {
    return this.state.entities?.allIds || [];
  }

  /**
   * Finds IDs that are missing from the store
   * Useful for determining which entities need to be fetched from an external source
   * 
   * @param ids - Array of IDs to check against the store
   * @returns Array of IDs that don't exist in the store
   */
  getMissingIds(ids: EntityId[]): EntityId[] {
    return ids.filter(id => !this.isAlreadyInStore(id));
  }

  /**
   * Finds entities that are missing from the store
   * 
   * @param entities - Array of entities to check against the store
   * @returns Array of entities that aren't in the store
   */
  getMissingEntities(entities: T[]): T[] {
    return entities.filter(entity => !this.isAlreadyInStore(entity.id));
  }

  /**
   * Filters entities based on a predicate function
   * 
   * @param filter - Function that returns true for entities to include
   * @returns Record of filtered entities indexed by ID
   */
  getWhere(filter: EntityFilter<T>): Record<EntityId, T> {
    const result: Record<EntityId, T> = {};
    Object.values(this.state.entities.byId).forEach(entity => {
      if (filter(entity)) {
        result[entity.id] = entity;
      }
    });
    return result;
  }

  /**
   * Filters entities based on a predicate function
   * 
   * @param filter - Function that returns true for entities to include
   * @returns Array of filtered entities
   */
  getWhereArray(filter: EntityFilter<T>): T[] {
    return Object.values(this.state.entities.byId).filter(filter);
  }

  /**
   * Checks if the store is empty (contains no entities)
   * 
   * @returns true if the store is empty, false otherwise
   */
  getIsEmpty(): boolean {
    return this.state.entities.allIds.length === 0;
  }

  /**
   * Checks if the store is not empty (contains at least one entity)
   * 
   * @returns true if the store is not empty, false otherwise
   */
  getIsNotEmpty(): boolean {
    return this.state.entities.allIds.length > 0;
  }

  /**
   * Retrieves the currently selected entity
   * 
   * @returns The current entity or null if none is selected
   */
  getCurrent(): T | null {
    return this.state.entities?.current || null;
  }

  /**
   * Retrieves all active entities
   * Active entities are typically those that are selected, highlighted, or in focus
   * 
   * @returns Array of active entities
   */
  getActive(): T[] {
    return this.state.entities?.active?.map(id => this.getOne(id)).filter(Boolean) as T[] || [];
  }

  /**
   * Retrieves the first active entity
   * 
   * @returns The first active entity or null if none are active
   */
  getFirstActive(): T | null {
    return this.state.entities.active.length > 0 ? this.getOne(this.state.entities.active[0]!) : null;
  }

  /**
   * Checks if an entity exists in the store
   * 
   * @param id - The entity ID to check
   * @returns true if the entity exists, false otherwise
   */
  isAlreadyInStore(id: EntityId): boolean {
    return id in this.state.entities.byId;
  }

  /**
   * Checks if an entity is marked as active
   * 
   * @param id - The entity ID to check
   * @returns true if the entity is active, false otherwise
   */
  isAlreadyActive(id: EntityId): boolean {
    return this.state.entities.active.includes(id);
  }

  /**
   * Checks if an entity has been modified (is dirty)
   * 
   * @param id - The entity ID to check
   * @returns true if the entity is dirty, false otherwise
   */
  isDirty(id: EntityId): boolean {
    const entity = this.getOne(id);
    return entity ? (entity as any).$isDirty === true : false;
  }

  /**
   * Updates the internal state reference
   * Useful when the state changes externally
   * 
   * @param newState - The new state to use
   */
  updateState(newState: EntityState<T>): void {
    this.state = newState;
  }

  /**
   * Gets the current state reference
   * 
   * @returns The current EntityState
   */
  getState(): EntityState<T> {
    return this.state;
  }
}
