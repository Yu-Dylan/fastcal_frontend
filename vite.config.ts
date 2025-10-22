import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  cacheDir: path.resolve('C:/temp/vite-cache'),
  optimizeDeps: {
    force: true,
  },
  server: {
    fs: {
      strict: false,
    },
  },
})
