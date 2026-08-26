import { build } from 'esbuild';

/**
 * Vercel compiles each api/*.ts entry to ESM without bundling ../src.
 * Runtime then fails with ERR_MODULE_NOT_FOUND. Bundle verify (and the
 * player pool it needs) so POST can load it as a sibling file.
 */
await build({
  entryPoints: ['src/game/verifyRun.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'api/verify.bundle.js',
  packages: 'external',
  logLevel: 'info',
});
