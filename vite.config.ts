import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

// Vite "modes" map 1:1 to our deployment environments:
//   vite (dev)                 -> mode "development" -> .env.development  (local dev)
//   vite build --mode test     -> .env.test
//   vite build --mode uat      -> .env.uat
//   vite build --mode preprod  -> .env.preprod
//   vite build --mode production -> .env.production
// See docs/02-environments.md.
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: { port: 5173 },
  test: {
    environment: 'node',
  },
});
