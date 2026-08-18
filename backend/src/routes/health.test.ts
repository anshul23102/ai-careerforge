import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../app'

describe('GET /health', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports mongo as connected when readyState is 1', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1)

    const app = createApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', mongo: 'connected' })
  })

  it('reports mongo as disconnected when readyState is 0', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0)

    const app = createApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', mongo: 'disconnected' })
  })
})
