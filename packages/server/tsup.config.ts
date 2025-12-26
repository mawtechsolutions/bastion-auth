import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  // Bundle all dependencies except native modules
  noExternal: [/^(?!@prisma\/client).*/],
  external: ['@prisma/client'],
});

