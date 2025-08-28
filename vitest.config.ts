import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@entity-store/core': resolve(__dirname, 'packages/core/src'),
      '@entity-store/types': resolve(__dirname, 'packages/types/src'),
      '@entity-store/pinia-adapter': resolve(__dirname, 'packages/pinia-adapter/src'),
    }
  }
});
