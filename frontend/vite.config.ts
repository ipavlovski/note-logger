import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }: { mode: string }) => {
  // use import.meta.env.VITE_VAR in the code, eg.:
  // const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  return defineConfig({
    plugins: [react()],

    server: {
      port: parseInt(process.env.VITE_PORT!),
      host: true,
      https: {
        key: './secrets/homelab.key',
        cert: './secrets/homelab.crt',
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
      ],
    },
    css: {
      modules: { localsConvention: 'camelCaseOnly' },
    },
  })
}
