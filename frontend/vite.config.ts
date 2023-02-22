import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

import ViteRestart from 'vite-plugin-restart'


export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  return defineConfig({
    plugins: [react(), ViteRestart({ restart: ['../trigger.txt'] })],

    server: {
      port: parseInt(process.env.VITE_PORT!),
      host: true,
      https: {
        key: `${process.env.HOME}/.config/ssl/homelab/homelab.key`,
        cert: `${process.env.HOME}/.config/ssl/homelab/homelab.crt`,
      },
    },


    resolve: {
      alias: [
        {
          find: 'components',
          replacement: `${__dirname}/components`,
        },
        {
          find: 'frontend',
          replacement: `${__dirname}`,
        },
      ]
    },
    build: {
      outDir: '../dist'
    }

  })
}
