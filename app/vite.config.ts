import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

import { apiOriginGuardPlugin } from './proxy-security'

const DEFAULT_BFF_TARGET = 'http://127.0.0.1:8472'

function parseLoopbackBffTarget(value: string): URL {
  let target: URL
  try {
    target = new URL(value)
  } catch {
    throw new Error('VITE_BFF_TARGET must be a valid loopback HTTP origin.')
  }
  const port = Number(target.port)
  if (
    target.protocol !== 'http:'
    || target.hostname !== '127.0.0.1'
    || !target.port
    || !Number.isSafeInteger(port)
    || port < 1
    || port > 65_535
    || target.username
    || target.password
    || target.pathname !== '/'
    || target.search
    || target.hash
  ) {
    throw new Error('VITE_BFF_TARGET must be an origin-only http://127.0.0.1:<port> URL.')
  }
  return target
}

export default defineConfig(({ mode }) => {
  const fileEnvironment = loadEnv(mode, process.cwd(), 'VITE_')
  const target = parseLoopbackBffTarget(
    process.env.VITE_BFF_TARGET ?? fileEnvironment.VITE_BFF_TARGET ?? DEFAULT_BFF_TARGET,
  )
  return {
    plugins: [apiOriginGuardPlugin(), react()],
    publicDir: '../demo',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      host: '127.0.0.1',
      cors: false,
      proxy: {
        '/api': {
          target: target.origin,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyRequest) => {
              proxyRequest.setHeader('host', target.host)
              proxyRequest.setHeader('origin', target.origin)
            })
          },
        },
      },
    },
  }
})
