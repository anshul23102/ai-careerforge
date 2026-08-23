import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../app'
import { UserModel } from '../models/User'
import { signToken } from '../auth/jwt'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const fixtures = join(__dirname, '../../../packages/parsers/src/__fixtures__')

let mongod: MongoMemoryServer
const app = createApp()
let token: string

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
  const user = await UserModel.create({ name: 'Ada Lovelace', email: 'ada@example.com', passwordHash: 'hash' })
  token = signToken(String(user._id), user.tokenVersion)
})

describe('POST /resume/parse', () => {
  it('requires authentication', async () => {
    const response = await request(app).post('/resume/parse')
    expect(response.status).toBe(401)
  })

  it('extracts text from a valid PDF for an authenticated user', async () => {
    const buffer = await readFile(join(fixtures, 'sample.pdf'))
    const response = await request(app)
      .post('/resume/parse')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, 'resume.pdf')

    expect(response.status).toBe(200)
    expect(response.body.text).toContain('John Doe')
  })

  it('returns 400 when no file is provided', async () => {
    const response = await request(app)
      .post('/resume/parse')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
  })

  it('returns 400 for an unsupported file type', async () => {
    const buffer = await readFile(join(fixtures, 'unsupported.png'))
    const response = await request(app)
      .post('/resume/parse')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, 'resume.png')

    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(/Unsupported/)
  })
})
