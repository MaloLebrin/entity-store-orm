import { beforeEach, describe, expect, test } from 'vitest';
import type { WithId } from '../types/WithId.js';
import createActions from './createActions.js';
import createState from './createState.js';

// Test entity interface
interface User extends WithId {
  name: string;
  email: string;
  age: number;
}

describe('createActions', () => {
  let state: ReturnType<typeof createState<User>>;
  let actions: ReturnType<typeof createActions<User>>;

  beforeEach(() => {
    state = createState<User>();
    actions = createActions(state);
  });

  describe('createOne', () => {
    test('should create single entity', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      
      actions.createOne(user);
      
      expect(state.entities.byId[1]).toBeDefined();
      expect(state.entities.byId[1]?.name).toBe('John');
      expect(state.entities.byId[1]?.$isDirty).toBe(false);
      expect(state.entities.allIds).toContain(1);
    });

    test('should not duplicate id in allIds if entity already exists', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      
      actions.createOne(user);
      actions.createOne(user); // Try to create again
      
      expect(state.entities.allIds.filter(id => id === 1)).toHaveLength(1);
    });

    test('should update existing entity if id already exists', () => {
      const user1: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      const user2: User = { id: 1, name: 'John Updated', email: 'john.updated@example.com', age: 31 };
      
      actions.createOne(user1);
      actions.createOne(user2);
      
      expect(state.entities.byId[1]?.name).toBe('John Updated');
      expect(state.entities.byId[1]?.email).toBe('john.updated@example.com');
      expect(state.entities.byId[1]?.age).toBe(31);
    });
  });

  describe('createMany', () => {
    test('should create multiple entities', () => {
      const users: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 },
        { id: 3, name: 'Bob', email: 'bob@example.com', age: 35 }
      ];
      
      actions.createMany(users);
      
      expect(state.entities.allIds).toHaveLength(3);
      expect(state.entities.allIds).toContain(1);
      expect(state.entities.allIds).toContain(2);
      expect(state.entities.allIds).toContain(3);
      
      expect(state.entities.byId[1]?.name).toBe('John');
      expect(state.entities.byId[2]?.name).toBe('Jane');
      expect(state.entities.byId[3]?.name).toBe('Bob');
    });

    test('should handle empty array', () => {
      actions.createMany([]);
      
      expect(state.entities.allIds).toHaveLength(0);
      expect(Object.keys(state.entities.byId)).toHaveLength(0);
    });
  });

  describe('setCurrent', () => {
    test('should set current entity', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      
      actions.setCurrent(user);
      
      expect(state.entities.current).toBeDefined();
      expect(state.entities.current?.name).toBe('John');
      expect(state.entities.current?.$isDirty).toBe(false);
    });

    test('should update current entity if already set', () => {
      const user1: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      const user2: User = { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 };
      
      actions.setCurrent(user1);
      actions.setCurrent(user2);
      
      expect(state.entities.current?.id).toBe(2);
      expect(state.entities.current?.name).toBe('Jane');
    });
  });

  describe('removeCurrent', () => {
    test('should remove current entity', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      
      actions.setCurrent(user);
      expect(state.entities.current).toBeDefined();
      
      actions.removeCurrent();
      expect(state.entities.current).toBeNull();
    });

    test('should handle removing when no current entity', () => {
      expect(state.entities.current).toBeNull();
      
      actions.removeCurrent();
      expect(state.entities.current).toBeNull();
    });
  });

  describe('updateOne', () => {
    test('should update existing entity', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      actions.createOne(user);
      
      const updatedUser: User = { id: 1, name: 'John Updated', email: 'john.updated@example.com', age: 31 };
      actions.updateOne(1, updatedUser);
      
      expect(state.entities.byId[1]?.name).toBe('John Updated');
      expect(state.entities.byId[1]?.email).toBe('john.updated@example.com');
      expect(state.entities.byId[1]?.age).toBe(31);
      expect(state.entities.byId[1]?.$isDirty).toBe(true);
    });

    test('should create entity if id does not exist', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      
      actions.updateOne(1, user);
      
      expect(state.entities.byId[1]).toBeDefined();
      expect(state.entities.byId[1]?.name).toBe('John');
      expect(state.entities.allIds).toContain(1);
    });

    test('should preserve existing fields not in payload', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      actions.createOne(user);
      
      const updatedUser: User = { id: 1, name: 'John Updated', age: 31 } as User;
      actions.updateOne(1, updatedUser);
      
      expect(state.entities.byId[1]?.name).toBe('John Updated');
      expect(state.entities.byId[1]?.email).toBe('john@example.com'); // Preserved
      expect(state.entities.byId[1]?.age).toBe(31);
    });
  });

  describe('updateMany', () => {
    test('should update multiple entities', () => {
      const users: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      ];
      actions.createMany(users);
      
      const updatedUsers: User[] = [
        { id: 1, name: 'John Updated', email: 'john.updated@example.com', age: 31 },
        { id: 2, name: 'Jane Updated', email: 'jane.updated@example.com', age: 26 }
      ];
      
      actions.updateMany(updatedUsers);
      
      expect(state.entities.byId[1]?.name).toBe('John Updated');
      expect(state.entities.byId[2]?.name).toBe('Jane Updated');
      expect(state.entities.byId[1]?.$isDirty).toBe(true);
      expect(state.entities.byId[2]?.$isDirty).toBe(true);
    });

    test('should handle empty array', () => {
      actions.updateMany([]);
      expect(state.entities.allIds).toHaveLength(0);
    });
  });

  describe('deleteOne', () => {
    test('should delete entity by id', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      actions.createOne(user);
      
      expect(state.entities.byId[1]).toBeDefined();
      expect(state.entities.allIds).toContain(1);
      
      actions.deleteOne(1);
      
      expect(state.entities.byId[1]).toBeUndefined();
      expect(state.entities.allIds).not.toContain(1);
    });

    test('should handle deleting non-existent entity', () => {
      const initialLength = state.entities.allIds.length;
      
      actions.deleteOne(999);
      
      expect(state.entities.allIds.length).toBe(initialLength);
    });
  });

  describe('deleteMany', () => {
    test('should delete multiple entities', () => {
      const users: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 },
        { id: 3, name: 'Bob', email: 'bob@example.com', age: 35 }
      ];
      actions.createMany(users);
      
      expect(state.entities.allIds).toHaveLength(3);
      
      actions.deleteMany([1, 3]);
      
      expect(state.entities.allIds).toHaveLength(1);
      expect(state.entities.allIds).toContain(2);
      expect(state.entities.byId[1]).toBeUndefined();
      expect(state.entities.byId[3]).toBeUndefined();
      expect(state.entities.byId[2]).toBeDefined();
    });

    test('should handle empty array', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      actions.createOne(user);
      
      actions.deleteMany([]);
      
      expect(state.entities.allIds).toContain(1);
      expect(state.entities.byId[1]).toBeDefined();
    });
  });

  describe('setActive', () => {
    test('should set entity as active', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      actions.createOne(user);
      
      actions.setActive(1);
      
      expect(state.entities.active).toContain(1);
    });

    test('should not duplicate active entity', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      actions.createOne(user);
      
      actions.setActive(1);
      actions.setActive(1); // Try to set again
      
      expect(state.entities.active.filter(id => id === 1)).toHaveLength(1);
    });

    test('should handle non-existent entity', () => {
      actions.setActive(999);
      expect(state.entities.active).toHaveLength(0);
    });
  });

  describe('resetActive', () => {
    test('should clear all active entities', () => {
      const users: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      ];
      actions.createMany(users);
      
      actions.setActive(1);
      actions.setActive(2);
      
      expect(state.entities.active).toHaveLength(2);
      
      actions.resetActive();
      
      expect(state.entities.active).toHaveLength(0);
    });

    test('should handle reset when no active entities', () => {
      expect(state.entities.active).toHaveLength(0);
      
      actions.resetActive();
      
      expect(state.entities.active).toHaveLength(0);
    });
  });

  describe('setIsDirty', () => {
    test('should mark entity as dirty', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      actions.createOne(user);
      
      expect(state.entities.byId[1]?.$isDirty).toBe(false);
      
      actions.setIsDirty(1);
      
      expect(state.entities.byId[1]?.$isDirty).toBe(true);
    });

    test('should handle non-existent entity', () => {
      actions.setIsDirty(999);
      // Should not throw error
    });
  });

  describe('setIsNotDirty', () => {
    test('should mark entity as not dirty', () => {
      const user: User = { id: 1, name: 'John', email: 'john@example.com', age: 30 };
      actions.createOne(user);
      
      actions.setIsDirty(1);
      expect(state.entities.byId[1]?.$isDirty).toBe(true);
      
      actions.setIsNotDirty(1);
      
      expect(state.entities.byId[1]?.$isDirty).toBe(false);
    });

    test('should handle non-existent entity', () => {
      actions.setIsNotDirty(999);
      // Should not throw error
    });
  })

  describe('Integration tests', () => {
    test('should handle complex workflow', () => {
      // Create entities
      const users: User[] = [
        { id: 1, name: 'John', email: 'john@example.com', age: 30 },
        { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 }
      ];
      actions.createMany(users);
      
      // Set current and active
      actions.setCurrent(users[0]);
      actions.setActive(1);
      actions.setActive(2);
      
      // Update entity
      actions.updateOne(1, { id: 1, name: 'John Updated', email: 'john@example.com', age: 31 });
      
      // Verify state
      expect(state.entities.allIds).toHaveLength(2);
      expect(state.entities.current?.name).toBe('John');
      expect(state.entities.active).toHaveLength(2);
      expect(state.entities.byId[1]?.$isDirty).toBe(true);
      
      // Delete entity
      actions.deleteOne(2);
      
      expect(state.entities.allIds).toHaveLength(1);
      expect(state.entities.active).toHaveLength(1);
      expect(state.entities.byId[2]).toBeUndefined();
    });
  });
});

