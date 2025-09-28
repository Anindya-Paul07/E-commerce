import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    timeout: 20000,
    threads: false,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
});
