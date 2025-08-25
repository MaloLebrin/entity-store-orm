import { beforeEach, describe, expect, test } from 'vitest';
import type { Entity, EntityState, StoreAdapter, StoreConfig } from '../types/index.js';
import { EntityStore } from './EntityStore.js';

// Interface de test
interface User extends Entity {
  name: string;
  email: string;
  age: number;
}

// Mock adapter pour les tests
class MockAdapter implements StoreAdapter<User> {
  private state: EntityState<User> = {
    entities: {
      byId: {},
      allIds: [],
      current: null,
      active: []
    }
  };
  private nextId = 1;

  // Getters
  getOne(id: string | number): User | null {
    return this.state.entities.byId[id] || null;
  }

  getMany(ids: (string | number)[]): User[] {
    return ids.map(id => this.getOne(id)).filter(Boolean) as User[];
  }

  getAll(): Record<string | number, User> {
    return this.state.entities.byId;
  }

  getAllArray(): User[] {
    return Object.values(this.state.entities.byId);
  }

  getAllIds(): (string | number)[] {
    return this.state.entities.allIds;
  }

  getMissingIds(ids: (string | number)[]): (string | number)[] {
    return ids.filter(id => !this.isAlreadyInStore(id));
  }

  getMissingEntities(entities: User[]): User[] {
    return entities.filter(entity => !this.isAlreadyInStore(entity.id));
  }

  getWhere(filter: (entity: User) => boolean): Record<string | number, User> {
    const result: Record<string | number, User> = {};
    Object.values(this.state.entities.byId).forEach(entity => {
      if (filter(entity)) {
        result[entity.id] = entity;
      }
    });
    return result;
  }

  getWhereArray(filter: (entity: User) => boolean): User[] {
    return Object.values(this.state.entities.byId).filter(filter);
  }

  getIsEmpty(): boolean {
    return this.state.entities.allIds.length === 0;
  }

  getIsNotEmpty(): boolean {
    return this.state.entities.allIds.length > 0;
  }

  getCurrent(): User | null {
    return this.state.entities.current;
  }

  getActive(): User[] {
    return this.state.entities.active.map(id => this.getOne(id)).filter(Boolean) as User[];
  }

  getFirstActive(): User | null {
    return this.state.entities.active.length > 0 ? this.getOne(this.state.entities.active[0]) : null;
  }

  isAlreadyInStore(id: string | number): boolean {
    return id in this.state.entities.byId;
  }

  isAlreadyActive(id: string | number): boolean {
    return this.state.entities.active.includes(id);
  }

  isDirty(id: string | number): boolean {
    const entity = this.getOne(id);
    return entity ? (entity as any).$isDirty === true : false;
  }

  // Actions
  createOne(entity: Omit<User, 'id'>): User {
    const id = this.nextId++;
    const newEntity = { ...entity, id } as User;
    this.state.entities.byId[id] = newEntity;
    this.state.entities.allIds.push(id);
    return newEntity;
  }

  createMany(entities: Omit<User, 'id'>[]): User[] {
    return entities.map(entity => this.createOne(entity));
  }

  setCurrent(entity: User | null): void {
    this.state.entities.current = entity;
  }

  removeCurrent(): void {
    this.state.entities.current = null;
  }

  updateOne(entity: User): User {
    this.state.entities.byId[entity.id] = entity;
    return entity;
  }

  updateMany(entities: User[]): User[] {
    return entities.map(entity => this.updateOne(entity));
  }

  deleteOne(id: string | number): boolean {
    if (this.isAlreadyInStore(id)) {
      delete this.state.entities.byId[id];
      this.state.entities.allIds = this.state.entities.allIds.filter(storeId => storeId !== id);
      return true;
    }
    return false;
  }

  deleteMany(ids: (string | number)[]): boolean {
    return ids.every(id => this.deleteOne(id));
  }

  setActive(id: string | number): void {
    if (!this.isAlreadyActive(id)) {
      this.state.entities.active.push(id);
    }
  }

  resetActive(): void {
    this.state.entities.active = [];
  }

  setIsDirty(id: string | number): void {
    const entity = this.getOne(id);
    if (entity) {
      (entity as any).$isDirty = true;
    }
  }

  setIsNotDirty(id: string | number): void {
    const entity = this.getOne(id);
    if (entity) {
      (entity as any).$isDirty = false;
    }
  }

  updateField(id: string | number, field: keyof User, value: any): void {
    const entity = this.getOne(id);
    if (entity) {
      (entity as any)[field] = value;
    }
  }

  // State management
  getState(): EntityState<User> {
    return this.state;
  }

  setState(state: EntityState<User>): void {
    this.state = state;
  }

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
  }
}

describe('EntityStore', () => {
  let store: EntityStore<User>;
  let adapter: MockAdapter;
  let config: StoreConfig;

  beforeEach(() => {
    adapter = new MockAdapter();
    config = { name: 'user', adapter: 'mock' };
    store = new EntityStore(config, adapter);
  });

  describe('Constructor', () => {
    test('should create store with config and adapter', () => {
      expect(store).toBeInstanceOf(EntityStore);
      expect(store.getConfig()).toBe(config);
      expect(store.getAdapter()).toBe(adapter);
      expect(store.isConfigured()).toBe(true);
    });
  });

  describe('Getters', () => {
    test('should get one entity', () => {
      const user = store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const found = store.getOne(user.id);
      expect(found).toEqual(user);
    });

    test('should get many entities', () => {
      const user1 = store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const user2 = store.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      const found = store.getMany([user1.id, user2.id]);
      expect(found).toHaveLength(2);
      expect(found).toContainEqual(user1);
      expect(found).toContainEqual(user2);
    });

    test('should get all entities', () => {
      store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      store.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      
      expect(store.getIsEmpty()).toBe(false);
      expect(store.getIsNotEmpty()).toBe(true);
      expect(store.getAllArray()).toHaveLength(2);
    });

    test('should filter entities', () => {
      store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      store.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      
      const adults = store.getWhereArray(user => user.age >= 18);
      expect(adults).toHaveLength(2);
      
      const johns = store.getWhereArray(user => user.name === 'John');
      expect(johns).toHaveLength(1);
    });
  });

  describe('Actions', () => {
    test('should create entity', () => {
      const user = store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      expect(user.id).toBeDefined();
      expect(user.name).toBe('John');
      expect(store.isAlreadyInStore(user.id)).toBe(true);
    });

    test('should update entity', () => {
      const user = store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const updated = store.updateOne({ ...user, age: 31 });
      expect(updated.age).toBe(31);
    });

    test('should delete entity', () => {
      const user = store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      expect(store.deleteOne(user.id)).toBe(true);
      expect(store.isAlreadyInStore(user.id)).toBe(false);
    });

    test('should manage current entity', () => {
      const user = store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      store.setCurrent(user);
      expect(store.getCurrent()).toEqual(user);
      
      store.removeCurrent();
      expect(store.getCurrent()).toBeNull();
    });

    test('should manage active entities', () => {
      const user = store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      store.setActive(user.id);
      expect(store.isAlreadyActive(user.id)).toBe(true);
      expect(store.getActive()).toHaveLength(1);
      
      store.resetActive();
      expect(store.getActive()).toHaveLength(0);
    });
  });

  describe('State Management', () => {
    test('should get and set state', () => {
      const initialState = store.getState();
      expect(initialState.entities.byId).toEqual({});
      
      store.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const newState = store.getState();
      expect(newState.entities.allIds).toHaveLength(1);
      
      store.resetState();
      expect(store.getIsEmpty()).toBe(true);
    });
  });
});
