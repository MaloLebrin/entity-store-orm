import { describe, test, expect, beforeEach } from 'vitest';
import createGetters from './createGetters.js';
import createState from './createState.js';
import type { WithId } from '../types/WithId.js';

// Test entity interface
interface User extends WithId {
  name: string;
  email: string;
  age: number;
}

describe('createGetters', () => {
  let state: ReturnType<typeof createState<User>>;
  let getters: ReturnType<typeof createGetters<User>>;

  beforeEach(() => {
    state = createState<User>();
    getters = createGetters(state);
    
    // Add some test data
    const user1: User & { $isDirty: boolean } = { id: 1, name: 'John', email: 'john@example.com', age: 30, $isDirty: false };
    const user2: User & { $isDirty: boolean } = { id: 2, name: 'Jane', email: 'jane@example.com', age: 25, $isDirty: false };
    const user3: User & { $isDirty: boolean } = { id: 3, name: 'Bob', email: 'bob@example.com', age: 35, $isDirty: true };
    
    state.entities.byId[1] = user1;
    state.entities.byId[2] = user2;
    state.entities.byId[3] = user3;
    state.entities.allIds = [1, 2, 3];
    state.entities.current = user1;
    state.entities.currentById = 1;
    state.entities.active = [1, 2];
  });

  describe('findOneById (deprecated)', () => {
    test('should find entity by id', () => {
      const findOne = getters.findOneById();
      const user = findOne(1);
      
      expect(user).toBeDefined();
      expect(user?.name).toBe('John');
      expect(user?.id).toBe(1);
    });

    test('should return undefined for non-existent id', () => {
      const findOne = getters.findOneById();
      const user = findOne(999);
      
      expect(user).toBeUndefined();
    });
  });

  describe('findManyById (deprecated)', () => {
    test('should find multiple entities by ids', () => {
      const findMany = getters.findManyById();
      const users = findMany([1, 2]);
      
      expect(users).toHaveLength(2);
      expect(users[0]?.name).toBe('John');
      expect(users[1]?.name).toBe('Jane');
    });

    test('should filter out non-existent ids', () => {
      const findMany = getters.findManyById();
      const users = findMany([1, 999, 2]);
      
      expect(users).toHaveLength(2);
      expect(users[0]?.name).toBe('John');
      expect(users[1]?.name).toBe('Jane');
    });

    test('should return empty array for non-existent ids', () => {
      const findMany = getters.findManyById();
      const users = findMany([999, 888]);
      
      expect(users).toHaveLength(0);
    });
  });

  describe('getAll', () => {
    test('should return all entities as dictionary', () => {
      const all = getters.getAll();
      
      expect(all).toBeDefined();
      expect(Object.keys(all)).toHaveLength(3);
      expect(all[1]?.name).toBe('John');
      expect(all[2]?.name).toBe('Jane');
      expect(all[3]?.name).toBe('Bob');
    });

    test('should return empty object for empty state', () => {
      const emptyState = createState<User>();
      const emptyGetters = createGetters(emptyState);
      const all = emptyGetters.getAll();
      
      expect(all).toEqual({});
    });
  });

  describe('getAllArray', () => {
    test('should return all entities as array', () => {
      const all = getters.getAllArray();
      
      expect(Array.isArray(all)).toBe(true);
      expect(all).toHaveLength(3);
      expect(all.map(u => u.name)).toContain('John');
      expect(all.map(u => u.name)).toContain('Jane');
      expect(all.map(u => u.name)).toContain('Bob');
    });

    test('should return empty array for empty state', () => {
      const emptyState = createState<User>();
      const emptyGetters = createGetters(emptyState);
      const all = emptyGetters.getAllArray();
      
      expect(all).toEqual([]);
    });
  });

  describe('getAllIds', () => {
    test('should return all entity ids', () => {
      const ids = getters.getAllIds();
      
      expect(Array.isArray(ids)).toBe(true);
      expect(ids).toHaveLength(3);
      expect(ids).toContain(1);
      expect(ids).toContain(2);
      expect(ids).toContain(3);
    });

    test('should return empty array for empty state', () => {
      const emptyState = createState<User>();
      const emptyGetters = createGetters(emptyState);
      const ids = emptyGetters.getAllIds();
      
      expect(ids).toEqual([]);
    });
  });

  describe('getMissingIds', () => {
    test('should return missing ids', () => {
      const missing = getters.getMissingIds([1, 2, 4, 5]);
      
      expect(missing).toHaveLength(2);
      expect(missing).toContain(4);
      expect(missing).toContain(5);
    });

    test('should return empty array when all ids exist', () => {
      const missing = getters.getMissingIds([1, 2, 3]);
      
      expect(missing).toHaveLength(0);
    });

    test('should handle duplicates when canHaveDuplicates is false', () => {
      const missing = getters.getMissingIds([1, 2, 4, 4, 5], false);
      
      expect(missing).toHaveLength(2);
      expect(missing).toContain(4);
      expect(missing).toContain(5);
    });

    test('should handle duplicates when canHaveDuplicates is true', () => {
      const missing = getters.getMissingIds([1, 2, 4, 4, 5], true);
      
      expect(missing).toHaveLength(3);
      expect(missing).toContain(4);
      expect(missing).toContain(4);
      expect(missing).toContain(5);
    });
  });

  describe('getMissingEntities', () => {
    test('should return missing entities', () => {
      const entities: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 4, name: 'Alice', email: 'alice@example.com', age: 28 },
        { id: 5, name: 'Charlie', email: 'charlie@example.com', age: 32 }
      ];
      
      const missing = getters.getMissingEntities(entities);
      
      expect(missing).toHaveLength(2);
      expect(missing[0]?.name).toBe('Alice');
      expect(missing[1]?.name).toBe('Charlie');
    });

    test('should return empty array when all entities exist', () => {
      const entities: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      ];
      
      const missing = getters.getMissingEntities(entities);
      
      expect(missing).toHaveLength(0);
    });

    test('should handle empty array', () => {
      const missing = getters.getMissingEntities([]);
      
      expect(missing).toEqual([]);
    });

    test('should handle null/undefined array', () => {
      const missing = getters.getMissingEntities(null as any);
      
      expect(missing).toEqual([]);
    });
  });

  describe('getWhere', () => {
    test('should filter entities by predicate', () => {
      const adults = getters.getWhere(user => user.age >= 30);
      
      expect(Object.keys(adults)).toHaveLength(2);
      expect(adults[1]?.name).toBe('John');
      expect(adults[3]?.name).toBe('Bob');
    });

    test('should return all entities when filter is not a function', () => {
      const all = getters.getWhere(null as any);
      
      expect(Object.keys(all)).toHaveLength(3);
    });

    test('should return empty object when no entities match filter', () => {
      const seniors = getters.getWhere(user => user.age >= 60);
      
      expect(Object.keys(seniors)).toHaveLength(0);
    });
  });

  describe('getWhereArray', () => {
    test('should filter entities by predicate and return array', () => {
      const adults = getters.getWhereArray(user => user.age >= 30);
      
      expect(Array.isArray(adults)).toBe(true);
      expect(adults).toHaveLength(2);
      expect(adults.map(u => u.name)).toContain('John');
      expect(adults.map(u => u.name)).toContain('Bob');
    });

    test('should return all entities when filter is not a function', () => {
      const all = getters.getWhereArray(null as any);
      
      expect(Array.isArray(all)).toBe(true);
      expect(all).toHaveLength(3);
    });

    test('should return empty array when no entities match filter', () => {
      const seniors = getters.getWhereArray(user => user.age >= 60);
      
      expect(Array.isArray(seniors)).toBe(true);
      expect(seniors).toHaveLength(0);
    });
  });

  describe('getCurrent', () => {
    test('should return current entity', () => {
      const current = getters.getCurrent();
      
      expect(current).toBeDefined();
      expect(current?.name).toBe('John');
      expect(current?.id).toBe(1);
    });

    test('should return null when no current entity', () => {
      state.entities.current = null;
      const current = getters.getCurrent();
      
      expect(current).toBeNull();
    });
  });

  describe('getCurrentById', () => {
    test('should return current entity id', () => {
      const currentId = getters.getCurrentById();
      
      expect(currentId).toBe(1);
    });

    test('should return null when no current entity', () => {
      state.entities.currentById = null;
      const currentId = getters.getCurrentById();
      
      expect(currentId).toBeNull();
    });
  });

  describe('getActive', () => {
    test('should return active entities', () => {
      const active = getters.getActive();
      
      expect(Array.isArray(active)).toBe(true);
      expect(active).toHaveLength(2);
      expect(active.map(u => u.name)).toContain('John');
      expect(active.map(u => u.name)).toContain('Jane');
    });

    test('should return empty array when no active entities', () => {
      state.entities.active = [];
      const active = getters.getActive();
      
      expect(active).toEqual([]);
    });
  });

  describe('getFirstActive', () => {
    test('should return first active entity', () => {
      const first = getters.getFirstActive();
      
      expect(first).toBeDefined();
      expect(first?.name).toBe('John');
      expect(first?.id).toBe(1);
    });

    test('should return undefined when no active entities', () => {
      state.entities.active = [];
      const first = getters.getFirstActive();
      
      expect(first).toBeUndefined();
    });
  });

  describe('isAlreadyInStore', () => {
    test('should return true for existing entity', () => {
      expect(getters.isAlreadyInStore(1)).toBe(true);
      expect(getters.isAlreadyInStore(2)).toBe(true);
      expect(getters.isAlreadyInStore(3)).toBe(true);
    });

    test('should return false for non-existent entity', () => {
      expect(getters.isAlreadyInStore(999)).toBe(false);
    });
  });

  describe('isAlreadyActive', () => {
    test('should return true for active entity', () => {
      expect(getters.isAlreadyActive(1)).toBe(true);
      expect(getters.isAlreadyActive(2)).toBe(true);
    });

    test('should return false for non-active entity', () => {
      expect(getters.isAlreadyActive(3)).toBe(false);
    });

    test('should return false for non-existent entity', () => {
      expect(getters.isAlreadyActive(999)).toBe(false);
    });
  });

  describe('isDirty', () => {
    test('should return dirty status of entity', () => {
      expect(getters.isDirty(1)).toBe(false);
      expect(getters.isDirty(2)).toBe(false);
      expect(getters.isDirty(3)).toBe(true);
    });

    test('should return false for non-existent entity', () => {
      expect(getters.isDirty(999)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    test('should return false when entities exist', () => {
      expect(getters.isEmpty()).toBe(false);
    });

    test('should return true when no entities exist', () => {
      const emptyState = createState<User>();
      const emptyGetters = createGetters(emptyState);
      
      expect(emptyGetters.isEmpty()).toBe(true);
    });
  });

  describe('isNotEmpty', () => {
    test('should return true when entities exist', () => {
      expect(getters.isNotEmpty()).toBe(true);
    });

    test('should return false when no entities exist', () => {
      const emptyState = createState<User>();
      const emptyGetters = createGetters(emptyState);
      
      expect(emptyGetters.isNotEmpty()).toBe(false);
    });
  });
});

