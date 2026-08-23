import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { signToken, verifyToken } from './jwt'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

describe('signToken / verifyToken', () => {
  it('round-trips the userId and tokenVersion', () => {
    const token = signToken('user-123', 4)
    expect(verifyToken(token)).toEqual({ userId: 'user-123', tokenVersion: 4 })
  })

  it('signs with HS256', () => {
    const token = signToken('user-123', 0)
    const decoded = jwt.decode(token, { complete: true })
    expect(decoded?.header.alg).toBe('HS256')
  })

  it('rejects a token signed with a different algorithm', () => {
    // Forge a token claiming "none" alg with no signature — the classic
    // algorithm-confusion bypass this app's explicit `algorithms: ['HS256']`
    // pin in jwt.verify is meant to block.
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ sub: 'user-123', tokenVersion: 0 })).toString('base64url')
    const forgedToken = `${header}.${payload}.`

    expect(() => verifyToken(forgedToken)).toThrow()
  })

  it('rejects a token signed with the wrong secret', () => {
    const token = jwt.sign({ sub: 'user-123', tokenVersion: 0 }, 'wrong-secret', { algorithm: 'HS256' })
    expect(() => verifyToken(token)).toThrow()
  })

  it('rejects an expired token', () => {
    const token = jwt.sign({ sub: 'user-123', tokenVersion: 0 }, process.env.JWT_SECRET!, {
      algorithm: 'HS256',
      expiresIn: -1,
    })
    expect(() => verifyToken(token)).toThrow()
  })

  it('rejects a token missing tokenVersion', () => {
    const token = jwt.sign({ sub: 'user-123' }, process.env.JWT_SECRET!, { algorithm: 'HS256' })
    expect(() => verifyToken(token)).toThrow('Invalid token payload')
  })
})
