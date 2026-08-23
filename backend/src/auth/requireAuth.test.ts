import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { requireAuth } from './requireAuth'
import { signToken } from './jwt'
import { UserModel } from '../models/User'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(async () => {
  await UserModel.deleteMany({})
})

function makeRes() {
  const res: Partial<Response> = { locals: {} }
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as Response
}

async function createUser(tokenVersion = 0) {
  return UserModel.create({ name: 'Ada', email: 'ada@example.com', passwordHash: 'hash', tokenVersion })
}

describe('requireAuth', () => {
  it('attaches userId to res.locals and calls next() for a valid token', async () => {
    const user = await createUser()
    const token = signToken(String(user._id), user.tokenVersion)
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.locals.userId).toBe(String(user._id))
    expect(next).toHaveBeenCalledOnce()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 401 when the Authorization header is missing', async () => {
    const req = { headers: {} } as Request
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for a malformed token', async () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } } as Request
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when the user no longer exists', async () => {
    const token = signToken(String(new mongoose.Types.ObjectId()), 0)
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for a token whose tokenVersion is stale (e.g. after a password reset)', async () => {
    const user = await createUser(0)
    const token = signToken(String(user._id), 0)

    // Simulates a password reset bumping tokenVersion after this token was issued.
    user.tokenVersion = 1
    await user.save()

    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})
