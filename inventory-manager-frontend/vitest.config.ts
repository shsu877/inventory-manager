import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js', // if you have global test setup
    include: ['src/**/*.test.{ts,tsx}'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    // This tells Vitest to ignore CSS imports
    alias: {
      '\\.css$': './src/__mocks__/styleMock.js',
    },
  },
});