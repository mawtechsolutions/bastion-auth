import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: [
    'src/index.ts',
    'src/types/index.ts',
    'src/constants/index.ts',
    'src/utils/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: !options.watch, // Only clean on full builds, not watch mode
  sourcemap: true,
  splitting: false,
  treeshake: true,
}));

