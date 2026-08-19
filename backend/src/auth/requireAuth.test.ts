import { describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { requireAuth } from './requireAuth'
import { signToken } from './jwt'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

function makeRes() {
  const res: Partial<Response> = { locals: {} }
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as Response
}

describe('requireAuth', () => {
  it('attaches userId to res.locals and calls next() for a valid token', () => {
    const token = signToken('user-123')
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    const res = makeRes()
    const next = vi.fn()

    requireAuth(req, res, next)

    expect(res.locals.userId).toBe('user-123')
    expect(next).toHaveBeenCalledOnce()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 401 when the Authorization header is missing', () => {
    const req = { headers: {} } as Request
    const res = makeRes()
    const next = vi.fn()

    requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for a malformed token', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } } as Request
    const res = makeRes()
    const next = vi.fn()

    requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})
