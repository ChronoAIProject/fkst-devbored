import type { Plugin } from 'vite'

const LOOPBACK_APP_HOST = /^127\.0\.0\.1:(?:[1-9]\d{0,4})$/u

export function isAllowedApiOrigin(
  origin: string | undefined,
  host: string | undefined,
  method = 'GET',
): boolean {
  if (origin === undefined) return method === 'GET' || method === 'HEAD'
  if (!host || !LOOPBACK_APP_HOST.test(host)) return false
  const port = Number(host.slice(host.lastIndexOf(':') + 1))
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) return false
  return origin === `http://${host}`
}

export function apiOriginGuardPlugin(): Plugin {
  return {
    name: 'fkst-api-origin-guard',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestPath = request.url ?? ''
        if (!/^\/api(?:\/|\?|$)/u.test(requestPath)) {
          next()
          return
        }
        const origin = Array.isArray(request.headers.origin) ? request.headers.origin[0] : request.headers.origin
        if (isAllowedApiOrigin(origin, request.headers.host, request.method)) {
          next()
          return
        }
        response.statusCode = 403
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(`${JSON.stringify({
          error: {
            code: 'invalid_origin',
            message: 'The browser Origin does not match this loopback Vite session.',
          },
        })}\n`)
      })
    },
  }
}
