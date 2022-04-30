import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9001,
    host: true,
    https: {
      key: './secrets/homelab.key',
      cert: './secrets/homelab.crt'
    },
    proxy: {
      '/select': {
        target: 'https://homelab:3002',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: [
      {
        find: 'frontend', replacement: path.resolve(__dirname, 'frontend')
      }
    ]
  }
})
