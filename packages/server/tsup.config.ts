import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  // External native modules that can't be bundled
  external: [
    '@prisma/client',
    '@node-rs/argon2',
    '@simplewebauthn/server',
  ],
});

