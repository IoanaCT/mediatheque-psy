import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// base relative : fonctionne sur GitHub Pages (sous-dossier) comme en local.
export default defineConfig({
  base: './',
  plugins: [preact()],
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
