import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  build: { lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'app' } },
  test: { environment: 'jsdom' },
})
