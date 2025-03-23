import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: [
      './tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
      './tests/integration/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/playwright-report/**',
      '**/tests/e2e/**',
      '**/.next/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**', '**/.next/**'],
    },
    reporters: ['default', 'html', 'junit'],
    outputFile: {
      html: './tests/unit/reports/index.html',
      junit: './test-report.xml',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
});
