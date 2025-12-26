import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  // Bundle all dependencies into the output
  noExternal: [/.*/],
  // External native modules that can't be bundled
  external: [
    '@prisma/client',
    '@node-rs/argon2',
    '@simplewebauthn/server',
    // Node.js built-in modules
    'crypto',
    'fs',
    'path',
    'os',
    'stream',
    'util',
    'events',
    'buffer',
    'http',
    'https',
    'net',
    'tls',
    'child_process',
    'worker_threads',
    'async_hooks',
    'perf_hooks',
    'querystring',
    'url',
    'assert',
    'zlib',
  ],
});

