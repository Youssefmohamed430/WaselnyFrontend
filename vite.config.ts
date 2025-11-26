import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Get base path from environment variable or default to root
// For GitHub Pages, this will be set during build: /repo-name/
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig(({ mode }) => {
  // In production, use the base path from env, otherwise use root for dev
  const basePath = mode === 'production' ? (process.env.VITE_BASE_PATH || '/') : '/';
  
  return {
    plugins: [react()],
    base: basePath,
    server: {
      port: 5173
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    }
  };
});


