import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(dirname, 'src/shared'),
      '@renderer': path.resolve(dirname, 'src/renderer'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  build: {
    outDir: '.vite/build/renderer',
    emptyOutDir: false,
  },
  server: {
    port: 5173,
  },
});
