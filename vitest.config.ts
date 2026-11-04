import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*'],
    },
  },
  resolve: {
    alias: {
      '@entity-store/core': resolve(__dirname, 'packages/core/src'),
      '@entity-store/pinia': resolve(__dirname, 'packages/pinia/src'),
    },
  },
})
