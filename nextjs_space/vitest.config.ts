import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['lib/**/__tests__/**/*.test.ts', 'app/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/services/education/**/*.ts'],
      exclude: ['**/__tests__/**'],
    },
    // 'server-only' ném lỗi khi chạy ngoài Next.js runtime — stub để test service layer
    alias: {
      'server-only': path.resolve(__dirname, 'lib/__tests__/stubs/server-only.ts'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
