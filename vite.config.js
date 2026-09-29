import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      ignored: ['**/src-tauri/target/**']
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  }
});
