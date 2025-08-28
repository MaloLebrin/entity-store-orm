import { describe, expect, test } from 'vitest';
import type { WithId } from '../types/WithId.js';
import createState from './createState.js';

// Test entity interface
interface User extends WithId {
  name: string;
  email: string;
  age: number;
}

describe('createState', () => {
  test('should create initial state with correct structure', () => {
    const state = createState<User>();
    
    expect(state).toBeDefined();
    expect(state.entities).toBeDefined();
    expect(state.entities.byId).toEqual({});
    expect(state.entities.allIds).toEqual([]);
    expect(state.entities.current).toBeNull();
    expect(state.entities.currentById).toBeNull();
    expect(state.entities.active).toEqual([]);
  });

  test('should create state with correct types', () => {
    const state = createState<User>();
    
    // Test that byId is a Record with Id keys and User & { $isDirty: boolean } values
    expect(typeof state.entities.byId).toBe('object');
    expect(Array.isArray(state.entities.byId)).toBe(false);
    
    // Test that allIds is an array
    expect(Array.isArray(state.entities.allIds)).toBe(true);
    
    // Test that current can be null
    expect(state.entities.current).toBeNull();
    
    // Test that currentById can be null
    expect(state.entities.currentById).toBeNull();
    
    // Test that active is an array
    expect(Array.isArray(state.entities.active)).toBe(true);
  });

  test('should create independent state instances', () => {
    const state1 = createState<User>();
    const state2 = createState<User>();
    
    // States should be different objects
    expect(state1).not.toBe(state2);
    expect(state1.entities).not.toBe(state2.entities);
    expect(state1.entities.byId).not.toBe(state2.entities.byId);
    expect(state1.entities.allIds).not.toBe(state2.entities.allIds);
    expect(state1.entities.active).not.toBe(state2.entities.active);
  });

  test('should work with different entity types', () => {
    interface Product extends WithId {
      name: string;
      price: number;
    }
    
    const userState = createState<User>();
    const productState = createState<Product>();
    
    expect(userState.entities.byId).toEqual({});
    expect(productState.entities.byId).toEqual({});
    
    // Both should have the same structure but be different instances
    expect(userState).not.toBe(productState);
  });
});
