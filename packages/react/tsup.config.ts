import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: !options.watch, // Only clean on full builds, not watch mode
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', '@mawtech/glass-ui'],
  outExtension() {
    return { js: '.js' };
  },
  banner: {
    js: '"use client";',
  },
  esbuildOptions(esbuildOpts) {
    esbuildOpts.jsx = 'automatic';
  },
}));

