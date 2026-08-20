import type { CorsOptions } from 'cors'

// The production frontend, any Vercel preview deployment of this project
// (dynamic per-deploy subdomain), and localhost for local dev. Extra
// origins can be added via ALLOWED_ORIGINS (comma-separated) without a
// code change or redeploy.
const DEFAULT_ALLOWED_ORIGINS = [
  'https://ai-careerforge.vercel.app',
  'http://localhost:3000',
]

const VERCEL_PREVIEW_PATTERN = /^https:\/\/ai-careerforge-[a-z0-9-]+\.vercel\.app$/

const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...extraOrigins])

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // No Origin header (curl, server-to-server, same-origin) — allow.
    if (!origin) {
      callback(null, true)
      return
    }
    if (allowedOrigins.has(origin) || VERCEL_PREVIEW_PATTERN.test(origin)) {
      callback(null, true)
      return
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS`))
  },
}
