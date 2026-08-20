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
