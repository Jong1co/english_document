import { defineConfig, devices } from '@playwright/test'
import { getLocalSupabaseEnv } from './e2e/local-env'

const local = getLocalSupabaseEnv()
const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  // Tests share one local database, so run them one at a time.
  fullyParallel: false,
  workers: 1,
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}/favicon.ico`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: local.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.publishableKey,
    },
  },
})
