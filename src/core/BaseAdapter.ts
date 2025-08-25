import type {
  Entity,
  EntityFilter,
  EntityId,
  EntityState,
  StoreAdapter
} from '../types/index.js';
import { EntityGetters } from './EntityGetters.js';
import { EntityActions } from './EntityActions.js';

/**
 * BaseAdapter - Abstract base class for all store adapters
 * 
 * This class provides a default implementation of the StoreAdapter interface
 * that can be extended by specific adapters (Pinia, Redux, Zustand, etc.).
 * It uses EntityGetters and EntityActions internally while providing hooks
 * for derived classes to customize behavior.
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

  protected getters: EntityGetters<T>;
  protected actions: EntityActions<T>;

  constructor() {
    this.getters = new EntityGetters(this.state);
    this.actions = new EntityActions(this.state);
  }

  // ===== GETTERS =====

  /**
   * Retrieves a single entity by its ID
   * 
   * @param id - The unique identifier of the entity
   * @returns The entity if found, null otherwise
   */
  getOne(id: EntityId): T | null {
    return this.getters.getOne(id);
  }

  /**
   * Retrieves multiple entities by their IDs
   * 
   * @param ids - Array of entity IDs to retrieve
   * @returns Array of found entities (may be shorter than requested if some IDs don't exist)
   */
  getMany(ids: EntityId[]): T[] {
    return this.getters.getMany(ids);
  }

  /**
   * Retrieves all entities as a Record object indexed by ID
   * 
   * @returns Record where keys are entity IDs and values are the entities
   */
  getAll(): Record<EntityId, T> {
    return this.getters.getAll();
  }

  /**
   * Retrieves all entities as an array
   * 
   * @returns Array of all entities in the store
   */
  getAllArray(): T[] {
    return this.getters.getAllArray();
  }

  /**
   * Retrieves all entity IDs in the store
   * 
   * @returns Array of all entity IDs
   */
  getAllIds(): EntityId[] {
    return this.getters.getAllIds();
  }

  /**
   * Finds IDs that are missing from the store
   * Useful for determining which entities need to be fetched from an external source
   * 
   * @param ids - Array of IDs to check against the store
   * @returns Array of IDs that don't exist in the store
   */
  getMissingIds(ids: EntityId[]): EntityId[] {
    return this.getters.getMissingIds(ids);
  }

  /**
   * Finds entities that are missing from the store
   * 
   * @param entities - Array of entities to check against the store
   * @returns Array of entities that aren't in the store
   */
  getMissingEntities(entities: T[]): T[] {
    return this.getters.getMissingEntities(entities);
  }

  /**
   * Filters entities based on a predicate function
   * 
   * @param filter - Function that returns true for entities to include
   * @returns Record of filtered entities indexed by ID
   */
  getWhere(filter: EntityFilter<T>): Record<EntityId, T> {
    return this.getters.getWhere(filter);
  }

  /**
   * Filters entities based on a predicate function
   * 
   * @param filter - Function that returns true for entities to include
   * @returns Array of filtered entities
   */
  getWhereArray(filter: EntityFilter<T>): T[] {
    return this.getters.getWhereArray(filter);
  }

  /**
   * Checks if the store is empty (contains no entities)
   * 
   * @returns true if the store is empty, false otherwise
   */
  getIsEmpty(): boolean {
    return this.getters.getIsEmpty();
  }

  /**
   * Checks if the store is not empty (contains at least one entity)
   * 
   * @returns true if the store is not empty, false otherwise
   */
  getIsNotEmpty(): boolean {
    return this.getters.getIsNotEmpty();
  }

  /**
   * Retrieves the currently selected entity
   * 
   * @returns The current entity or null if none is selected
   */
  getCurrent(): T | null {
    return this.getters.getCurrent();
  }

  /**
   * Retrieves all active entities
   * Active entities are typically those that are selected, highlighted, or in focus
   * 
   * @returns Array of active entities
   */
  getActive(): T[] {
    return this.getters.getActive();
  }

  /**
   * Retrieves the first active entity
   * 
   * @returns The first active entity or null if none are active
   */
  getFirstActive(): T | null {
    return this.getters.getFirstActive();
  }

  /**
   * Checks if an entity exists in the store
   * 
   * @param id - The entity ID to check
   * @returns true if the entity exists, false otherwise
   */
  isAlreadyInStore(id: EntityId): boolean {
    return this.getters.isAlreadyInStore(id);
  }

  /**
   * Checks if an entity is marked as active
   * 
   * @param id - The entity ID to check
   * @returns true if the entity is active, false otherwise
   */
  isAlreadyActive(id: EntityId): boolean {
    return this.getters.isAlreadyActive(id);
  }

  /**
   * Checks if an entity has been modified (is dirty)
   * 
   * @param id - The entity ID to check
   * @returns true if the entity is dirty, false otherwise
   */
  isDirty(id: EntityId): boolean {
    return this.getters.isDirty(id);
  }

  // ===== ACTIONS =====

  /**
   * Creates a new entity in the store
   * 
   * @param entity - Entity data without the ID (ID will be generated automatically)
   * @returns The newly created entity with generated ID
   */
  createOne(entity: Omit<T, 'id'>): T {
    const newEntity = this.actions.createOne(entity);
    
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
    const newEntities = this.actions.createMany(entities);
    
    // Notify derived classes about the creation
    newEntities.forEach(entity => this.onEntityCreated(entity));
    
    return newEntities;
  }

  /**
   * Sets the currently selected entity
   * 
   * @param entity - The entity to set as current, or null to clear selection
   */
  setCurrent(entity: T | null): void {
    this.actions.setCurrent(entity);
    this.onCurrentChanged(entity);
  }

  /**
   * Removes the currently selected entity
   */
  removeCurrent(): void {
    this.actions.removeCurrent();
    this.onCurrentChanged(null);
  }

  /**
   * Updates an existing entity in the store
   * 
   * @param entity - The updated entity (must include the ID)
   * @returns The updated entity
   */
  updateOne(entity: T): T {
    const updatedEntity = this.actions.updateOne(entity);
    
    // Notify derived classes about the update
    this.onEntityUpdated(updatedEntity);
    
    return updatedEntity;
  }

  /**
   * Updates multiple entities in the store
   * 
   * @param entities - Array of entities to update
   * @returns Array of updated entities
   */
  updateMany(entities: T[]): T[] {
    const updatedEntities = this.actions.updateMany(entities);
    
    // Notify derived classes about the update
    updatedEntities.forEach(entity => this.onEntityUpdated(entity));
    
    return updatedEntities;
  }

  /**
   * Deletes an entity from the store
   * 
   * @param id - The ID of the entity to delete
   * @returns true if the entity was deleted, false if it didn't exist
   */
  deleteOne(id: EntityId): boolean {
    const result = this.actions.deleteOne(id);
    
    if (result) {
      // Notify derived classes about the deletion
      this.onEntityDeleted(id);
    }
    
    return result;
  }

  /**
   * Deletes multiple entities from the store
   * 
   * @param ids - Array of entity IDs to delete
   * @returns true if all entities were deleted, false if any failed
   */
  deleteMany(ids: EntityId[]): boolean {
    const result = this.actions.deleteMany(ids);
    
    if (result) {
      // Notify derived classes about the deletion
      ids.forEach(id => this.onEntityDeleted(id));
    }
    
    return result;
  }

  /**
   * Marks an entity as active
   * 
   * @param id - The entity ID to mark as active
   */
  setActive(id: EntityId): void {
    const wasActive = this.isAlreadyActive(id);
    this.actions.setActive(id);
    
    if (!wasActive) {
      this.onEntityActivated(id);
    }
  }

  /**
   * Clears all active entities
   */
  resetActive(): void {
    this.actions.resetActive();
    this.onActiveReset();
  }

  /**
   * Marks an entity as modified (dirty)
   * Useful for tracking unsaved changes
   * 
   * @param id - The entity ID to mark as dirty
   */
  setIsDirty(id: EntityId): void {
    this.actions.setIsDirty(id);
    this.onEntityDirtyChanged(id, true);
  }

  /**
   * Marks an entity as not modified (clean)
   * 
   * @param id - The entity ID to mark as clean
   */
  setIsNotDirty(id: EntityId): void {
    this.actions.setIsNotDirty(id);
    this.onEntityDirtyChanged(id, false);
  }

  /**
   * Updates a specific field of an entity
   * 
   * @param id - The entity ID to update
   * @param field - The field name to update
   * @param value - The new value for the field
   */
  updateField(id: EntityId, field: keyof T, value: any): void {
    this.actions.updateField(id, field, value);
    this.onEntityFieldUpdated(id, field, value);
  }

  // ===== STATE MANAGEMENT =====

  /**
   * Retrieves the complete state of the store
   * 
   * @returns The complete EntityState object
   */
  getState(): EntityState<T> {
    return this.getters.getState();
  }

  /**
   * Sets the complete state of the store
   * Useful for restoring from external sources or resetting the store
   * 
   * @param state - The complete EntityState object to set
   */
  setState(state: EntityState<T>): void {
    this.getters.updateState(state);
    this.actions.setState(state);
    this.onStateChanged(state);
  }

  /**
   * Resets the store to its initial empty state
   */
  resetState(): void {
    this.actions.resetState();
    this.onStateReset();
  }

  // ===== PROTECTED UTILITY METHODS =====

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
