import { beforeEach, describe, expect, test } from 'vitest';
import createState from './createState.js';
import createGetters from './getters/index.js';
import type { EntityWithMeta } from './types/EntityMeta.js';
import type { WithId } from './types/WithId.js';

// Test entity interface
interface User extends WithId {
  name: string;
  email: string;
  age: number;
}

type TemporaryState = ReturnType<typeof createState<User>> & ReturnType<typeof createGetters<User>>;

describe('createGetters', () => {
  let state: TemporaryState;

  beforeEach(() => {
    state = createState<User>() as TemporaryState;
    state = {
      ...state,
      ...createGetters(state),
    };
    
    // Add some test data
    const user1: EntityWithMeta<User> = { 
      id: 1, 
      name: 'John', 
      email: 'john@example.com', 
      age: 30, 
      $isDirty: false,
      $meta: {
        changedFields: new Set(),
        createdAt: Date.now(),
        updatedAt: null
      }
    };
    const user2: EntityWithMeta<User> = { 
      id: 2, 
      name: 'Jane', 
      email: 'jane@example.com', 
      age: 25, 
      $isDirty: false,
      $meta: {
        changedFields: new Set(),
        createdAt: Date.now(),
        updatedAt: null
      }
    };
    const user3: EntityWithMeta<User> = { 
      id: 3, 
      name: 'Bob', 
      email: 'bob@example.com', 
      age: 35, 
      $isDirty: true,
      $meta: {
        changedFields: new Set(),
        createdAt: Date.now(),
        updatedAt: null
      }
    };
    
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
      const findOne = state.findOneById();
      const user = findOne(1);
      
      expect(user).toBeDefined();
      expect(user?.name).toBe('John');
      expect(user?.id).toBe(1);
    });

    test('should return undefined for non-existent id', () => {
      const findOne = state.findOneById();
      const user = findOne(999);
      
      expect(user).toBeUndefined();
    });
  });

  describe('findManyById (deprecated)', () => {
    test('should find multiple entities by ids', () => {
      const findMany = state.findManyById();
      const users = findMany([1, 2]);
      
      expect(users).toHaveLength(2);
      expect(users[0]?.name).toBe('John');
      expect(users[1]?.name).toBe('Jane');
    });

    test('should filter out non-existent ids', () => {
      const findMany = state.findManyById();
      const users = findMany([1, 999, 2]);
      
      expect(users).toHaveLength(2);
      expect(users[0]?.name).toBe('John');
      expect(users[1]?.name).toBe('Jane');
    });

    test('should return empty array for non-existent ids', () => {
      const findMany = state.findManyById();
      const users = findMany([999, 888]);
      
      expect(users).toHaveLength(0);
    });
  });

  describe('getAll', () => {
    test('should return all entities as dictionary', () => {
      const all = state.getAll();
      
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
      const all = state.getAllArray();
      
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
      const ids = state.getAllIds();
      
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
      const getMissing = state.getMissingIds();
      const missing = getMissing([1, 2, 4, 5]);
      
      expect(missing).toHaveLength(2);
      expect(missing).toContain(4);
      expect(missing).toContain(5);
    });

    test('should return empty array when all ids exist', () => {
      const getMissing = state.getMissingIds();
      const missing = getMissing([1, 2, 3]);
      
      expect(missing).toHaveLength(0);
    });

    test('should handle duplicates when canHaveDuplicates is false', () => {
      const getMissing = state.getMissingIds();
      const missing = getMissing([1, 2, 4, 4, 5], false);
      
      expect(missing).toHaveLength(2);
      expect(missing).toContain(4);
      expect(missing).toContain(5);
    });

    test('should handle duplicates when canHaveDuplicates is true', () => {
      const getMissing = state.getMissingIds();
      const missing = getMissing([1, 2, 4, 4, 5], true);
      
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
      
      const getMissing = state.getMissingEntities();
      const missing = getMissing(entities);
      
      expect(missing).toHaveLength(2);
      expect(missing[0]?.name).toBe('Alice');
      expect(missing[1]?.name).toBe('Charlie');
    });

    test('should return empty array when all entities exist', () => {
      const entities: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      ];
      
      const getMissing = state.getMissingEntities();
      const missing = getMissing(entities);
      
      expect(missing).toHaveLength(0);
    });

    test('should handle empty array', () => {
      const getMissing = state.getMissingEntities();
      const missing = getMissing([]);
      
      expect(missing).toEqual([]);
    });

    test('should handle null/undefined array', () => {
      const getMissing = state.getMissingEntities();
      const missing = getMissing(null as any);
      
      expect(missing).toEqual([]);
    });
  });

  describe('getWhere', () => {
    test('should filter entities by predicate', () => {
      const getWhere = state.getWhere();
      const adults = getWhere(user => user.age >= 30);
      
      expect(Object.keys(adults)).toHaveLength(2);
      expect(adults[1]?.name).toBe('John');
      expect(adults[3]?.name).toBe('Bob');
    });

    test('should return all entities when filter is not a function', () => {
      const getWhere = state.getWhere();
      const all = getWhere(null as any);
      
      expect(Object.keys(all)).toHaveLength(3);
    });

    test('should return empty object when no entities match filter', () => {
      const getWhere = state.getWhere();
      const seniors = getWhere(user => user.age >= 60);
      
      expect(Object.keys(seniors)).toHaveLength(0);
    });

    test('should ignore sorting options (dictionaries do not maintain order)', () => {
      const getWhere = state.getWhere();
      const filtered = getWhere(user => user.age >= 25, { orderBy: 'name', sortBy: 'asc' });
      
      // Should still filter correctly
      expect(Object.keys(filtered)).toHaveLength(3);
      expect(filtered[1]?.name).toBe('John');
      expect(filtered[2]?.name).toBe('Jane');
      expect(filtered[3]?.name).toBe('Bob');
      
      // But sorting is ignored for dictionaries
      // Use getWhereArray with sorting options instead
    });
  });

  describe('getWhereArray', () => {
    test('should filter entities by predicate and return array', () => {
      const adults = state.getWhereArray(user => user.age >= 30);
      
      expect(Array.isArray(adults)).toBe(true);
      expect(adults).toHaveLength(2);
      expect(adults.map(u => u.name)).toContain('John');
      expect(adults.map(u => u.name)).toContain('Bob');
    });

    test('should return all entities when filter is not a function', () => {
      const all = state.getWhereArray(null as any);
      
      expect(Array.isArray(all)).toBe(true);
      expect(all).toHaveLength(3);
    });

    test('should return empty array when no entities match filter', () => {
      const seniors = state.getWhereArray(user => user.age >= 60);
      
      expect(Array.isArray(seniors)).toBe(true);
      expect(seniors).toHaveLength(0);
    });

    test('should sort entities by field in ascending order', () => {
      const sortedByName = state.getWhereArray(user => user.age >= 25, { orderBy: 'name', sortBy: 'asc' });
      
      expect(Array.isArray(sortedByName)).toBe(true);
      expect(sortedByName).toHaveLength(3);
      expect(sortedByName[0]?.name).toBe('Bob');
      expect(sortedByName[1]?.name).toBe('Jane');
      expect(sortedByName[2]?.name).toBe('John');
    });

    test('should sort entities by field in descending order', () => {
      const sortedByAge = state.getWhereArray(user => user.age >= 25, { orderBy: 'age', sortBy: 'desc' });
      
      expect(Array.isArray(sortedByAge)).toBe(true);
      expect(sortedByAge).toHaveLength(3);
      expect(sortedByAge[0]?.age).toBe(35);
      expect(sortedByAge[1]?.age).toBe(30);
      expect(sortedByAge[2]?.age).toBe(25);
    });

    test('should sort entities using custom sort function', () => {
      const sortedByCustom = state.getWhereArray(user => user.age >= 25, { 
        orderBy: (user) => user.name.length, 
        sortBy: 'asc' 
      });
      
      expect(Array.isArray(sortedByCustom)).toBe(true);
      expect(sortedByCustom).toHaveLength(3);
      
      // First entity should have shortest name (3 letters)
      expect(sortedByCustom[0]?.name).toBe('Bob'); // 3 letters
      
      // Next two entities should have 4 letters each, but order may vary
      expect(sortedByCustom[1]?.name.length).toBe(4);
      expect(sortedByCustom[2]?.name.length).toBe(4);
      
      // Verify all names are present
      const names = sortedByCustom.map(u => u.name);
      expect(names).toContain('Bob');
      expect(names).toContain('Jane');
      expect(names).toContain('John');
    });
  });

  describe('getCurrent', () => {
    test('should return current entity', () => {
      const current = state.getCurrent();
      
      expect(current).toBeDefined();
      expect(current?.name).toBe('John');
      expect(current?.id).toBe(1);
    });

    test('should return null when no current entity', () => {
      state.entities.current = null;
      const current = state.getCurrent();
      
      expect(current).toBeNull();
    });
  });

  describe('getCurrentById', () => {
    test('should return current entity', () => {
      const currentEntity = state.getCurrentById();
      
      expect(currentEntity).toBeDefined();
      expect(currentEntity?.id).toBe(1);
      expect(currentEntity?.name).toBe('John');
    });

    test('should return null when no current entity', () => {
      state.entities.currentById = null;
      const currentId = state.getCurrentById();
      
      expect(currentId).toBeNull();
    });
  });

  describe('getActive', () => {
    test('should return active entities', () => {
      const active = state.getActive();
      
      expect(Array.isArray(active)).toBe(true);
      expect(active).toHaveLength(2);
      expect(active).toContain(1);
      expect(active).toContain(2);
    });

    test('should return empty array when no active entities', () => {
      state.entities.active = [];
      const active = state.getActive();
      
      expect(active).toEqual([]);
    });
  });

  describe('getFirstActive', () => {
    test('should return first active entity', () => {
      const first = state.getFirstActive();
      
      expect(first).toBeDefined();
      expect(first).toBe(1);
    });

    test('should return undefined when no active entities', () => {
      state.entities.active = [];
      const first = state.getFirstActive();
      
      expect(first).toBeUndefined();
    });
  });

  describe('isAlreadyInStore', () => {
    test('should return true for existing entity', () => {
      const isInStore = state.isAlreadyInStore();
      expect(isInStore(1)).toBe(true);
      expect(isInStore(2)).toBe(true);
      expect(isInStore(3)).toBe(true);
    });

    test('should return false for non-existent entity', () => {
      const isInStore = state.isAlreadyInStore();
      expect(isInStore(999)).toBe(false);
    });
  });

  describe('isAlreadyActive', () => {
    test('should return true for active entity', () => {
      const isActive = state.isAlreadyActive();
      expect(isActive(1)).toBe(true);
      expect(isActive(2)).toBe(true);
    });

    test('should return false for non-active entity', () => {
      const isActive = state.isAlreadyActive();
      expect(isActive(3)).toBe(false);
    });

    test('should return false for non-existent entity', () => {
      const isActive = state.isAlreadyActive();
      expect(isActive(999)).toBe(false);
    });
  });

  describe('isDirty', () => {
    test('should return dirty status of entity', () => {
      const isDirty = state.isDirty();
      expect(isDirty(1)).toBe(false);
      expect(isDirty(2)).toBe(false);
      expect(isDirty(3)).toBe(true);
    });

    test('should return false for non-existent entity', () => {
      const isDirty = state.isDirty();
      expect(isDirty(999)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    test('should return false when entities exist', () => {
      expect(state.getIsEmpty()).toBe(false);
    });

    test('should return true when no entities exist', () => {
      const emptyState = createState<User>();
      const emptyGetters = createGetters(emptyState);
      
      expect(emptyGetters.getIsEmpty()).toBe(true);
    });
  });

  describe('isNotEmpty', () => {
    test('should return true when entities exist', () => {
      expect(state.getIsNotEmpty()).toBe(true);
    });

    test('should return false when no entities exist', () => {
      const emptyState = createState<User>();
      const emptyGetters = createGetters(emptyState);
      
      expect(emptyGetters.getIsNotEmpty()).toBe(false);
    });
  });
});

