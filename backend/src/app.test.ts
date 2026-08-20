import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from './app'

describe('CORS', () => {
  it('rejects a disallowed Origin cleanly (not a raw 500 stack trace)', async () => {
    const app = createApp()
    const response = await request(app).get('/health').set('Origin', 'https://evil.example.com')
    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(response.status).toBeLessThan(500)
  })

  it('allows the production frontend origin through', async () => {
    const app = createApp()
    const response = await request(app).get('/health').set('Origin', 'https://ai-careerforge.vercel.app')
    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBe('https://ai-careerforge.vercel.app')
  })
})
