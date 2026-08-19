import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../app'
import { UserModel } from '../models/User'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

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
