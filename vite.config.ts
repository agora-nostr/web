import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit()
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Run backup tests in Node environment for Buffer support (needed by shamirs-secret-sharing-ts)
    environmentMatchGlobs: [
      ['src/lib/backup/**/*.test.ts', 'node'],
    ],
  },
  define: {
    'global': 'globalThis'
  },
  resolve: {
    conditions: ['svelte', 'browser', 'import', 'default'],
    mainFields: ['svelte', 'browser', 'module', 'jsnext:main', 'jsnext', 'main']
  },
  ssr: {
    noExternal: ['svelte-toolbelt', '@nostr-dev-kit/blossom']
  },
  optimizeDeps: {
    exclude: ['@nostr-dev-kit/cache-sqlite-wasm']
  },
  worker: {
    format: 'es'
  },
  server: {
    port: 5001,
    host: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    fs: {
      allow: ['..']
    }
  },
  preview: {
    host: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  assetsInclude: ['**/*.wasm'],
});
