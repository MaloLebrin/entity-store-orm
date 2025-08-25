import type {
  Entity,
  EntityFilter,
  EntityId,
  EntityState,
  StoreAdapter
} from '../types/index.js';

/**
 * BaseAdapter - Abstract base class for all store adapters
 * 
 * This class provides a default implementation of the StoreAdapter interface
 * that can be extended by specific adapters (Pinia, Redux, Zustand, etc.).
 * It handles the common logic for entity management while allowing adapters
 * to override specific behavior as needed.
 * 
 * @template T - The entity type that extends the base Entity interface
 * 
 * @example
 * ```typescript
 * class PiniaAdapter<T extends Entity> extends BaseAdapter<T> {
 *   constructor(store: any) {
 *     super();
 *     this.store = store;
 *   }
 *   
 *   // Override specific methods as needed
 *   override createOne(entity: Omit<T, 'id'>): T {
 *     // Custom Pinia-specific implementation
 *   }
 * }
 * ```
 */
export abstract class BaseAdapter<T extends Entity = Entity> implements StoreAdapter<T> {
  protected state: EntityState<T> = {
    entities: {
      byId: {},
      allIds: [],
      current: null,
      active: []
    }
  };

  protected nextId: number = 1;

  // ===== GETTERS =====

  /**
   * Retrieves a single entity by its ID
   * 
   * @param id - The unique identifier of the entity
   * @returns The entity if found, null otherwise
   */
  getOne(id: EntityId): T | null {
    return this.state.entities.byId[id] || null;
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
    return this.state.entities.allIds;
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
    return this.state.entities.current;
  }

  /**
   * Retrieves all active entities
   * Active entities are typically those that are selected, highlighted, or in focus
   * 
   * @returns Array of active entities
   */
  getActive(): T[] {
    return this.state.entities.active.map(id => this.getOne(id)).filter(Boolean) as T[];
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

  // ===== ACTIONS =====

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
    
    // Notify derived classes about the creation
    this.onEntityCreated(newEntity);
    
    return newEntity;
  }

  /**
   * Creates multiple entities in the store
   * 
   * @param entities - Array of entity data without IDs
   * @returns Array of newly created entities with generated IDs
   */
  createMany(entities: Omit<T, 'id'>[]): T[] {
    return entities.map(entity => this.createOne(entity));
  }

  /**
   * Sets the currently selected entity
   * 
   * @param entity - The entity to set as current, or null to clear selection
   */
  setCurrent(entity: T | null): void {
    this.state.entities.current = entity;
    this.onCurrentChanged(entity);
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
   */
  updateOne(entity: T): T {
    if (!this.isAlreadyInStore(entity.id)) {
      throw new Error(`Entity with id ${entity.id} not found`);
    }
    
    this.state.entities.byId[entity.id] = entity;
    
    // Notify derived classes about the update
    this.onEntityUpdated(entity);
    
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
    
    // Notify derived classes about the deletion
    this.onEntityDeleted(id);
    
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
      this.onEntityActivated(id);
    }
  }

  /**
   * Clears all active entities
   */
  resetActive(): void {
    this.state.entities.active = [];
    this.onActiveReset();
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
      this.onEntityDirtyChanged(id, true);
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
      this.onEntityDirtyChanged(id, false);
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
      this.onEntityFieldUpdated(id, field, value);
    }
  }

  // ===== STATE MANAGEMENT =====

  /**
   * Retrieves the complete state of the store
   * 
   * @returns The complete EntityState object
   */
  getState(): EntityState<T> {
    return this.state;
  }

  /**
   * Sets the complete state of the store
   * Useful for restoring from external sources or resetting the store
   * 
   * @param state - The complete EntityState object to set
   */
  setState(state: EntityState<T>): void {
    this.state = state;
    this.onStateChanged(state);
  }

  /**
   * Resets the store to its initial empty state
   */
  resetState(): void {
    this.state = {
      entities: {
        byId: {},
        allIds: [],
        current: null,
        active: []
      }
    };
    this.nextId = 1;
    this.onStateReset();
  }

  // ===== PROTECTED UTILITY METHODS =====

  /**
   * Generates a unique ID for new entities
   * Can be overridden by derived classes to use different ID generation strategies
   * 
   * @returns A unique identifier
   */
  protected generateId(): EntityId {
    return this.nextId++;
  }

  /**
   * Validates entity data before creation/update
   * Can be overridden by derived classes to add custom validation
   * 
   * @param entity - The entity to validate
   * @returns true if the entity is valid, false otherwise
   */
  protected validateEntity(entity: Partial<T>): boolean {
    // Basic validation - derived classes can override this
    return entity !== null && entity !== undefined;
  }

  // ===== HOOKS FOR DERIVED CLASSES =====

  /**
   * Hook called when an entity is created
   * Override this method to add custom behavior
   * 
   * @param entity - The newly created entity
   */
  protected onEntityCreated(entity: T): void {
    // Override in derived classes
  }

  /**
   * Hook called when an entity is updated
   * Override this method to add custom behavior
   * 
   * @param entity - The updated entity
   */
  protected onEntityUpdated(entity: T): void {
    // Override in derived classes
  }

  /**
   * Hook called when an entity is deleted
   * Override this method to add custom behavior
   * 
   * @param id - The ID of the deleted entity
   */
  protected onEntityDeleted(id: EntityId): void {
    // Override in derived classes
  }

  /**
   * Hook called when the current entity changes
   * Override this method to add custom behavior
   * 
   * @param entity - The new current entity or null
   */
  protected onCurrentChanged(entity: T | null): void {
    // Override in derived classes
  }

  /**
   * Hook called when an entity is activated
   * Override this method to add custom behavior
   * 
   * @param id - The ID of the activated entity
   */
  protected onEntityActivated(id: EntityId): void {
    // Override in derived classes
  }

  /**
   * Hook called when active entities are reset
   * Override this method to add custom behavior
   */
  protected onActiveReset(): void {
    // Override in derived classes
  }

  /**
   * Hook called when an entity's dirty state changes
   * Override this method to add custom behavior
   * 
   * @param id - The ID of the entity
   * @param isDirty - Whether the entity is now dirty
   */
  protected onEntityDirtyChanged(id: EntityId, isDirty: boolean): void {
    // Override in derived classes
  }

  /**
   * Hook called when an entity field is updated
   * Override this method to add custom behavior
   * 
   * @param id - The ID of the entity
   * @param field - The name of the updated field
   * @param value - The new value
   */
  protected onEntityFieldUpdated(id: EntityId, field: keyof T, value: any): void {
    // Override in derived classes
  }

  /**
   * Hook called when the state changes
   * Override this method to add custom behavior
   * 
   * @param state - The new state
   */
  protected onStateChanged(state: EntityState<T>): void {
    // Override in derived classes
  }

  /**
   * Hook called when the state is reset
   * Override this method to add custom behavior
   */
  protected onStateReset(): void {
    // Override in derived classes
  }
}
