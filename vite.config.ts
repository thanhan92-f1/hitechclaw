import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api/his': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/api/cs': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/xclaw-api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/xclaw-api/, ''),
      },
    },
  },
});
