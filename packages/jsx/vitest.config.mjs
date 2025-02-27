import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      screenshotFailures: false,
      instances: [
        {
          name: 'chromium',
          browser: 'chromium',
        },
      ],
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
})
