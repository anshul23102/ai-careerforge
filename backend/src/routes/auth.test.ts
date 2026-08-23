import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../app'
import { UserModel } from '../models/User'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const sendPasswordResetEmail = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('../services/email', () => ({ sendPasswordResetEmail }))

const isPasswordBreached = vi.hoisted(() => vi.fn().mockResolvedValue(false))
vi.mock('../services/breachedPassword', () => ({ isPasswordBreached }))

let mongod: MongoMemoryServer
const app = createApp()

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
  sendPasswordResetEmail.mockClear()
  isPasswordBreached.mockClear()
  isPasswordBreached.mockResolvedValue(false)
})

describe('POST /auth/signup', () => {
  it('creates a user and returns a token', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret' })

    expect(response.status).toBe(201)
    expect(response.body.token).toEqual(expect.any(String))
    expect(response.body.user).toEqual({ id: expect.any(String), name: 'Ada Lovelace', email: 'ada@example.com' })
  })

  it('rejects a password under 8 characters', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'short' })

    expect(response.status).toBe(400)
  })

  it('rejects a duplicate email', async () => {
    await request(app).post('/auth/signup').send({ name: 'Ada', email: 'ada@example.com', password: 'supersecret' })

    const response = await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Two', email: 'ada@example.com', password: 'anotherpass' })

    expect(response.status).toBe(409)
  })

  it('treats email as case-insensitive', async () => {
    await request(app).post('/auth/signup').send({ name: 'Ada', email: 'Ada@Example.com', password: 'supersecret' })

    const response = await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Two', email: 'ada@example.com', password: 'anotherpass' })

    expect(response.status).toBe(409)
  })

  it('rejects a password found in a known breach', async () => {
    isPasswordBreached.mockResolvedValueOnce(true)

    const response = await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'commonpassword' })

    expect(response.status).toBe(400)
    expect(await UserModel.findOne({ email: 'ada@example.com' })).toBeNull()
  })
})

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/signup').send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret' })
  })

  it('logs in with correct credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'ada@example.com', password: 'supersecret' })

    expect(response.status).toBe(200)
    expect(response.body.token).toEqual(expect.any(String))
  })

  it('rejects an incorrect password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'ada@example.com', password: 'wrongpassword' })

    expect(response.status).toBe(401)
  })

  it('rejects an unknown email', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'supersecret' })

    expect(response.status).toBe(401)
  })
})

describe('GET /auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const signup = await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret' })

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${signup.body.token}`)

    expect(response.status).toBe(200)
    expect(response.body.user).toEqual({ id: expect.any(String), name: 'Ada Lovelace', email: 'ada@example.com' })
  })

  it('returns 401 with no token', async () => {
    const response = await request(app).get('/auth/me')
    expect(response.status).toBe(401)
  })

  it('returns 401 with an invalid token', async () => {
    const response = await request(app).get('/auth/me').set('Authorization', 'Bearer garbage')
    expect(response.status).toBe(401)
  })
})

describe('POST /auth/forgot-password', () => {
  it('sends a reset email for an existing account', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret' })

    const response = await request(app).post('/auth/forgot-password').send({ email: 'ada@example.com' })

    expect(response.status).toBe(200)
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1)
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('ada@example.com', expect.stringContaining('/reset-password/'))

    const user = await UserModel.findOne({ email: 'ada@example.com' })
    expect(user?.resetTokenHash).toEqual(expect.any(String))
    expect(user?.resetTokenExpiresAt).toBeInstanceOf(Date)
  })

  it('returns the same generic response for a nonexistent account, without sending an email', async () => {
    const response = await request(app).post('/auth/forgot-password').send({ email: 'nobody@example.com' })

    expect(response.status).toBe(200)
    expect(response.body.message).toEqual(expect.any(String))
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('requires an email', async () => {
    const response = await request(app).post('/auth/forgot-password').send({})
    expect(response.status).toBe(400)
  })
})

describe('POST /auth/reset-password', () => {
  async function requestResetToken(email: string) {
    await request(app).post('/auth/forgot-password').send({ email })
    const resetUrl = sendPasswordResetEmail.mock.calls[sendPasswordResetEmail.mock.calls.length - 1][1] as string
    return resetUrl.split('/reset-password/')[1]
  }

  it('resets the password with a valid token', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret' })

    const token = await requestResetToken('ada@example.com')

    const response = await request(app).post('/auth/reset-password').send({ token, password: 'newpassword123' })
    expect(response.status).toBe(200)

    const login = await request(app).post('/auth/login').send({ email: 'ada@example.com', password: 'newpassword123' })
    expect(login.status).toBe(200)
  })

  it('invalidates the token after use', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret' })

    const token = await requestResetToken('ada@example.com')
    await request(app).post('/auth/reset-password').send({ token, password: 'newpassword123' })

    const reuse = await request(app).post('/auth/reset-password').send({ token, password: 'anotherpassword' })
    expect(reuse.status).toBe(400)
  })

  it('invalidates any JWT issued before the reset', async () => {
    const signup = await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret' })
    const oldToken = signup.body.token as string

    const meBefore = await request(app).get('/auth/me').set('Authorization', `Bearer ${oldToken}`)
    expect(meBefore.status).toBe(200)

    const resetToken = await requestResetToken('ada@example.com')
    await request(app).post('/auth/reset-password').send({ token: resetToken, password: 'newpassword123' })

    const meAfter = await request(app).get('/auth/me').set('Authorization', `Bearer ${oldToken}`)
    expect(meAfter.status).toBe(401)
  })

  it('rejects a new password found in a known breach', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret' })
    const token = await requestResetToken('ada@example.com')

    isPasswordBreached.mockResolvedValueOnce(true)
    const response = await request(app).post('/auth/reset-password').send({ token, password: 'commonpassword' })

    expect(response.status).toBe(400)
  })

  it('rejects an unknown token', async () => {
    const response = await request(app).post('/auth/reset-password').send({ token: 'not-a-real-token', password: 'newpassword123' })
    expect(response.status).toBe(400)
  })

  it('rejects a password under 8 characters', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'supersecret' })

    const token = await requestResetToken('ada@example.com')

    const response = await request(app).post('/auth/reset-password').send({ token, password: 'short' })
    expect(response.status).toBe(400)
  })

  it('requires both token and password', async () => {
    const response = await request(app).post('/auth/reset-password').send({})
    expect(response.status).toBe(400)
  })
})
