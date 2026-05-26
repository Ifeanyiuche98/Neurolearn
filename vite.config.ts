import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],

  optimizeDeps: {
    exclude: ['@elata-biosciences/rppg-web'],
  },

  // ── PWA: serve manifest.json and sw.js from public folder ───────────────
  publicDir: 'public',

  // ── Dev server config ────────────────────────────────────────────────────
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  // ── Preview server (mirrors production) ─────────────────────────────────
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});