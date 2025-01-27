import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    workspace: ['packages/*', '!packages/eslint-plugin'],
  },
})
