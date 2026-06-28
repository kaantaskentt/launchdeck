import { defineConfig, devices } from '@playwright/test'

const localBrowserChannel = process.env.CI ? undefined : 'chrome'

export default defineConfig({
  testDir: './tests',
  timeout: 40_000,
  workers: 1,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...(localBrowserChannel ? { channel: localBrowserChannel } : {}) },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], ...(localBrowserChannel ? { channel: localBrowserChannel } : {}) },
    },
  ],
})
