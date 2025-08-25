import type { Entity, EntityId, EntityState } from '../types/index.js';

/**
 * EntityActions - Handles all entity modification logic
 * 
 * This class encapsulates all the action methods for entities, providing
 * a clean separation of concerns and making the code more testable.
 * 
 * @template T - The entity type that extends the base Entity interface
 * 
 * @example
 * ```typescript
 * const actions = new EntityActions<User>(state);
 * const user = actions.createOne({ name: 'John', email: 'john@example.com' });
 * actions.updateOne({ ...user, age: 31 });
 * ```
 */
export class EntityActions<T extends Entity = Entity> {
  private nextId: number = 1;

  constructor(private state: EntityState<T>) {}

  /**
   * Creates a new entity in the store
   * 
   * @param entity - Entity data without the ID (ID will be generated automatically)
   * @returns The newly created entity with generated ID
   */
  createOne(entity: Omit<T, 'id'>): T {
    const id = this.generateId();
    const newEntity = { ...entity, id } as T;
    
    this.state.entities.byId[id] = newEntity;
    this.state.entities.allIds.push(id);
    
    return newEntity;
  }

  /**
   * Creates multiple entities in the store
   * 
   * @param entities - Array of entity data without IDs
   * @returns Array of newly created entities with generated IDs
   */
  createMany(entities: Omit<T, 'id'>[]): T[] {
    if (entities.length === 0) {
      return [];
    }

    return entities.map(entity => this.createOne(entity));
  }

  /**
   * Sets the currently selected entity
   * 
   * @param entity - The entity to set as current, or null/undefined to clear selection
   */
  setCurrent(entity: T | null | undefined): void {
    this.state.entities.current = entity || null;
  }

  /**
   * Removes the currently selected entity
   */
  removeCurrent(): void {
    this.setCurrent(null);
  }

  /**
   * Updates an existing entity in the store
   * 
   * @param entity - The updated entity (must include the ID)
   * @returns The updated entity
   * @throws {Error} If the entity doesn't exist
   */
  updateOne(entity: T): T {
    if (!this.isAlreadyInStore(entity.id)) {
      throw new Error(`Entity with id ${entity.id} not found`);
    }
    
    this.state.entities.byId[entity.id] = entity;
    return entity;
  }

  /**
   * Updates multiple entities in the store
   * 
   * @param entities - Array of entities to update
   * @returns Array of updated entities
   */
  updateMany(entities: T[]): T[] {
    return entities.map(entity => this.updateOne(entity));
  }

  /**
   * Deletes an entity from the store
   * 
   * @param id - The ID of the entity to delete
   * @returns true if the entity was deleted, false if it didn't exist
   */
  deleteOne(id: EntityId): boolean {
    if (!this.isAlreadyInStore(id)) {
      return false;
    }
    
    delete this.state.entities.byId[id];
    this.state.entities.allIds = this.state.entities.allIds.filter(storeId => storeId !== id);
    
    // Remove from active if it was active
    if (this.isAlreadyActive(id)) {
      this.state.entities.active = this.state.entities.active.filter(activeId => activeId !== id);
    }
    
    // Remove from current if it was current
    if (this.state.entities.current?.id === id) {
      this.state.entities.current = null;
    }
    
    return true;
  }

  /**
   * Deletes multiple entities from the store
   * 
   * @param ids - Array of entity IDs to delete
   * @returns true if all entities were deleted, false if any failed
   */
  deleteMany(ids: EntityId[]): boolean {
    return ids.every(id => this.deleteOne(id));
  }

  /**
   * Marks an entity as active
   * 
   * @param id - The entity ID to mark as active
   */
  setActive(id: EntityId): void {
    if (!this.isAlreadyActive(id)) {
      this.state.entities.active.push(id);
    }
  }

  /**
   * Clears all active entities
   */
  resetActive(): void {
    this.state.entities.active = [];
  }

  /**
   * Marks an entity as modified (dirty)
   * Useful for tracking unsaved changes
   * 
   * @param id - The entity ID to mark as dirty
   */
  setIsDirty(id: EntityId): void {
    const entity = this.getOne(id);
    if (entity) {
      (entity as any).$isDirty = true;
    }
  }

  /**
   * Marks an entity as not modified (clean)
   * 
   * @param id - The entity ID to mark as clean
   */
  setIsNotDirty(id: EntityId): void {
    const entity = this.getOne(id);
    if (entity) {
      (entity as any).$isDirty = false;
    }
  }

  /**
   * Updates a specific field of an entity
   * 
   * @param id - The entity ID to update
   * @param field - The field name to update
   * @param value - The new value for the field
   */
  updateField(id: EntityId, field: keyof T, value: any): void {
    const entity = this.getOne(id);
    if (entity) {
      (entity as any)[field] = value;
    }
  }

  /**
   * Gets the current state reference
   * 
   * @returns The current EntityState
   */
  getState(): EntityState<T> {
    return this.state;
  }

  /**
   * Sets the complete state of the store
   * Useful for restoring from external sources or resetting the store
   * 
   * @param newState - The complete EntityState object to set
   */
  setState(newState: EntityState<T>): void {
    // Copy the new state to avoid reference issues
    this.state.entities.byId = { ...newState.entities.byId };
    this.state.entities.allIds = [...newState.entities.allIds];
    this.state.entities.current = newState.entities.current;
    this.state.entities.active = [...newState.entities.active];
  }

  /**
   * Resets the store to its initial empty state
   */
  resetState(): void {
    // Clear the existing state instead of creating a new object
    this.state.entities.byId = {};
    this.state.entities.allIds = [];
    this.state.entities.current = null;
    this.state.entities.active = [];
    this.nextId = 1;
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Generates a unique ID for new entities
   * Can be overridden by derived classes to use different ID generation strategies
   * 
   * @returns A unique identifier
   */
  private generateId(): EntityId {
    return this.nextId++;
  }

  /**
   * Checks if an entity exists in the store
   * 
   * @param id - The entity ID to check
   * @returns true if the entity exists, false otherwise
   */
  private isAlreadyInStore(id: EntityId): boolean {
    return id in this.state.entities.byId;
  }

  /**
   * Checks if an entity is marked as active
   * 
   * @param id - The entity ID to check
   * @returns true if the entity is active, false otherwise
   */
  private isAlreadyActive(id: EntityId): boolean {
    return this.state.entities.active.includes(id);
  }

  /**
   * Retrieves a single entity by its ID
   * 
   * @param id - The unique identifier of the entity
   * @returns The entity if found, null otherwise
   */
  private getOne(id: EntityId): T | null {
    return this.state.entities.byId[id] || null;
  }
}
