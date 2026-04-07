import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  ...(process.env.VITEST
    ? {
        // Vitest can fall back to classic JSX transform in some setups.
        // Force automatic runtime for tests so React doesn't need to be in scope.
        esbuild: { jsx: 'automatic' },
      }
    : {}),
  server: {
    proxy: {
      '/api': `http://localhost:${process.env.BACKEND_PORT ?? 3002}`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
});
