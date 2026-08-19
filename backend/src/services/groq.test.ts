import { describe, it, expect, vi } from 'vitest'
import { buildPrompt, getAnalysis } from './groq'
import type { AssessmentData } from '@ai-careerforge/shared'

const baseData: AssessmentData & { name: string } = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  targetRole: 'Software Engineer',
  experienceLevel: 'fresher',
  targetCompanies: '',
  resumeText: 'Built things.',
  skills: { dsa: 5, systemDesign: 5, projects: 5, coding: 5, csFundamentals: 5 },
  githubUrl: '',
  linkedinUrl: '',
  portfolioUrl: '',
  communicationRating: 3,
  hasProjects: true,
}

describe('buildPrompt', () => {
  it('includes the candidate name, role, and enriched data', () => {
    const prompt = buildPrompt(baseData, { github: 'GH DATA', portfolio: 'PORTFOLIO DATA' })
    expect(prompt).toContain('Ada Lovelace')
    expect(prompt).toContain('Software Engineer')
    expect(prompt).toContain('GH DATA')
    expect(prompt).toContain('PORTFOLIO DATA')
  })
})

function mockClient(responses: string[]) {
  const create = vi.fn()
  for (const content of responses) {
    create.mockResolvedValueOnce({ choices: [{ message: { content } }] })
  }
  return { chat: { completions: { create } } } as unknown as import('groq-sdk').default
}

const validJson = JSON.stringify({
  overall_score: 50, level: 'Beginner',
  dimensions: { technical: 50, resume: 50, communication: 50, portfolio: 50 },
  strengths: [], improvements: [], action_plan: [], summary: 'ok', hireability: 'ok',
})

describe('getAnalysis', () => {
  it('parses a valid JSON response on the first attempt', async () => {
    const client = mockClient([validJson])
    const result = await getAnalysis('prompt', client)
    expect(result.overall_score).toBe(50)
  })

  it('strips code fences before parsing', async () => {
    const client = mockClient(['```json\n' + validJson + '\n```'])
    const result = await getAnalysis('prompt', client)
    expect(result.overall_score).toBe(50)
  })

  it('retries once with the parse error when the first response is malformed', async () => {
    const client = mockClient(['not valid json', validJson])
    const result = await getAnalysis('prompt', client)
    expect(result.overall_score).toBe(50)
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2)
  })

  it('throws if both attempts are malformed', async () => {
    const client = mockClient(['not valid json', 'still not valid'])
    await expect(getAnalysis('prompt', client)).rejects.toThrow()
  })
})
