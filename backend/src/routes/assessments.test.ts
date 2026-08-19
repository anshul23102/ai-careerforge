import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { UserModel } from '../models/User'
import { signToken } from '../auth/jwt'
import { createApp } from '../app'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test-key'

const validAnalysis = {
  overall_score: 60, level: 'Intermediate',
  dimensions: { technical: 60, resume: 60, communication: 60, portfolio: 60 },
  strengths: ['Good fundamentals'],
  improvements: [{ area: 'DSA', suggestion: 'Practice more', priority: 'High' }],
  action_plan: [{ timeframe: 'This Week', tasks: ['Solve problems'] }],
  summary: 'Solid candidate.',
  hireability: 'Ready for mid-level roles.',
}

vi.mock('groq-sdk', () => ({
  default: class MockGroq {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify(validAnalysis) } }] }),
      },
    }
  },
}))

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}), text: async () => '' }))

let mongod: MongoMemoryServer
const app = createApp()
let token: string
let userId: string

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(async () => {
  const AssessmentModel = mongoose.models.Assessment
  await UserModel.deleteMany({})
  if (AssessmentModel) await AssessmentModel.deleteMany({})
  const user = await UserModel.create({ name: 'Ada Lovelace', email: 'ada@example.com', passwordHash: 'hash' })
  userId = String(user._id)
  token = signToken(userId)
})

const validPayload = {
  targetRole: 'Software Engineer',
  experienceLevel: 'fresher',
  targetCompanies: '',
  resumeText: 'Built things with React and Node.',
  skills: { dsa: 5, systemDesign: 5, projects: 5, coding: 5, csFundamentals: 5 },
  githubUrl: '',
  linkedinUrl: '',
  portfolioUrl: '',
  communicationRating: 3,
  hasProjects: true,
}

describe('POST /assessments', () => {
  it('requires authentication', async () => {
    const response = await request(app).post('/assessments').send(validPayload)
    expect(response.status).toBe(401)
  })

  it('creates an assessment and returns the analysis result', async () => {
    const response = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload)

    expect(response.status).toBe(201)
    expect(response.body.id).toEqual(expect.any(String))
    expect(response.body.result.overall_score).toBe(60)
  })

  it('returns 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/assessments')
      .set('Authorization', `Bearer ${token}`)
      .send({ experienceLevel: 'fresher' })

    expect(response.status).toBe(400)
  })
})

describe('GET /assessments', () => {
  it('lists only the current user\'s assessments, newest first', async () => {
    await request(app).post('/assessments').set('Authorization', `Bearer ${token}`).send(validPayload)
    await new Promise((r) => setTimeout(r, 5))
    await request(app).post('/assessments').set('Authorization', `Bearer ${token}`).send({ ...validPayload, targetRole: 'Backend Developer' })

    const response = await request(app).get('/assessments').set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.assessments).toHaveLength(2)
    expect(response.body.assessments[0].targetRole).toBe('Backend Developer')
    expect(response.body.assessments[0].overallScore).toBe(60)
  })

  it('does not include another user\'s assessments', async () => {
    await request(app).post('/assessments').set('Authorization', `Bearer ${token}`).send(validPayload)

    const otherUser = await UserModel.create({ name: 'Bob', email: 'bob@example.com', passwordHash: 'hash' })
    const otherToken = signToken(String(otherUser._id))

    const response = await request(app).get('/assessments').set('Authorization', `Bearer ${otherToken}`)

    expect(response.status).toBe(200)
    expect(response.body.assessments).toHaveLength(0)
  })
})

describe('GET /assessments/:id', () => {
  it('returns the full assessment detail for its owner', async () => {
    const created = await request(app).post('/assessments').set('Authorization', `Bearer ${token}`).send(validPayload)

    const response = await request(app).get(`/assessments/${created.body.id}`).set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.resumeText).toBe(validPayload.resumeText)
    expect(response.body.result.overall_score).toBe(60)
  })

  it('returns 404 for another user\'s assessment', async () => {
    const created = await request(app).post('/assessments').set('Authorization', `Bearer ${token}`).send(validPayload)

    const otherUser = await UserModel.create({ name: 'Bob', email: 'bob@example.com', passwordHash: 'hash' })
    const otherToken = signToken(String(otherUser._id))

    const response = await request(app).get(`/assessments/${created.body.id}`).set('Authorization', `Bearer ${otherToken}`)

    expect(response.status).toBe(404)
  })

  it('returns 404 for a malformed id', async () => {
    const response = await request(app).get('/assessments/not-a-valid-id').set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(404)
  })
})
