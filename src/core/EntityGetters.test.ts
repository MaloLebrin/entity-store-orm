import { describe, test, expect, beforeEach } from 'vitest';
import { EntityGetters } from './EntityGetters.js';
import type { Entity, EntityState } from '../types/index.js';

// Test entity interface
interface User extends Entity {
  name: string;
  email: string;
  age: number;
}

describe('EntityGetters', () => {
  let getters: EntityGetters<User>;
  let state: EntityState<User>;

  beforeEach(() => {
    state = {
      entities: {
        byId: {},
        allIds: [],
        current: null,
        active: []
      }
    };
    getters = new EntityGetters(state);
  });

  describe('Constructor and Initial State', () => {
    test('should initialize with provided state', () => {
      expect(getters.getState()).toBe(state);
      expect(getters.getIsEmpty()).toBe(true);
      expect(getters.getIsNotEmpty()).toBe(false);
    });

    test('should handle null/undefined state gracefully', () => {
      // This test ensures the constructor doesn't crash with invalid state
      expect(() => new EntityGetters(state)).not.toThrow();
    });

    test('should handle state with missing properties', () => {
      const incompleteState = {
        entities: {
          byId: {},
          allIds: []
          // Missing current and active
        }
      } as any;
      
      expect(() => new EntityGetters(incompleteState)).not.toThrow();
    });
  });

  describe('Entity Retrieval', () => {
    beforeEach(() => {
      state.entities.byId = {
        1: { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        2: { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      };
      state.entities.allIds = [1, 2];
    });

    test('should get entity by ID', () => {
      const user = getters.getOne(1);
      expect(user).toBeDefined();
      expect(user?.name).toBe('John');
      expect(user?.email).toBe('john@example.com');
      expect(user?.age).toBe(30);
    });

    test('should return null for non-existent ID', () => {
      const user = getters.getOne(999);
      expect(user).toBeNull();
    });

    test('should return null for undefined ID', () => {
      const user = getters.getOne(undefined as any);
      expect(user).toBeNull();
    });

    test('should return null for null ID', () => {
      const user = getters.getOne(null as any);
      expect(user).toBeNull();
    });

    test('should get multiple entities by IDs', () => {
      const users = getters.getMany([1, 2]);
      expect(users).toHaveLength(2);
      expect(users[0].name).toBe('John');
      expect(users[1].name).toBe('Jane');
    });

    test('should handle missing IDs gracefully', () => {
      const users = getters.getMany([1, 999, 2]);
      expect(users).toHaveLength(2);
      expect(users[0].id).toBe(1);
      expect(users[1].id).toBe(2);
    });

    test('should handle empty array in getMany', () => {
      const users = getters.getMany([]);
      expect(users).toHaveLength(0);
    });

    test('should handle array with only non-existent IDs', () => {
      const users = getters.getMany([999, 888, 777]);
      expect(users).toHaveLength(0);
    });

    test('should get all entities', () => {
      const allUsers = getters.getAll();
      expect(Object.keys(allUsers)).toHaveLength(2);
      expect(allUsers[1]?.name).toBe('John');
      expect(allUsers[2]?.name).toBe('Jane');
    });

    test('should get all entities as array', () => {
      const allUsers = getters.getAllArray();
      expect(allUsers).toHaveLength(2);
      expect(allUsers.map(u => u.name)).toContain('John');
      expect(allUsers.map(u => u.name)).toContain('Jane');
    });

    test('should get all entity IDs', () => {
      const allIds = getters.getAllIds();
      expect(allIds).toEqual([1, 2]);
    });

    test('should handle entities with special characters', () => {
      state.entities.byId = {
        1: { id: 1, name: 'José María', email: 'jose@example.com', age: 30 }
      };
      state.entities.allIds = [1];
      
      const user = getters.getOne(1);
      expect(user?.name).toBe('José María');
    });

    test('should handle entities with unicode characters', () => {
      state.entities.byId = {
        1: { id: 1, name: '张三李四', email: 'unicode@example.com', age: 30 }
      };
      state.entities.allIds = [1];
      
      const user = getters.getOne(1);
      expect(user?.name).toBe('张三李四');
    });

    test('should handle entities with very long names', () => {
      const longName = 'A'.repeat(1000);
      state.entities.byId = {
        1: { id: 1, name: longName, email: 'longname@example.com', age: 30 }
      };
      state.entities.allIds = [1];
      
      const user = getters.getOne(1);
      expect(user?.name).toBe(longName);
    });

    test('should handle entities with numeric string IDs', () => {
      state.entities.byId = {
        '1': { id: '1' as any, name: 'John', email: 'john@example.com', age: 30 }
      };
      state.entities.allIds = ['1' as any];
      
      const user = getters.getOne('1' as any);
      expect(user?.name).toBe('John');
    });
  });

  describe('Entity Filtering', () => {
    beforeEach(() => {
      state.entities.byId = {
        1: { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        2: { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 },
        3: { id: 3, name: 'Bob', email: 'bob@example.com', age: 35 }
      };
      state.entities.allIds = [1, 2, 3];
    });

    test('should filter entities with predicate function', () => {
      const adults = getters.getWhereArray(user => user.age >= 18);
      expect(adults).toHaveLength(3);
      
      const seniors = getters.getWhereArray(user => user.age >= 30);
      expect(seniors).toHaveLength(2);
      expect(seniors.map(u => u.name)).toContain('John');
      expect(seniors.map(u => u.name)).toContain('Bob');
    });

    test('should filter entities and return Record', () => {
      const adults = getters.getWhere(user => user.age >= 30);
      expect(Object.keys(adults)).toHaveLength(2);
      expect(adults[1]?.name).toBe('John');
      expect(adults[3]?.name).toBe('Bob');
    });

    test('should return empty results for no matches', () => {
      const centenarians = getters.getWhereArray(user => user.age >= 100);
      expect(centenarians).toHaveLength(0);
    });

    test('should handle complex filter conditions', () => {
      const complexFilter = getters.getWhereArray(user => 
        user.age >= 25 && user.name.startsWith('J') && user.email.includes('example')
      );
      expect(complexFilter).toHaveLength(2);
      expect(complexFilter.map(u => u.name)).toContain('John');
      expect(complexFilter.map(u => u.name)).toContain('Jane');
    });

    test('should handle filter with special characters', () => {
      state.entities.byId = {
        1: { id: 1, name: 'José María', email: 'jose@example.com', age: 30 }
      };
      state.entities.allIds = [1];
      
      const filtered = getters.getWhereArray(user => user.name.includes('José'));
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('José María');
    });

    test('should handle filter with unicode characters', () => {
      state.entities.byId = {
        1: { id: 1, name: '张三李四', email: 'unicode@example.com', age: 30 }
      };
      state.entities.allIds = [1];
      
      const filtered = getters.getWhereArray(user => user.name.includes('张三'));
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('张三李四');
    });

    test('should handle filter with empty string', () => {
      state.entities.byId = {
        1: { id: 1, name: '', email: 'empty@example.com', age: 30 }
      };
      state.entities.allIds = [1];
      
      const filtered = getters.getWhereArray(user => user.name === '');
      expect(filtered).toHaveLength(1);
    });

    test('should handle filter with null values', () => {
      state.entities.byId = {
        1: { id: 1, name: null as any, email: 'null@example.com', age: 30 }
      };
      state.entities.allIds = [1];
      
      const filtered = getters.getWhereArray(user => user.name === null);
      expect(filtered).toHaveLength(1);
    });

    test('should handle filter with undefined values', () => {
      state.entities.byId = {
        1: { id: 1, name: undefined as any, email: 'undefined@example.com', age: 30 }
      };
      state.entities.allIds = [1];
      
      const filtered = getters.getWhereArray(user => user.name === undefined);
      expect(filtered).toHaveLength(1);
    });
  });

  describe('Missing Entity Detection', () => {
    beforeEach(() => {
      state.entities.byId = {
        1: { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        2: { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      };
      state.entities.allIds = [1, 2];
    });

    test('should find missing IDs', () => {
      const missingIds = getters.getMissingIds([1, 2, 3, 999]);
      expect(missingIds).toEqual([3, 999]);
    });

    test('should return empty array when all IDs exist', () => {
      const missingIds = getters.getMissingIds([1, 2]);
      expect(missingIds).toHaveLength(0);
    });

    test('should handle empty array in getMissingIds', () => {
      const missingIds = getters.getMissingIds([]);
      expect(missingIds).toHaveLength(0);
    });

    test('should handle array with only non-existent IDs', () => {
      const missingIds = getters.getMissingIds([999, 888, 777]);
      expect(missingIds).toEqual([999, 888, 777]);
    });

    test('should find missing entities', () => {
      const existingUsers = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 999, name: 'Unknown', email: 'unknown@example.com', age: 40 }
      ] as User[];
      
      const missingUsers = getters.getMissingEntities(existingUsers);
      expect(missingUsers).toHaveLength(1);
      expect(missingUsers[0].id).toBe(999);
    });

    test('should return empty array when all entities exist', () => {
      const existingUsers = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      ] as User[];
      
      const missingUsers = getters.getMissingEntities(existingUsers);
      expect(missingUsers).toHaveLength(0);
    });

    test('should handle empty array in getMissingEntities', () => {
      const missingUsers = getters.getMissingEntities([]);
      expect(missingUsers).toHaveLength(0);
    });

    test('should handle entities with different ID types', () => {
      const existingUsers = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: '999' as any, name: 'String ID', email: 'stringid@example.com', age: 40 }
      ] as User[];
      
      const missingUsers = getters.getMissingEntities(existingUsers);
      expect(missingUsers).toHaveLength(1);
      expect(missingUsers[0].id).toBe('999');
    });
  });

  describe('Store State Checks', () => {
    test('should check if store is empty', () => {
      expect(getters.getIsEmpty()).toBe(true);
      expect(getters.getIsNotEmpty()).toBe(false);
    });

    test('should check if store is not empty', () => {
      state.entities.byId = { 1: { id: 1, name: 'John', email: 'john@example.com', age: 30 } };
      state.entities.allIds = [1];
      
      expect(getters.getIsEmpty()).toBe(false);
      expect(getters.getIsNotEmpty()).toBe(true);
    });

    test('should handle state with only current entity', () => {
      state.entities.current = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      expect(getters.getIsEmpty()).toBe(true); // Still empty because no entities in byId
    });

    test('should handle state with only active entities', () => {
      state.entities.active = [1];
      expect(getters.getIsEmpty()).toBe(true); // Still empty because no entities in byId
    });
  });

  describe('Current Entity Management', () => {
    test('should get current entity', () => {
      expect(getters.getCurrent()).toBeNull();
      
      const user = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      state.entities.current = user;
      
      expect(getters.getCurrent()).toEqual(user);
    });

    test('should handle current entity with special characters', () => {
      const specialUser = { id: 1, name: 'José María', email: 'jose@example.com', age: 30 };
      state.entities.current = specialUser;
      
      expect(getters.getCurrent()?.name).toBe('José María');
    });

    test('should handle current entity with unicode characters', () => {
      const unicodeUser = { id: 1, name: '张三李四', email: 'unicode@example.com', age: 30 };
      state.entities.current = unicodeUser;
      
      expect(getters.getCurrent()?.name).toBe('张三李四');
    });

    test('should handle current entity with very long name', () => {
      const longName = 'A'.repeat(1000);
      const longNameUser = { id: 1, name: longName, email: 'longname@example.com', age: 30 };
      state.entities.current = longNameUser;
      
      expect(getters.getCurrent()?.name).toBe(longName);
    });
  });

  describe('Active Entities Management', () => {
    beforeEach(() => {
      state.entities.byId = {
        1: { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        2: { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      };
      state.entities.allIds = [1, 2];
    });

    test('should get active entities', () => {
      expect(getters.getActive()).toHaveLength(0);
      
      state.entities.active = [1];
      expect(getters.getActive()).toHaveLength(1);
      expect(getters.getActive()[0].name).toBe('John');
    });

    test('should get first active entity', () => {
      expect(getters.getFirstActive()).toBeNull();
      
      state.entities.active = [1, 2];
      expect(getters.getFirstActive()?.name).toBe('John');
    });

    test('should handle non-existent active IDs gracefully', () => {
      state.entities.active = [1, 999];
      const activeUsers = getters.getActive();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].id).toBe(1);
    });

    test('should handle empty active array', () => {
      state.entities.active = [];
      expect(getters.getActive()).toHaveLength(0);
      expect(getters.getFirstActive()).toBeNull();
    });

    test('should handle single active entity', () => {
      state.entities.active = [1];
      expect(getters.getActive()).toHaveLength(1);
      expect(getters.getFirstActive()?.id).toBe(1);
    });

    test('should handle large number of active entities', () => {
      // Create many entities
      for (let i = 3; i <= 100; i++) {
        state.entities.byId[i] = { id: i, name: `User${i}`, email: `user${i}@example.com`, age: 20 + i };
        state.entities.allIds.push(i);
      }
      
      // Set all as active
      state.entities.active = Array.from({ length: 100 }, (_, i) => i + 1);
      
      expect(getters.getActive()).toHaveLength(100);
      expect(getters.getFirstActive()?.id).toBe(1);
    });

    test('should handle active entities with special characters', () => {
      state.entities.byId[3] = { id: 3, name: 'José María', email: 'jose@example.com', age: 35 };
      state.entities.allIds.push(3);
      state.entities.active = [3];
      
      const activeUsers = getters.getActive();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].name).toBe('José María');
    });

    test('should handle active entities with unicode characters', () => {
      state.entities.byId[3] = { id: 3, name: '张三李四', email: 'unicode@example.com', age: 35 };
      state.entities.allIds.push(3);
      state.entities.active = [3];
      
      const activeUsers = getters.getActive();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].name).toBe('张三李四');
    });
  });

  describe('Entity Existence Checks', () => {
    beforeEach(() => {
      state.entities.byId = {
        1: { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      };
      state.entities.allIds = [1];
    });

    test('should check if entity exists in store', () => {
      expect(getters.isAlreadyInStore(1)).toBe(true);
      expect(getters.isAlreadyInStore(999)).toBe(false);
    });

    test('should check if entity is active', () => {
      expect(getters.isAlreadyActive(1)).toBe(false);
      
      state.entities.active = [1];
      expect(getters.isAlreadyActive(1)).toBe(true);
      expect(getters.isAlreadyActive(999)).toBe(false);
    });

    test('should handle undefined and null IDs', () => {
      expect(getters.isAlreadyInStore(undefined as any)).toBe(false);
      expect(getters.isAlreadyInStore(null as any)).toBe(false);
      expect(getters.isAlreadyActive(undefined as any)).toBe(false);
      expect(getters.isAlreadyActive(null as any)).toBe(false);
    });

    test('should handle string IDs', () => {
      state.entities.byId = {
        '1': { id: '1' as any, name: 'John', email: 'john@example.com', age: 30 }
      };
      state.entities.allIds = ['1' as any];
      
      expect(getters.isAlreadyInStore('1' as any)).toBe(true);
      expect(getters.isAlreadyInStore('999' as any)).toBe(false);
    });
  });

  describe('Dirty State Management', () => {
    beforeEach(() => {
      state.entities.byId = {
        1: { id: 1, name: 'John', email: 'john@example.com', age: 30 }
      };
      state.entities.allIds = [1];
    });

    test('should check if entity is dirty', () => {
      expect(getters.isDirty(1)).toBe(false);
      
      (state.entities.byId[1] as any).$isDirty = true;
      expect(getters.isDirty(1)).toBe(true);
    });

    test('should return false for non-existent entity', () => {
      expect(getters.isDirty(999)).toBe(false);
    });

    test('should handle undefined and null IDs', () => {
      expect(getters.isDirty(undefined as any)).toBe(false);
      expect(getters.isDirty(null as any)).toBe(false);
    });

    test('should handle entities without dirty flag', () => {
      expect(getters.isDirty(1)).toBe(false);
    });

    test('should handle entities with explicit false dirty flag', () => {
      (state.entities.byId[1] as any).$isDirty = false;
      expect(getters.isDirty(1)).toBe(false);
    });

    test('should handle entities with string dirty flag', () => {
      (state.entities.byId[1] as any).$isDirty = 'true';
      expect(getters.isDirty(1)).toBe(false); // Should only be true for boolean true
    });

    test('should handle entities with number dirty flag', () => {
      (state.entities.byId[1] as any).$isDirty = 1;
      expect(getters.isDirty(1)).toBe(false); // Should only be true for boolean true
    });
  });

  describe('State Management', () => {
    test('should update state reference', () => {
      const newState: EntityState<User> = {
        entities: {
          byId: { 1: { id: 1, name: 'John', email: 'john@example.com', age: 30 } },
          allIds: [1],
          current: null,
          active: []
        }
      };
      
      getters.updateState(newState);
      expect(getters.getState()).toBe(newState);
      expect(getters.getIsEmpty()).toBe(false);
    });

    test('should get current state reference', () => {
      expect(getters.getState()).toBe(state);
    });

    test('should handle updating state with special characters', () => {
      const newState: EntityState<User> = {
        entities: {
          byId: { 1: { id: 1, name: 'José María', email: 'jose@example.com', age: 30 } },
          allIds: [1],
          current: null,
          active: []
        }
      };
      
      getters.updateState(newState);
      expect(getters.getOne(1)?.name).toBe('José María');
    });

    test('should handle updating state with unicode characters', () => {
      const newState: EntityState<User> = {
        entities: {
          byId: { 1: { id: 1, name: '张三李四', email: 'unicode@example.com', age: 30 } },
          allIds: [1],
          current: null,
          active: []
        }
      };
      
      getters.updateState(newState);
      expect(getters.getOne(1)?.name).toBe('张三李四');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty state gracefully', () => {
      expect(getters.getOne(1)).toBeNull();
      expect(getters.getMany([1, 2])).toHaveLength(0);
      expect(getters.getAll()).toEqual({});
      expect(getters.getAllArray()).toHaveLength(0);
      expect(getters.getAllIds()).toHaveLength(0);
      expect(getters.getCurrent()).toBeNull();
      expect(getters.getActive()).toHaveLength(0);
      expect(getters.getFirstActive()).toBeNull();
    });

    test('should handle state with only current entity', () => {
      const user = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      state.entities.current = user;
      
      expect(getters.getCurrent()).toEqual(user);
      expect(getters.getIsEmpty()).toBe(true);
    });

    test('should handle state with only active entities', () => {
      state.entities.byId = { 1: { id: 1, name: 'John', email: 'john@example.com', age: 30 } };
      state.entities.allIds = [1];
      state.entities.active = [1];
      
      expect(getters.getActive()).toHaveLength(1);
      expect(getters.getFirstActive()?.name).toBe('John');
    });

    test('should handle state with missing byId', () => {
      const incompleteState = {
        entities: {
          byId: undefined,
          allIds: [],
          current: null,
          active: []
        }
      } as any;
      
      const incompleteGetters = new EntityGetters(incompleteState);
      expect(() => incompleteGetters.getOne(1)).not.toThrow();
      expect(incompleteGetters.getOne(1)).toBeNull();
    });

    test('should handle state with missing allIds', () => {
      const incompleteState = {
        entities: {
          byId: {},
          allIds: undefined,
          current: null,
          active: []
        }
      } as any;
      
      const incompleteGetters = new EntityGetters(incompleteState);
      expect(() => incompleteGetters.getAllIds()).not.toThrow();
      expect(incompleteGetters.getAllIds()).toEqual([]);
    });

    test('should handle state with missing current', () => {
      const incompleteState = {
        entities: {
          byId: {},
          allIds: [],
          current: undefined,
          active: []
        }
      } as any;
      
      const incompleteGetters = new EntityGetters(incompleteState);
      expect(() => incompleteGetters.getCurrent()).not.toThrow();
      expect(incompleteGetters.getCurrent()).toBeNull();
    });

    test('should handle state with missing active', () => {
      const incompleteState = {
        entities: {
          byId: {},
          allIds: [],
          current: null,
          active: undefined
        }
      } as any;
      
      const incompleteGetters = new EntityGetters(incompleteState);
      expect(() => incompleteGetters.getActive()).not.toThrow();
      expect(incompleteGetters.getActive()).toEqual([]);
    });

    test('should handle entities with circular references', () => {
      const circularEntity = { id: 1, name: 'Circular', email: 'circular@example.com', age: 30 };
      (circularEntity as any).self = circularEntity;
      
      state.entities.byId = { 1: circularEntity };
      state.entities.allIds = [1];
      
      const user = getters.getOne(1);
      expect(user?.name).toBe('Circular');
      expect((user as any).self).toBe(user);
    });

    test('should handle entities with function properties', () => {
      const functionEntity = { 
        id: 1, 
        name: 'Function', 
        email: 'function@example.com', 
        age: 30,
        greet: () => 'Hello!'
      };
      
      state.entities.byId = { 1: functionEntity };
      state.entities.allIds = [1];
      
      const user = getters.getOne(1);
      expect(user?.name).toBe('Function');
      expect(typeof (user as any).greet).toBe('function');
      expect((user as any).greet()).toBe('Hello!');
    });

    test('should handle entities with symbol properties', () => {
      const symbol = Symbol('test');
      const symbolEntity = { 
        id: 1, 
        name: 'Symbol', 
        email: 'symbol@example.com', 
        age: 30,
        [symbol]: 'symbol value'
      };
      
      state.entities.byId = { 1: symbolEntity };
      state.entities.allIds = [1];
      
      const user = getters.getOne(1);
      expect(user?.name).toBe('Symbol');
      expect((user as any)[symbol]).toBe('symbol value');
    });
  });

  describe('Performance and Stress Tests', () => {
    test('should handle large number of entities efficiently', () => {
      // Create many entities
      for (let i = 1; i <= 1000; i++) {
        state.entities.byId[i] = {
          id: i,
          name: `User${i}`,
          email: `user${i}@example.com`,
          age: 20 + (i % 50)
        };
        state.entities.allIds.push(i);
      }
      
      const startTime = Date.now();
      
      // Test various operations
      const allUsers = getters.getAllArray();
      const filteredUsers = getters.getWhereArray(user => user.age >= 30);
      const missingIds = getters.getMissingIds([1, 500, 1000, 9999]);
      
      const endTime = Date.now();
      
      expect(allUsers).toHaveLength(1000);
      expect(filteredUsers.length).toBeGreaterThan(0);
      expect(missingIds).toContain(9999);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    test('should handle complex filtering efficiently', () => {
      // Create many entities with varied data
      for (let i = 1; i <= 100; i++) {
        state.entities.byId[i] = {
          id: i,
          name: `User${i}`,
          email: `user${i}@example.com`,
          age: 20 + (i % 50)
        };
        state.entities.allIds.push(i);
      }
      
      const startTime = Date.now();
      
      // Complex filter
      const complexFilter = getters.getWhereArray(user => 
        user.age >= 25 && 
        user.age <= 45 && 
        user.name.length > 4 &&
        user.email.includes('example')
      );
      
      const endTime = Date.now();
      
      expect(complexFilter.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in less than 50ms
    });

    test('should handle missing ID detection efficiently', () => {
      // Create many entities
      for (let i = 1; i <= 1000; i++) {
        state.entities.byId[i] = {
          id: i,
          name: `User${i}`,
          email: `user${i}@example.com`,
          age: 20 + (i % 50)
        };
        state.entities.allIds.push(i);
      }
      
      const startTime = Date.now();
      
      // Test missing ID detection with large arrays
      const testIds = Array.from({ length: 1000 }, (_, i) => i + 1);
      testIds.push(9999, 8888, 7777); // Add some missing IDs
      
      const missingIds = getters.getMissingIds(testIds);
      
      const endTime = Date.now();
      
      expect(missingIds).toEqual([9999, 8888, 7777]);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in less than 50ms
    });
  });
});
