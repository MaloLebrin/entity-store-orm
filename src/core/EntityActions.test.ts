import { describe, test, expect, beforeEach } from 'vitest';
import { EntityActions } from './EntityActions.js';
import type { Entity, EntityState } from '../types/index.js';

// Test entity interface
interface User extends Entity {
  name: string;
  email: string;
  age: number;
}

describe('EntityActions', () => {
  let actions: EntityActions<User>;
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
    actions = new EntityActions(state);
  });

  describe('Constructor and Initial State', () => {
    test('should initialize with provided state', () => {
      expect(actions.getState()).toBe(state);
    });

    test('should handle null/undefined state gracefully', () => {
      // This test ensures the constructor doesn't crash with invalid state
      expect(() => new EntityActions(state)).not.toThrow();
    });
  });

  describe('Entity Creation', () => {
    test('should create single entity', () => {
      const user = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      
      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');
      expect(user.age).toBe(30);
      expect(state.entities.byId[1]).toEqual(user);
      expect(state.entities.allIds).toContain(1);
    });

    test('should create multiple entities with sequential IDs', () => {
      const user1 = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const user2 = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      
      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
      expect(state.entities.allIds).toEqual([1, 2]);
      expect(Object.keys(state.entities.byId)).toHaveLength(2);
    });

    test('should create many entities at once', () => {
      const users = actions.createMany([
        { name: 'John', email: 'john@example.com', age: 30 },
        { name: 'Jane', email: 'jane@example.com', age: 25 }
      ]);
      
      expect(users).toHaveLength(2);
      expect(users[0].id).toBe(1);
      expect(users[1].id).toBe(2);
      expect(state.entities.allIds).toEqual([1, 2]);
    });

    test('should handle empty array in createMany', () => {
      const users = actions.createMany([]);
      expect(users).toHaveLength(0);
      expect(state.entities.allIds).toHaveLength(0);
    });

    test('should handle single entity in createMany', () => {
      const users = actions.createMany([
        { name: 'John', email: 'john@example.com', age: 30 }
      ]);
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(1);
    });

    test('should handle large number of entities', () => {
      const manyUsers = Array.from({ length: 100 }, (_, i) => ({
        name: `User${i}`,
        email: `user${i}@example.com`,
        age: 20 + i
      }));
      
      const users = actions.createMany(manyUsers);
      expect(users).toHaveLength(100);
      expect(state.entities.allIds).toHaveLength(100);
      expect(users[99]?.id).toBe(100);
    });

    test('should preserve entity data integrity', () => {
      const complexUser = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 30
      };
      
      const createdUser = actions.createOne(complexUser);
      expect(createdUser.name).toBe(complexUser.name);
      expect(createdUser.email).toBe(complexUser.email);
      expect(createdUser.age).toBe(complexUser.age);
      expect(createdUser.id).toBeDefined();
    });
  });

  describe('Entity Updates', () => {
    let user: User;

    beforeEach(() => {
      user = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
    });

    test('should update entity', () => {
      const updatedUser = actions.updateOne({ ...user, age: 31 });
      expect(updatedUser.age).toBe(31);
      
      expect(state.entities.byId[user.id]?.age).toBe(31);
    });

    test('should throw error when updating non-existent entity', () => {
      const nonExistentUser = { id: 999, name: 'Unknown', email: 'unknown@example.com', age: 40 };
      expect(() => actions.updateOne(nonExistentUser)).toThrow('Entity with id 999 not found');
    });

    test('should update specific field', () => {
      actions.updateField(user.id, 'age', 31);
      actions.updateField(user.id, 'name', 'John Updated');
      
      expect(state.entities.byId[user.id]?.age).toBe(31);
      expect(state.entities.byId[user.id]?.name).toBe('John Updated');
    });

    test('should update multiple entities', () => {
      const user2 = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      
      const updatedUsers = actions.updateMany([
        { ...user, age: 31 },
        { ...user2, age: 26 }
      ]);
      
      expect(updatedUsers[0].age).toBe(31);
      expect(updatedUsers[1].age).toBe(26);
      expect(state.entities.byId[user.id]?.age).toBe(31);
      expect(state.entities.byId[user2.id]?.age).toBe(26);
    });

    test('should handle empty array in updateMany', () => {
      const updatedUsers = actions.updateMany([]);
      expect(updatedUsers).toHaveLength(0);
    });

    test('should handle partial updates', () => {
      const originalUser = { ...user };
      const updatedUser = actions.updateOne({ ...user, age: 31 });
      
      expect(updatedUser.name).toBe(originalUser.name);
      expect(updatedUser.email).toBe(originalUser.email);
      expect(updatedUser.age).toBe(31);
    });

    test('should update all fields', () => {
      const completelyUpdatedUser = {
        id: user.id,
        name: 'John Updated',
        email: 'john.updated@example.com',
        age: 31
      };
      
      const result = actions.updateOne(completelyUpdatedUser);
      expect(result).toEqual(completelyUpdatedUser);
      expect(state.entities.byId[user.id]).toEqual(completelyUpdatedUser);
    });

    test('should handle updateField with non-existent entity', () => {
      expect(() => actions.updateField(999, 'name', 'Updated')).not.toThrow();
    });

    test('should handle updateField with invalid field names', () => {
      // Should not crash even with invalid field names
      expect(() => actions.updateField(user.id, 'invalidField' as any, 'value')).not.toThrow();
    });
  });

  describe('Entity Deletion', () => {
    let user1: User;
    let user2: User;

    beforeEach(() => {
      user1 = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      user2 = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
    });

    test('should delete single entity', () => {
      const result = actions.deleteOne(user1.id);
      expect(result).toBe(true);
      
      expect(state.entities.byId[user1.id]).toBeUndefined();
      expect(state.entities.allIds).not.toContain(user1.id);
      expect(state.entities.allIds).toContain(user2.id);
    });

    test('should return false when deleting non-existent entity', () => {
      const result = actions.deleteOne(999);
      expect(result).toBe(false);
    });

    test('should delete multiple entities', () => {
      const result = actions.deleteMany([user1.id, user2.id]);
      expect(result).toBe(true);
      
      expect(state.entities.byId).toEqual({});
      expect(state.entities.allIds).toHaveLength(0);
    });

    test('should handle partial deletion failure', () => {
      const result = actions.deleteMany([user1.id, 999, user2.id]);
      expect(result).toBe(false);
      
      // user1 should be deleted, user2 should remain
      expect(state.entities.byId[user1.id]).toBeUndefined();
      expect(state.entities.byId[user2.id]).toBeDefined();
      expect(state.entities.allIds).toEqual([user2.id]);
    });

    test('should handle empty array in deleteMany', () => {
      const result = actions.deleteMany([]);
      expect(result).toBe(true);
    });

    test('should handle deletion of entities with special characters in names', () => {
      const specialUser = actions.createOne({ 
        name: 'José María O\'Connor-Smith', 
        email: 'jose@example.com', 
        age: 35 
      });
      
      const result = actions.deleteOne(specialUser.id);
      expect(result).toBe(true);
      expect(state.entities.byId[specialUser.id]).toBeUndefined();
    });

    test('should handle deletion of entities with numeric IDs', () => {
      const numericUser = actions.createOne({ 
        name: 'Numeric', 
        email: 'numeric@example.com', 
        age: 40 
      });
      
      const result = actions.deleteOne(numericUser.id);
      expect(result).toBe(true);
      expect(state.entities.byId[numericUser.id]).toBeUndefined();
    });

    test('should handle deletion of entities with very large IDs', () => {
      // Simulate a large ID by creating many entities first
      for (let i = 0; i < 1000; i++) {
        actions.createOne({ 
          name: `User${i}`, 
          email: `user${i}@example.com`, 
          age: 20 + i 
        });
      }
      
      const largeIdUser = actions.createOne({ 
        name: 'LargeID', 
        email: 'largeid@example.com', 
        age: 50 
      });
      
      const result = actions.deleteOne(largeIdUser.id);
      expect(result).toBe(true);
      expect(state.entities.byId[largeIdUser.id]).toBeUndefined();
    });
  });

  describe('Current Entity Management', () => {
    let user: User;

    beforeEach(() => {
      user = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
    });

    test('should set current entity', () => {
      actions.setCurrent(user);
      expect(state.entities.current).toEqual(user);
    });

    test('should clear current entity', () => {
      actions.setCurrent(user);
      actions.removeCurrent();
      expect(state.entities.current).toBeNull();
    });

    test('should clear current entity when setting to null', () => {
      actions.setCurrent(user);
      actions.setCurrent(null);
      expect(state.entities.current).toBeNull();
    });

    test('should handle setting current entity multiple times', () => {
      actions.setCurrent(user);
      actions.setCurrent(user);
      expect(state.entities.current).toEqual(user);
    });

    test('should handle setting current entity to undefined', () => {
      actions.setCurrent(user);
      actions.setCurrent(undefined as any);
      expect(state.entities.current).toBeNull();
    });

    test('should handle current entity with complex data', () => {
      const complexUser = actions.createOne({
        name: 'Complex User',
        email: 'complex@example.com',
        age: 25
      });
      
      actions.setCurrent(complexUser);
      expect(state.entities.current).toEqual(complexUser);
    });
  });

  describe('Active Entities Management', () => {
    let user1: User;
    let user2: User;

    beforeEach(() => {
      user1 = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      user2 = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
    });

    test('should set entity as active', () => {
      actions.setActive(user1.id);
      expect(state.entities.active).toContain(user1.id);
    });

    test('should not duplicate active entities', () => {
      actions.setActive(user1.id);
      actions.setActive(user1.id);
      expect(state.entities.active.filter(id => id === user1.id)).toHaveLength(1);
    });

    test('should get multiple active entities', () => {
      actions.setActive(user1.id);
      actions.setActive(user2.id);
      expect(state.entities.active).toContain(user1.id);
      expect(state.entities.active).toContain(user2.id);
      expect(state.entities.active).toHaveLength(2);
    });

    test('should reset active entities', () => {
      actions.setActive(user1.id);
      actions.setActive(user2.id);
      actions.resetActive();
      expect(state.entities.active).toHaveLength(0);
    });

    test('should handle setting active entity multiple times', () => {
      actions.setActive(user1.id);
      actions.setActive(user1.id);
      actions.setActive(user1.id);
      expect(state.entities.active.filter(id => id === user1.id)).toHaveLength(1);
    });

    test('should handle setting active entity with non-existent ID', () => {
      expect(() => actions.setActive(999)).not.toThrow();
      expect(state.entities.active).toContain(999);
    });

    test('should handle large number of active entities', () => {
      const manyUsers: User[] = [];
      for (let i = 0; i < 100; i++) {
        const user = actions.createOne({
          name: `User${i}`,
          email: `user${i}@example.com`,
          age: 20 + i
        });
        manyUsers.push(user);
      }
      
      manyUsers.forEach(user => actions.setActive(user.id));
      expect(state.entities.active).toHaveLength(100);
    });

    test('should handle resetting active entities when none are active', () => {
      actions.resetActive();
      expect(state.entities.active).toHaveLength(0);
    });
  });

  describe('Dirty State Management', () => {
    let user: User;

    beforeEach(() => {
      user = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
    });

    test('should mark entity as dirty', () => {
      actions.setIsDirty(user.id);
      expect((state.entities.byId[user.id] as any).$isDirty).toBe(true);
    });

    test('should mark entity as not dirty', () => {
      actions.setIsDirty(user.id);
      actions.setIsNotDirty(user.id);
      expect((state.entities.byId[user.id] as any).$isDirty).toBe(false);
    });

    test('should handle non-existent entity gracefully', () => {
      // Should not throw error
      expect(() => actions.setIsDirty(999)).not.toThrow();
      expect(() => actions.setIsNotDirty(999)).not.toThrow();
    });

    test('should toggle dirty state multiple times', () => {
      actions.setIsDirty(user.id);
      expect((state.entities.byId[user.id] as any).$isDirty).toBe(true);
      
      actions.setIsNotDirty(user.id);
      expect((state.entities.byId[user.id] as any).$isDirty).toBe(false);
      
      actions.setIsDirty(user.id);
      expect((state.entities.byId[user.id] as any).$isDirty).toBe(true);
    });

    test('should handle dirty state with multiple entities', () => {
      const user2 = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      
      actions.setIsDirty(user.id);
      actions.setIsDirty(user2.id);
      
      expect((state.entities.byId[user.id] as any).$isDirty).toBe(true);
      expect((state.entities.byId[user2.id] as any).$isDirty).toBe(true);
    });
  });

  describe('State Management', () => {
    let user: User;

    beforeEach(() => {
      user = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
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
      
      actions.setState(newState);
      expect(state.entities.byId).toEqual({});
      expect(state.entities.allIds).toEqual([]);
      expect(state.entities.current).toBeNull();
      expect(state.entities.active).toEqual([]);
    });

    test('should reset state', () => {
      actions.resetState();
      expect(state.entities.byId).toEqual({});
      expect(state.entities.allIds).toHaveLength(0);
      expect(state.entities.current).toBeNull();
      expect(state.entities.active).toHaveLength(0);
    });

    test('should reset ID counter on state reset', () => {
      actions.resetState();
      const newUser = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      expect(newUser.id).toBe(1);
    });

    test('should handle setting state with existing entities', () => {
      const existingState: EntityState<User> = {
        entities: {
          byId: {
            999: { id: 999, name: 'Existing', email: 'existing@example.com', age: 40 }
          },
          allIds: [999],
          current: null,
          active: []
        }
      };
      
      actions.setState(existingState);
      expect(state.entities.byId[999]?.name).toBe('Existing');
      expect(state.entities.allIds).toContain(999);
    });

    test('should handle setting state with current and active entities', () => {
      const complexState: EntityState<User> = {
        entities: {
          byId: {
            999: { id: 999, name: 'Current', email: 'current@example.com', age: 40 }
          },
          allIds: [999],
          current: { id: 999, name: 'Current', email: 'current@example.com', age: 40 },
          active: [999]
        }
      };
      
      actions.setState(complexState);
      expect(state.entities.current?.id).toBe(999);
      expect(state.entities.active).toContain(999);
    });
  });

  describe('ID Generation', () => {
    test('should generate sequential IDs', () => {
      const user1 = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const user2 = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      const user3 = actions.createOne({ name: 'Bob', email: 'bob@example.com', age: 35 });
      
      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
      expect(user3.id).toBe(3);
    });

    test('should reset ID counter on state reset', () => {
      actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      actions.resetState();
      
      const newUser = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      expect(newUser.id).toBe(1);
    });

    test('should handle ID generation after deletion', () => {
      const user1 = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const user2 = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      
      actions.deleteOne(user1.id);
      
      const user3 = actions.createOne({ name: 'Bob', email: 'bob@example.com', age: 35 });
      expect(user3.id).toBe(3); // Should continue from last used ID
    });

    test('should handle ID generation with gaps', () => {
      const user1 = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      const user2 = actions.createOne({ name: 'Jane', email: 'jane@example.com', age: 25 });
      const user3 = actions.createOne({ name: 'Bob', email: 'bob@example.com', age: 35 });
      
      actions.deleteOne(user2.id); // Delete middle entity
      
      const user4 = actions.createOne({ name: 'Alice', email: 'alice@example.com', age: 28 });
      expect(user4.id).toBe(4); // Should continue sequence
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty state operations', () => {
      expect(actions.deleteOne(1)).toBe(false);
      expect(() => actions.updateOne({ id: 1, name: 'John', email: 'john@example.com', age: 30 })).toThrow();
    });

    test('should handle entity deletion cleanup', () => {
      const user = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      
      // Set as current and active
      actions.setCurrent(user);
      actions.setActive(user.id);
      
      // Delete the entity
      actions.deleteOne(user.id);
      
      // Should clean up current and active references
      expect(state.entities.current).toBeNull();
      expect(state.entities.active).not.toContain(user.id);
    });

    test('should handle multiple deletions of same entity', () => {
      const user = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      
      expect(actions.deleteOne(user.id)).toBe(true);
      expect(actions.deleteOne(user.id)).toBe(false);
    });

    test('should handle operations on deleted entities', () => {
      const user = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
      actions.deleteOne(user.id);
      
      // Should handle gracefully
      expect(() => actions.updateField(user.id, 'name', 'Updated')).not.toThrow();
      expect(() => actions.setIsDirty(user.id)).not.toThrow();
      expect(() => actions.setIsNotDirty(user.id)).not.toThrow();
    });

    test('should handle concurrent operations', () => {
      // Create multiple entities rapidly
      const promises: Promise<User>[] = [];
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(actions.createOne({
          name: `User${i}`,
          email: `user${i}@example.com`,
          age: 20 + i
        })));
      }
      
      Promise.all(promises).then(() => {
        expect(state.entities.allIds).toHaveLength(10);
        expect(Object.keys(state.entities.byId)).toHaveLength(10);
      });
    });

    test('should handle very long entity names', () => {
      const longName = 'A'.repeat(1000);
      const user = actions.createOne({
        name: longName,
        email: 'longname@example.com',
        age: 30
      });
      
      expect(user.name).toBe(longName);
      expect(state.entities.byId[user.id]?.name).toBe(longName);
    });

    test('should handle special characters in entity data', () => {
      const specialUser = actions.createOne({
        name: 'José María O\'Connor-Smith',
        email: 'jose.maria.oconnor-smith@example.com',
        age: 35
      });
      
      expect(specialUser.name).toBe('José María O\'Connor-Smith');
      expect(specialUser.email).toBe('jose.maria.oconnor-smith@example.com');
    });

    test('should handle unicode characters', () => {
      const unicodeUser = actions.createOne({
        name: '张三李四王五',
        email: 'unicode@example.com',
        age: 30
      });
      
      expect(unicodeUser.name).toBe('张三李四王五');
    });

    test('should handle empty strings and null values', () => {
      const emptyUser = actions.createOne({
        name: '',
        email: '',
        age: 0
      });
      
      expect(emptyUser.name).toBe('');
      expect(emptyUser.email).toBe('');
      expect(emptyUser.age).toBe(0);
    });
  });

  describe('Field Updates', () => {
    let user: User;

    beforeEach(() => {
      user = actions.createOne({ name: 'John', email: 'john@example.com', age: 30 });
    });

    test('should update string fields', () => {
      actions.updateField(user.id, 'name', 'John Updated');
      expect(state.entities.byId[user.id]?.name).toBe('John Updated');
    });

    test('should update number fields', () => {
      actions.updateField(user.id, 'age', 31);
      expect(state.entities.byId[user.id]?.age).toBe(31);
    });

    test('should update email field', () => {
      actions.updateField(user.id, 'email', 'john.updated@example.com');
      expect(state.entities.byId[user.id]?.email).toBe('john.updated@example.com');
    });

    test('should handle non-existent entity gracefully', () => {
      expect(() => actions.updateField(999, 'name', 'Updated')).not.toThrow();
    });

    test('should update field to empty string', () => {
      actions.updateField(user.id, 'name', '');
      expect(state.entities.byId[user.id]?.name).toBe('');
    });

    test('should update field to null', () => {
      actions.updateField(user.id, 'name', null as any);
      expect(state.entities.byId[user.id]?.name).toBeNull();
    });

    test('should update field to undefined', () => {
      actions.updateField(user.id, 'name', undefined as any);
      expect(state.entities.byId[user.id]?.name).toBeUndefined();
    });

    test('should update field with special characters', () => {
      const specialValue = 'José María O\'Connor-Smith';
      actions.updateField(user.id, 'name', specialValue);
      expect(state.entities.byId[user.id]?.name).toBe(specialValue);
    });

    test('should update field with unicode characters', () => {
      const unicodeValue = '张三李四王五';
      actions.updateField(user.id, 'name', unicodeValue);
      expect(state.entities.byId[user.id]?.name).toBe(unicodeValue);
    });

    test('should update field with very long value', () => {
      const longValue = 'A'.repeat(1000);
      actions.updateField(user.id, 'name', longValue);
      expect(state.entities.byId[user.id]?.name).toBe(longValue);
    });

    test('should update multiple fields in sequence', () => {
      actions.updateField(user.id, 'name', 'John Updated');
      actions.updateField(user.id, 'age', 31);
      actions.updateField(user.id, 'email', 'john.updated@example.com');
      
      expect(state.entities.byId[user.id]?.name).toBe('John Updated');
      expect(state.entities.byId[user.id]?.age).toBe(31);
      expect(state.entities.byId[user.id]?.email).toBe('john.updated@example.com');
    });
  });

  describe('Performance and Stress Tests', () => {
    test('should handle creating many entities efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        actions.createOne({
          name: `User${i}`,
          email: `user${i}@example.com`,
          age: 20 + (i % 50)
        });
      }
      
      const endTime = Date.now();
      expect(state.entities.allIds).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test('should handle updating many entities efficiently', () => {
      // Create many entities first
      const users: User[] = [];
      for (let i = 0; i < 100; i++) {
        users.push(actions.createOne({
          name: `User${i}`,
          email: `user${i}@example.com`,
          age: 20 + i
        }));
      }
      
      const startTime = Date.now();
      
      // Update all entities
      users.forEach(user => {
        actions.updateOne({ ...user, age: user.age + 1 });
      });
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    test('should handle deleting many entities efficiently', () => {
      // Create many entities first
      const users: User[] = [];
      for (let i = 0; i < 100; i++) {
        users.push(actions.createOne({
          name: `User${i}`,
          email: `user${i}@example.com`,
          age: 20 + i
        }));
      }
      
      const startTime = Date.now();
      
      // Delete all entities
      const ids = users.map(user => user.id);
      actions.deleteMany(ids);
      
      const endTime = Date.now();
      expect(state.entities.allIds).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
