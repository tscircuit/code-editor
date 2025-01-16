import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'cosmos-export',
    rollupOptions: {
      input: 'src/main.tsx',
    },
    // Ensure HTML files are generated
    manifest: true,
    write: true,
  }
});