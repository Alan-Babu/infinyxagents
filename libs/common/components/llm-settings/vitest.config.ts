import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: {
      '@nfinyx/page-header': fileURLToPath(new URL('../page-header/src/index.ts', import.meta.url)),
      '@nfinyx/services': fileURLToPath(new URL('../../services/src/index.ts', import.meta.url)),
      '@nfinyx/shared-assets': fileURLToPath(new URL('../../shared-assets/src/index.ts', import.meta.url)),
      '@nfinyx/types': fileURLToPath(new URL('../../types/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});