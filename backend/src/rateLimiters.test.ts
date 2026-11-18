import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import rateLimit from 'express-rate-limit'

// Verifies the express-rate-limit wiring itself behaves as expected (429
// after the threshold, custom error body) using a small standalone limit —
// not the real authLimiter/assessmentLimiter thresholds, which are too
// high to usefully exercise in a fast test.
describe('rate limiting behavior', () => {
  it('returns 429 with the configured error body after the limit is exceeded', async () => {
    const app = express()
    const limiter = rateLimit({
      windowMs: 60_000,
      limit: 2,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests.' },
    })
    app.get('/test', limiter, (_req, res) => res.status(200).json({ ok: true }))

    await request(app).get('/test').expect(200)
    await request(app).get('/test').expect(200)
    const third = await request(app).get('/test')

    expect(third.status).toBe(429)
    expect(third.body.error).toBe('Too many requests.')
  })
})

describe('limiter keying behind a proxy', () => {
  it('gives different client IPs separate buckets and ignores a spoofed leftmost X-Forwarded-For', async () => {
    // Same trust-proxy setting the real app uses, with a tiny limit.
    const app = express()
    app.set('trust proxy', 1)
    app.use(rateLimit({ windowMs: 60_000, limit: 1, standardHeaders: true, legacyHeaders: false }))
    app.get('/ping', (_req, res) => res.json({ ok: true }))

    // Proxy appends the real client address on the right.
    const a1 = await request(app).get('/ping').set('X-Forwarded-For', '9.9.9.9, 10.0.0.1')
    const a2 = await request(app).get('/ping').set('X-Forwarded-For', '8.8.8.8, 10.0.0.1')
    const b1 = await request(app).get('/ping').set('X-Forwarded-For', '9.9.9.9, 10.0.0.2')

    expect(a1.status).toBe(200)
    // Same real client (10.0.0.1) with a different spoofed prefix: still limited.
    expect(a2.status).toBe(429)
    // A different real client has its own bucket.
    expect(b1.status).toBe(200)
  })
})
