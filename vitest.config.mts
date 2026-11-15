import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['contracts/**/*.test.ts', 'server/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
