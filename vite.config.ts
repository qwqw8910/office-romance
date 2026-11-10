import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // GitHub Pages 會放在 /<repo>/ 底下，由 CI 傳入 BASE_PATH；本機維持根目錄
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
