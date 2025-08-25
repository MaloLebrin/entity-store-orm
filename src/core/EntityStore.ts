import type {
  Entity,
  EntityFilter,
  EntityId,
  EntityState,
  StoreAdapter,
  StoreConfig
} from '../types/index.js';
import { EntityGetters } from './EntityGetters.js';
import { EntityActions } from './EntityActions.js';

/**
 * EntityStore - Main class of the agnostic ORM
 * Inspired by pinia-entity-store but adapted to be agnostic
 * 
 * This class provides a unified interface for managing entities regardless of the underlying state manager.
 * It uses EntityGetters and EntityActions internally while delegating state management to the adapter.
 * 
 * @template T - The entity type that extends the base Entity interface
 * 
 * @example
 * ```typescript
 * const userStore = new EntityStore(
 *   { name: 'user', adapter: 'redux' },
 *   new ReduxAdapter(userMetadata)
 * );
 * 
 * // Create a new user
 * const user = userStore.createOne({ name: 'John', email: 'john@example.com' });
 * 
 * // Find user by ID
 * const foundUser = userStore.getOne(user.id);
 * 
 * // Filter users
 * const adults = userStore.getWhereArray(user => user.age >= 18);
 * ```
 */
export class EntityStore<T extends Entity = Entity> {
  private adapter: StoreAdapter<T>;
  private config: StoreConfig;
  private getters: EntityGetters<T>;
  private actions: EntityActions<T>;

  /**
   * Creates a new EntityStore instance
   * 
   * @param config - Configuration object for the store
   * @param adapter - The adapter implementation that handles the actual state management
   * 
   * @throws {Error} If the config or adapter is invalid
   */
  constructor(config: StoreConfig, adapter: StoreAdapter<T>) {
    this.config = config;
    this.adapter = adapter;
    
    // Initialize getters and actions with the adapter's state
    const initialState = adapter.getState();
    this.getters = new EntityGetters(initialState);
    this.actions = new EntityActions(initialState);
  }

  // ===== GETTERS =====
  
  /**
   * Retrieves a single entity by its ID
   * 
   * @param id - The unique identifier of the entity
   * @returns The entity if found, null otherwise
   * 
   * @example
   * ```typescript
   * const user = store.getOne(123);
   * if (user) {
   *   console.log(user.name);
   * }
   * ```
   */
  getOne(id: EntityId): T | null {
    return this.getters.getOne(id);
  }

  /**
   * Retrieves multiple entities by their IDs
   * 
   * @param ids - Array of entity IDs to retrieve
   * @returns Array of found entities (may be shorter than requested if some IDs don't exist)
   * 
   * @example
   * ```typescript
   * const users = store.getMany([1, 2, 3]);
   * // Returns array of users that exist, may be empty if none found
   * ```
   */
  getMany(ids: EntityId[]): T[] {
    return this.getters.getMany(ids);
  }

  /**
   * Retrieves all entities as a Record object indexed by ID
   * 
   * @returns Record where keys are entity IDs and values are the entities
   * 
   * @example
   * ```typescript
   * const allUsers = store.getAll();
   * // Returns: { 1: { id: 1, name: 'John' }, 2: { id: 2, name: 'Jane' } }
   * ```
   */
  getAll(): Record<EntityId, T> {
    return this.getters.getAll();
  }

  /**
   * Retrieves all entities as an array
   * 
   * @returns Array of all entities in the store
   * 
   * @example
   * ```typescript
   * const allUsers = store.getAllArray();
   * // Returns: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   * ```
   */
  getAllArray(): T[] {
    return this.getters.getAllArray();
  }

  /**
   * Retrieves all entity IDs in the store
   * 
   * @returns Array of all entity IDs
   * 
   * @example
   * ```typescript
   * const userIds = store.getAllIds();
   * // Returns: [1, 2, 3]
   * ```
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
   * 
   * @example
   * ```typescript
   * const missingIds = store.getMissingIds([1, 2, 3, 4]);
   * // If only 1 and 3 exist, returns [2, 4]
   * ```
   */
  getMissingIds(ids: EntityId[]): EntityId[] {
    return this.getters.getMissingIds(ids);
  }

  /**
   * Finds entities that are missing from the store
   * 
   * @param entities - Array of entities to check against the store
   * @returns Array of entities that don't exist in the store
   * 
   * @example
   * ```typescript
   * const missingEntities = store.getMissingEntities([user1, user2, user3]);
   * // Returns entities that aren't in the store
   * ```
   */
  getMissingEntities(entities: T[]): T[] {
    return this.getters.getMissingEntities(entities);
  }

  /**
   * Filters entities based on a predicate function
   * 
   * @param filter - Function that returns true for entities to include
   * @returns Record of filtered entities indexed by ID
   * 
   * @example
   * ```typescript
   * const adults = store.getWhere(user => user.age >= 18);
   * const activeUsers = store.getWhere(user => user.status === 'active');
   * ```
   */
  getWhere(filter: EntityFilter<T>): Record<EntityId, T> {
    return this.getters.getWhere(filter);
  }

  /**
   * Filters entities based on a predicate function
   * 
   * @param filter - Function that returns true for entities to include
   * @returns Array of filtered entities
   * 
   * @example
   * ```typescript
   * const adults = store.getWhereArray(user => user.age >= 18);
   * // Returns: [{ id: 1, name: 'John', age: 25 }, { id: 2, name: 'Jane', age: 30 }]
   * ```
   */
  getWhereArray(filter: EntityFilter<T>): T[] {
    return this.getters.getWhereArray(filter);
  }

  /**
   * Checks if the store is empty (contains no entities)
   * 
   * @returns true if the store is empty, false otherwise
   * 
   * @example
   * ```typescript
   * if (store.getIsEmpty()) {
   *   console.log('No users found');
   * }
   * ```
   */
  getIsEmpty(): boolean {
    return this.getters.getIsEmpty();
  }

  /**
   * Checks if the store is not empty (contains at least one entity)
   * 
   * @returns true if the store is not empty, false otherwise
   * 
   * @example
   * ```typescript
   * if (store.getIsNotEmpty()) {
   *   console.log('Users found:', store.getAllArray().length);
   * }
   * ```
   */
  getIsNotEmpty(): boolean {
    return this.getters.getIsNotEmpty();
  }

  /**
   * Retrieves the currently selected entity
   * 
   * @returns The current entity or null if none is selected
   * 
   * @example
   * ```typescript
   * const currentUser = store.getCurrent();
   * if (currentUser) {
   *   console.log('Editing user:', currentUser.name);
   * }
   * ```
   */
  getCurrent(): T | null {
    return this.getters.getCurrent();
  }

  /**
   * Retrieves all active entities
   * Active entities are typically those that are selected, highlighted, or in focus
   * 
   * @returns Array of active entities
   * 
   * @example
   * ```typescript
   * const selectedUsers = store.getActive();
   * console.log('Selected users:', selectedUsers.length);
   * ```
   */
  getActive(): T[] {
    return this.getters.getActive();
  }

  /**
   * Retrieves the first active entity
   * 
   * @returns The first active entity or null if none are active
   * 
   * @example
   * ```typescript
   * const firstActive = store.getFirstActive();
   * if (firstActive) {
   *   console.log('First active user:', firstActive.name);
   * }
   * ```
   */
  getFirstActive(): T | null {
    return this.getters.getFirstActive();
  }

  /**
   * Checks if an entity exists in the store
   * 
   * @param id - The entity ID to check
   * @returns true if the entity exists, false otherwise
   * 
   * @example
   * ```typescript
   * if (store.isAlreadyInStore(123)) {
   *   console.log('User 123 already exists');
   * }
   * ```
   */
  isAlreadyInStore(id: EntityId): boolean {
    return this.getters.isAlreadyInStore(id);
  }

  /**
   * Checks if an entity is marked as active
   * 
   * @param id - The entity ID to check
   * @returns true if the entity is active, false otherwise
   * 
   * @example
   * ```typescript
   * if (store.isAlreadyActive(123)) {
   *   console.log('User 123 is already selected');
   * }
   * ```
   */
  isAlreadyActive(id: EntityId): boolean {
    return this.getters.isAlreadyActive(id);
  }

  /**
   * Checks if an entity has been modified (is dirty)
   * 
   * @param id - The entity ID to check
   * @returns true if the entity is dirty, false otherwise
   * 
   * @example
   * ```typescript
   * if (store.isDirty(123)) {
   *   console.log('User 123 has unsaved changes');
   * }
   * ```
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
   * 
   * @example
   * ```typescript
   * const newUser = store.createOne({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   age: 30
   * });
   * console.log('Created user with ID:', newUser.id);
   * ```
   */
  createOne(entity: Omit<T, 'id'>): T {
    const newEntity = this.actions.createOne(entity);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
    return newEntity;
  }

  /**
   * Creates multiple entities in the store
   * 
   * @param entities - Array of entity data without IDs
   * @returns Array of newly created entities with generated IDs
   * 
   * @example
   * ```typescript
   * const newUsers = store.createMany([
   *   { name: 'John', email: 'john@example.com' },
   *   { name: 'Jane', email: 'jane@example.com' }
   * ]);
   * ```
   */
  createMany(entities: Omit<T, 'id'>[]): T[] {
    const newEntities = this.actions.createMany(entities);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
    return newEntities;
  }

  /**
   * Sets the currently selected entity
   * 
   * @param entity - The entity to set as current, or null to clear selection
   * 
   * @example
   * ```typescript
   * store.setCurrent(user);
   * // or clear selection
   * store.setCurrent(null);
   * ```
   */
  setCurrent(entity: T | null): void {
    this.actions.setCurrent(entity);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
  }

  /**
   * Removes the currently selected entity
   * 
   * @example
   * ```typescript
   * store.removeCurrent();
   * // Equivalent to store.setCurrent(null)
   * ```
   */
  removeCurrent(): void {
    this.actions.removeCurrent();
    // Sync the state back to the adapter
    this.syncStateToAdapter();
  }

  /**
   * Updates an existing entity in the store
   * 
   * @param entity - The updated entity (must include the ID)
   * @returns The updated entity
   * 
   * @example
   * ```typescript
   * const updatedUser = store.updateOne({
   *   id: 123,
   *   name: 'John Updated',
   *   email: 'john.updated@example.com'
   * });
   * ```
   */
  updateOne(entity: T): T {
    const updatedEntity = this.actions.updateOne(entity);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
    return updatedEntity;
  }

  /**
   * Updates multiple entities in the store
   * 
   * @param entities - Array of entities to update
   * @returns Array of updated entities
   * 
   * @example
   * ```typescript
   * const updatedUsers = store.updateMany([
   *   { id: 1, name: 'John Updated' },
   *   { id: 2, name: 'Jane Updated' }
   * ]);
   * ```
   */
  updateMany(entities: T[]): T[] {
    const updatedEntities = this.actions.updateMany(entities);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
    return updatedEntities;
  }

  /**
   * Deletes an entity from the store
   * 
   * @param id - The ID of the entity to delete
   * @returns true if the entity was deleted, false if it didn't exist
   * 
   * @example
   * ```typescript
   * if (store.deleteOne(123)) {
   *   console.log('User 123 deleted successfully');
   * } else {
   *   console.log('User 123 not found');
   * }
   * ```
   */
  deleteOne(id: EntityId): boolean {
    const result = this.actions.deleteOne(id);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
    return result;
  }

  /**
   * Deletes multiple entities from the store
   * 
   * @param ids - Array of entity IDs to delete
   * @returns true if all entities were deleted, false if any failed
   * 
   * @example
   * ```typescript
   * const success = store.deleteMany([1, 2, 3]);
   * if (success) {
   *   console.log('All users deleted');
   * }
   * ```
   */
  deleteMany(ids: EntityId[]): boolean {
    const result = this.actions.deleteMany(ids);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
    return result;
  }

  /**
   * Marks an entity as active
   * 
   * @param id - The entity ID to mark as active
   * 
   * @example
   * ```typescript
   * store.setActive(123);
   * // User 123 is now active
   * ```
   */
  setActive(id: EntityId): void {
    this.actions.setActive(id);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
  }

  /**
   * Clears all active entities
   * 
   * @example
   * ```typescript
   * store.resetActive();
   * // No users are active now
   * ```
   */
  resetActive(): void {
    this.actions.resetActive();
    // Sync the state back to the adapter
    this.syncStateToAdapter();
  }

  /**
   * Marks an entity as modified (dirty)
   * Useful for tracking unsaved changes
   * 
   * @param id - The entity ID to mark as dirty
   * 
   * @example
   * ```typescript
   * store.setIsDirty(123);
   * // User 123 is now marked as having unsaved changes
   * ```
   */
  setIsDirty(id: EntityId): void {
    this.actions.setIsDirty(id);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
  }

  /**
   * Marks an entity as not modified (clean)
   * 
   * @param id - The entity ID to mark as clean
   * 
   * @example
   * ```typescript
   * store.setIsNotDirty(123);
   * // User 123 is now marked as having no unsaved changes
   * ```
   */
  setIsNotDirty(id: EntityId): void {
    this.actions.setIsNotDirty(id);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
  }

  /**
   * Updates a specific field of an entity
   * 
   * @param id - The entity ID to update
   * @param field - The field name to update
   * @param value - The new value for the field
   * 
   * @example
   * ```typescript
   * store.updateField(123, 'name', 'John Updated');
   * store.updateField(123, 'age', 31);
   * ```
   */
  updateField(id: EntityId, field: keyof T, value: any): void {
    this.actions.updateField(id, field, value);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
  }

  // ===== STATE MANAGEMENT =====

  /**
   * Retrieves the complete state of the store
   * 
   * @returns The complete EntityState object
   * 
   * @example
   * ```typescript
   * const state = store.getState();
   * console.log('Store state:', state);
   * ```
   */
  getState(): EntityState<T> {
    return this.getters.getState();
  }

  /**
   * Sets the complete state of the store
   * Useful for restoring from external sources or resetting the store
   * 
   * @param state - The complete EntityState object to set
   * 
   * @example
   * ```typescript
   * const savedState = loadStateFromLocalStorage();
   * store.setState(savedState);
   * ```
   */
  setState(state: EntityState<T>): void {
    this.getters.updateState(state);
    this.actions.setState(state);
    // Sync the state back to the adapter
    this.syncStateToAdapter();
  }

  /**
   * Resets the store to its initial empty state
   * 
   * @example
   * ```typescript
   * store.resetState();
   * // Store is now empty
   * ```
   */
  resetState(): void {
    this.actions.resetState();
    // Sync the state back to the adapter
    this.syncStateToAdapter();
  }

  // ===== UTILITY METHODS =====

  /**
   * Retrieves the configuration of the store
   * 
   * @returns The StoreConfig object
   * 
   * @example
   * ```typescript
   * const config = store.getConfig();
   * console.log('Store name:', config.name);
   * console.log('Adapter type:', config.adapter);
   * ```
   */
  getConfig(): StoreConfig {
    return this.config;
  }

  /**
   * Retrieves the adapter instance used by this store
   * 
   * @returns The StoreAdapter instance
   * 
   * @example
   * ```typescript
   * const adapter = store.getAdapter();
   * console.log('Adapter type:', adapter.constructor.name);
   * ```
   */
  getAdapter(): StoreAdapter<T> {
    return this.adapter;
  }

  /**
   * Checks if the store is properly configured
   * 
   * @returns true if the store has valid config and adapter, false otherwise
   * 
   * @example
   * ```typescript
   * if (store.isConfigured()) {
   *   console.log('Store is ready to use');
   * else {
   *   console.log('Store is not properly configured');
   * }
   * ```
   */
  isConfigured(): boolean {
    return this.config !== null && this.adapter !== null;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Synchronizes the current state from getters and actions back to the adapter
   * This ensures that the adapter's state is always up to date
   */
  private syncStateToAdapter(): void {
    const currentState = this.getters.getState();
    this.adapter.setState(currentState);
  }
}
