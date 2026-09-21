import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: {
      '@nfinyx/services': fileURLToPath(
        new URL('../../common/services/src/index.ts', import.meta.url),
      ),
      '@nfinyx/shared-assets': fileURLToPath(
        new URL('../../common/shared-assets/src/index.ts', import.meta.url),
      ),
      '@nfinyx/types': fileURLToPath(
        new URL('../../common/types/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
