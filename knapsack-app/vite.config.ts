import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react'],
          'vendor-zod': ['zod'],
          'vendor-crypto': ['crypto-js'],
        },
      },
    },
  },
});
