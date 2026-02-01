import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },
});
