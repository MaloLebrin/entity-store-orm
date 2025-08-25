import { describe, expect, test } from 'vitest';
import type { Entity, EntityState, StoreAdapter } from './index.js';

// Test entity simple
interface User extends Entity {
  name: string;
  email: string;
  age: number;
}

// Test de la structure EntityState
describe('EntityState', () => {
  test('should have correct structure', () => {
    const state: EntityState<User> = {
      entities: {
        byId: {},
        allIds: [],
        current: null,
        active: []
      }
    };

    expect(state.entities.byId).toBeDefined();
    expect(state.entities.allIds).toBeDefined();
    expect(state.entities.current).toBeDefined();
    expect(state.entities.active).toBeDefined();
  });
});

// Test de l'interface Entity
describe('Entity', () => {
  test('should have id property', () => {
    const user: User = {
      id: 1,
      name: 'John',
      email: 'john@example.com',
      age: 30
    };

    expect(user.id).toBe(1);
    expect(user.name).toBe('John');
    expect(user.email).toBe('john@example.com');
    expect(user.age).toBe(30);
  });
});

// Test de l'interface StoreAdapter
describe('StoreAdapter', () => {
  test('should define required methods', () => {
    // Cette interface doit être implémentée par les adaptateurs
    // On teste juste que TypeScript ne se plaint pas
    const mockAdapter: StoreAdapter<User> = {
      // Getters
      getOne: () => null,
      getMany: () => [],
      getAll: () => ({}),
      getAllArray: () => [],
      getAllIds: () => [],
      getMissingIds: () => [],
      getMissingEntities: () => [],
      getWhere: () => ({}),
      getWhereArray: () => [],
      getIsEmpty: () => true,
      getIsNotEmpty: () => false,
      getCurrent: () => null,
      getActive: () => [],
      getFirstActive: () => null,
      isAlreadyInStore: () => false,
      isAlreadyActive: () => false,
      isDirty: () => false,

      // Actions
      createOne: () => ({ id: 1, name: '', email: '', age: 0 }),
      createMany: () => [],
      setCurrent: () => {},
      removeCurrent: () => {},
      updateOne: () => ({ id: 1, name: '', email: '', age: 0 }),
      updateMany: () => [],
      deleteOne: () => true,
      deleteMany: () => true,
      setActive: () => {},
      resetActive: () => {},
      setIsDirty: () => {},
      setIsNotDirty: () => {},
      updateField: () => {},

      // State management
      getState: () => ({ entities: { byId: {}, allIds: [], current: null, active: [] } }),
      setState: () => {},
      resetState: () => {}
    };

    expect(mockAdapter).toBeDefined();
    expect(typeof mockAdapter.getOne).toBe('function');
    expect(typeof mockAdapter.createOne).toBe('function');
  });
});
