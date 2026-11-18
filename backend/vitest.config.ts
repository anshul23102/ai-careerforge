import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Several test files each start their own in-memory MongoDB. Under load
    // (a busy laptop or CI runner) that startup can exceed the 10 second
    // default and fail a whole file for reasons unrelated to the code.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
})
