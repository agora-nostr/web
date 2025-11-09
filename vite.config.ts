import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit()
  ],
  define: {
    'global': 'globalThis'
  },
  resolve: {
    conditions: ['svelte', 'browser', 'import', 'default'],
    alias: {
      'vaul-svelte': '/Users/pablofernandez/tenex/Voces-v53qhx/node_modules/vaul-svelte/dist/index.js',
      'svelte-toolbelt': '/Users/pablofernandez/tenex/Voces-v53qhx/node_modules/svelte-toolbelt/dist/index.js',
      'runed': '/Users/pablofernandez/tenex/Voces-v53qhx/node_modules/runed/dist/index.js'
    },
    mainFields: ['svelte', 'browser', 'module', 'jsnext:main', 'jsnext', 'main']
  },
  ssr: {
    noExternal: ['vaul-svelte', 'svelte-toolbelt', 'runed']
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
