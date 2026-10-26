// Maps the hosted Supabase URL layout onto the local services:
//   /auth/v1/*  -> GoTrue (default http://127.0.0.1:9999)
// Storage is handled by the app's local storage driver in development.
import http from 'node:http'

const port = Number(process.env.SUPABASE_PROXY_PORT ?? 54321)
const auth = new URL(process.env.GOTRUE_URL ?? 'http://127.0.0.1:9999')

http
  .createServer((req, res) => {
    if (!req.url?.startsWith('/auth/v1')) {
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end('{"message":"not available in local stack"}')
      return
    }
    const upstream = http.request(
      {
        hostname: auth.hostname,
        port: auth.port,
        path: req.url.slice('/auth/v1'.length) || '/',
        method: req.method,
        headers: { ...req.headers, host: auth.host },
      },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers)
        up.pipe(res)
      },
    )
    upstream.on('error', () => {
      res.writeHead(502)
      res.end()
    })
    req.pipe(upstream)
  })
  .listen(port, '127.0.0.1', () => console.log(`supabase-compatible proxy on ${port}`))
