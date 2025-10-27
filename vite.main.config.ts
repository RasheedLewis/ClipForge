import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(dirname, 'src/shared'),
    },
  },
  build: {
    sourcemap: true,
    target: 'node18',
    outDir: '.vite/build/main',
    emptyOutDir: false,
    lib: {
      entry: 'src/main/app.ts',
      formats: ['cjs'],
      fileName: () => 'app.js',
    },
    rollupOptions: {
      external: [
        'electron',
        '@ffmpeg-installer/ffmpeg',
        '@ffprobe-installer/ffprobe',
        'fluent-ffmpeg',
        ...builtinModules,
        ...builtinModules.map((moduleName) => `node:${moduleName}`),
      ],
    },
  },
});
