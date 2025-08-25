import { beforeEach, describe, expect, test } from 'vitest';
import type { Entity, EntityState } from '../types/index.js';
import { BaseAdapter } from './BaseAdapter.js';

// Test entity interface
interface User extends Entity {
  name: string;
  email: string;
  age: number;
}

// Concrete implementation of BaseAdapter for testing
class TestAdapter extends BaseAdapter<User> {
  // Override specific methods for testing if needed
  protected override onEntityCreated(entity: User): void {
    // Custom behavior for testing
  }
}

describe('BaseAdapter', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter();
  });

  describe('Constructor and Initial State', () => {
    test('should initialize with empty state', () => {
      expect(adapter.getIsEmpty()).toBe(true);
      expect(adapter.getIsNotEmpty()).toBe(false);
      expect(adapter.getAllArray()).toHaveLength(0);
      expect(adapter.getAllIds()).toHaveLength(0);
      expect(adapter.getCurrent()).toBeNull();
      expect(adapter.getActive()).toHaveLength(0);
    });
  });

  describe('Entity Creation', () => {
    test('should create single entity', () => {
      const user = adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      
      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');
      expect(user.age).toBe(30);
      expect(adapter.isAlreadyInStore(user.id)).toBe(true);
      expect(adapter.getIsEmpty()).toBe(false);
    });

    test('should create multiple entities with sequential IDs', () => {
      const user1 = adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const user2 = adapter.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      
      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
      expect(adapter.getAllArray()).toHaveLength(2);
      expect(adapter.getAllIds()).toEqual([1, 2]);
    });

    test('should create many entities at once', () => {
      const users = adapter.createMany([
        { name: 'John', email: 'john@example.com', age: 30 },
        { name: 'Jane', email: 'jane@example.com', age: 25 }
      ]);
      
      expect(users).toHaveLength(2);
      expect(users[0].id).toBe(1);
      expect(users[1].id).toBe(2);
      expect(adapter.getAllArray()).toHaveLength(2);
    });
  });

  describe('Entity Retrieval', () => {
    beforeEach(() => {
      adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      adapter.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
    });

    test('should get entity by ID', () => {
      const user = adapter.getOne(1);
      expect(user).toBeDefined();
      expect(user?.name).toBe('John');
    });

    test('should return null for non-existent ID', () => {
      const user = adapter.getOne(999);
      expect(user).toBeNull();
    });

    test('should get multiple entities by IDs', () => {
      const users = adapter.getMany([1, 2]);
      expect(users).toHaveLength(2);
      expect(users[0].name).toBe('John');
      expect(users[1].name).toBe('Jane');
    });

    test('should handle missing IDs gracefully', () => {
      const users = adapter.getMany([1, 999, 2]);
      expect(users).toHaveLength(2);
      expect(users[0].id).toBe(1);
      expect(users[1].id).toBe(2);
    });

    test('should get all entities', () => {
      const allUsers = adapter.getAll();
      expect(Object.keys(allUsers)).toHaveLength(2);
      expect(allUsers[1]?.name).toBe('John');
      expect(allUsers[2]?.name).toBe('Jane');
    });

    test('should get all entities as array', () => {
      const allUsers = adapter.getAllArray();
      expect(allUsers).toHaveLength(2);
      expect(allUsers.map(u => u.name)).toContain('John');
      expect(allUsers.map(u => u.name)).toContain('Jane');
    });
  });

  describe('Entity Filtering', () => {
    beforeEach(() => {
      adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      adapter.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      adapter.createOne({ name: 'Bob', email: 'bob@example.com', age: 35 });
    });

    test('should filter entities with predicate function', () => {
      const adults = adapter.getWhereArray(user => user.age >= 18);
      expect(adults).toHaveLength(3);
      
      const seniors = adapter.getWhereArray(user => user.age >= 30);
      expect(seniors).toHaveLength(2);
      expect(seniors.map(u => u.name)).toContain('John');
      expect(seniors.map(u => u.name)).toContain('Bob');
    });

    test('should filter entities and return Record', () => {
      const adults = adapter.getWhere(user => user.age >= 30);
      expect(Object.keys(adults)).toHaveLength(2);
      expect(adults[1]?.name).toBe('John');
      expect(adults[3]?.name).toBe('Bob');
    });

    test('should find missing IDs', () => {
      const missingIds = adapter.getMissingIds([1, 2, 3, 999]);
      expect(missingIds).toEqual([999]);
    });

    test('should find missing entities', () => {
      const existingUsers = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 999, name: 'Unknown', email: 'unknown@example.com', age: 40 }
      ] as User[];
      
      const missingUsers = adapter.getMissingEntities(existingUsers);
      expect(missingUsers).toHaveLength(1);
      expect(missingUsers[0].id).toBe(999);
    });
  });

  describe('Entity Updates', () => {
    let user: User;

    beforeEach(() => {
      user = adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
    });

    test('should update entity', () => {
      const updatedUser = adapter.updateOne({ ...user, age: 31 });
      expect(updatedUser.age).toBe(31);
      
      const retrievedUser = adapter.getOne(user.id);
      expect(retrievedUser?.age).toBe(31);
    });

    test('should throw error when updating non-existent entity', () => {
      const nonExistentUser = { id: 999, name: 'Unknown', email: 'unknown@example.com', age: 40 };
      expect(() => adapter.updateOne(nonExistentUser)).toThrow('Entity with id 999 not found');
    });

    test('should update specific field', () => {
      adapter.updateField(user.id, 'age', 31);
      adapter.updateField(user.id, 'name', 'John Updated');
      
      const retrievedUser = adapter.getOne(user.id);
      expect(retrievedUser?.age).toBe(31);
      expect(retrievedUser?.name).toBe('John Updated');
    });

    test('should update multiple entities', () => {
      const user2 = adapter.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      
      const updatedUsers = adapter.updateMany([
        { ...user, age: 31 },
        { ...user2, age: 26 }
      ]);
      
      expect(updatedUsers[0].age).toBe(31);
      expect(updatedUsers[1].age).toBe(26);
    });
  });

  describe('Entity Deletion', () => {
    let user1: User;
    let user2: User;

    beforeEach(() => {
      user1 = adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      user2 = adapter.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
    });

    test('should delete single entity', () => {
      const result = adapter.deleteOne(user1.id);
      expect(result).toBe(true);
      expect(adapter.isAlreadyInStore(user1.id)).toBe(false);
      expect(adapter.getAllArray()).toHaveLength(1);
    });

    test('should return false when deleting non-existent entity', () => {
      const result = adapter.deleteOne(999);
      expect(result).toBe(false);
    });

    test('should delete multiple entities', () => {
      const result = adapter.deleteMany([user1.id, user2.id]);
      expect(result).toBe(true);
      expect(adapter.getIsEmpty()).toBe(true);
    });

    test('should handle partial deletion failure', () => {
      const result = adapter.deleteMany([user1.id, 999, user2.id]);
      expect(result).toBe(false);
      expect(adapter.getAllArray()).toHaveLength(1);
    });
  });

  describe('Current Entity Management', () => {
    let user: User;

    beforeEach(() => {
      user = adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
    });

    test('should set current entity', () => {
      adapter.setCurrent(user);
      expect(adapter.getCurrent()).toEqual(user);
    });

    test('should clear current entity', () => {
      adapter.setCurrent(user);
      adapter.removeCurrent();
      expect(adapter.getCurrent()).toBeNull();
    });

    test('should clear current entity when setting to null', () => {
      adapter.setCurrent(user);
      adapter.setCurrent(null);
      expect(adapter.getCurrent()).toBeNull();
    });
  });

  describe('Active Entities Management', () => {
    let user1: User;
    let user2: User;

    beforeEach(() => {
      user1 = adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      user2 = adapter.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
    });

    test('should set entity as active', () => {
      adapter.setActive(user1.id);
      expect(adapter.isAlreadyActive(user1.id)).toBe(true);
      expect(adapter.getActive()).toHaveLength(1);
      expect(adapter.getFirstActive()).toEqual(user1);
    });

    test('should not duplicate active entities', () => {
      adapter.setActive(user1.id);
      adapter.setActive(user1.id);
      expect(adapter.getActive()).toHaveLength(1);
    });

    test('should get multiple active entities', () => {
      adapter.setActive(user1.id);
      adapter.setActive(user2.id);
      expect(adapter.getActive()).toHaveLength(2);
      expect(adapter.getFirstActive()).toEqual(user1);
    });

    test('should reset active entities', () => {
      adapter.setActive(user1.id);
      adapter.setActive(user2.id);
      adapter.resetActive();
      expect(adapter.getActive()).toHaveLength(0);
      expect(adapter.getFirstActive()).toBeNull();
    });
  });

  describe('Dirty State Management', () => {
    let user: User;

    beforeEach(() => {
      user = adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
    });

    test('should mark entity as dirty', () => {
      adapter.setIsDirty(user.id);
      expect(adapter.isDirty(user.id)).toBe(true);
    });

    test('should mark entity as not dirty', () => {
      adapter.setIsDirty(user.id);
      adapter.setIsNotDirty(user.id);
      expect(adapter.isDirty(user.id)).toBe(false);
    });

    test('should return false for non-existent entity', () => {
      expect(adapter.isDirty(999)).toBe(false);
    });
  });

  describe('State Management', () => {
    let user: User;

    beforeEach(() => {
      user = adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
    });

    test('should get current state', () => {
      const state = adapter.getState();
      expect(state.entities.byId[user.id]).toEqual(user);
      expect(state.entities.allIds).toContain(user.id);
    });

    test('should set new state', () => {
      const newState: EntityState<User> = {
        entities: {
          byId: {},
          allIds: [],
          current: null,
          active: []
        }
      };
      
      adapter.setState(newState);
      expect(adapter.getIsEmpty()).toBe(true);
    });

    test('should reset state', () => {
      adapter.resetState();
      expect(adapter.getIsEmpty()).toBe(true);
      expect(adapter.getCurrent()).toBeNull();
      expect(adapter.getActive()).toHaveLength(0);
    });
  });

  describe('ID Generation', () => {
    test('should generate sequential IDs', () => {
      const user1 = adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const user2 = adapter.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      const user3 = adapter.createOne({ name: 'Bob', email: 'bob@example.com', age: 35 });
      
      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
      expect(user3.id).toBe(3);
    });

    test('should reset ID counter on state reset', () => {
      adapter.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      adapter.resetState();
      
      const newUser = adapter.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      expect(newUser.id).toBe(1);
    });
  });
});
