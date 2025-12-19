import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/middleware.ts', 'src/server.ts'],
  format: ['esm'],
  dts: false, // Skip DTS for now due to Next.js type resolution issues
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', 'next', 'next/server', 'next/headers'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});

