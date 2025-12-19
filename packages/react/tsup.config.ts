import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', '@mawtech/glass-ui'],
  outExtension() {
    return { js: '.js' };
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.banner = {
      js: '"use client";',
    };
  },
});

