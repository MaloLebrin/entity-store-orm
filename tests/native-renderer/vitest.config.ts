import { defineConfig } from 'vitest/config'

// Plain Node: no DOM, no jsdom. This is what a React Native runtime looks like
// to the library (no window/document); the host tree is produced by
// react-test-renderer, which is what React Native's own test setup uses.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: { environment: 'node' },
})
