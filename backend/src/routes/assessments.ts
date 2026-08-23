import { Router, type Request, type Response } from 'express'
import Groq from 'groq-sdk'
import type { AssessmentData } from '@ai-careerforge/shared'
import { requireAuth } from '../auth/requireAuth'
import { UserModel } from '../models/User'
import { AssessmentModel } from '../models/Assessment'
import { fetchGitHubData } from '../services/github'
import { fetchPortfolioData } from '../services/portfolio'
import { buildPrompt, getAnalysis } from '../services/groq'
import { assessmentLimiter } from '../rateLimiters'

export const assessmentsRouter = Router()

const REQUIRED_FIELDS: (keyof AssessmentData)[] = ['targetRole', 'experienceLevel', 'resumeText', 'skills']

assessmentsRouter.post('/assessments', requireAuth, assessmentLimiter, async (req: Request, res: Response) => {
  try {
    const data = req.body as AssessmentData

    const missing = REQUIRED_FIELDS.filter((field) => !data?.[field])
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` })
      return
    }

    const user = await UserModel.findById(res.locals.userId)
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const [githubData, portfolioData] = await Promise.all([
      data.githubUrl?.trim() ? fetchGitHubData(data.githubUrl) : Promise.resolve('GitHub URL not provided.'),
      data.portfolioUrl?.trim() ? fetchPortfolioData(data.portfolioUrl) : Promise.resolve('Portfolio URL not provided.'),
    ])

    const prompt = buildPrompt({ ...data, name: user.name }, { github: githubData, portfolio: portfolioData })
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const result = await getAnalysis(prompt, client)

    const assessment = await AssessmentModel.create({
      userId: user._id,
      targetRole: data.targetRole,
      experienceLevel: data.experienceLevel,
      resumeText: data.resumeText,
      skills: data.skills,
      githubUrl: data.githubUrl || '',
      linkedinUrl: data.linkedinUrl || '',
      portfolioUrl: data.portfolioUrl || '',
      communicationRating: data.communicationRating,
      hasProjects: data.hasProjects,
      result,
    })

    res.status(201).json({ id: String(assessment._id), result })
  } catch (error: unknown) {
    // Logged server-side only — an upstream error (Groq, GitHub, etc) could
    // contain internal details that shouldn't reach an API client.
    console.error('Assessment error:', error)
    res.status(500).json({ error: 'Assessment failed. Please try again.' })
  }
})

assessmentsRouter.get('/assessments', requireAuth, async (_req: Request, res: Response) => {
  const assessments = await AssessmentModel.find({ userId: res.locals.userId })
    .sort({ createdAt: -1 })
    .select('targetRole experienceLevel createdAt result.overall_score result.level')
    .lean()

  res.status(200).json({
    assessments: assessments.map((a) => ({
      id: String(a._id),
      targetRole: a.targetRole,
      experienceLevel: a.experienceLevel,
      createdAt: a.createdAt,
      overallScore: (a.result as { overall_score?: number })?.overall_score,
      level: (a.result as { level?: string })?.level,
    })),
  })
})

assessmentsRouter.get('/assessments/:id', requireAuth, async (req: Request, res: Response) => {
  let assessment
  try {
    assessment = await AssessmentModel.findOne({ _id: req.params.id, userId: res.locals.userId }).lean()
  } catch {
    // Malformed ObjectId — treat the same as not found, don't leak the distinction
    res.status(404).json({ error: 'Assessment not found.' })
    return
  }

  if (!assessment) {
    res.status(404).json({ error: 'Assessment not found.' })
    return
  }

  res.status(200).json({
    id: String(assessment._id),
    targetRole: assessment.targetRole,
    experienceLevel: assessment.experienceLevel,
    resumeText: assessment.resumeText,
    skills: assessment.skills,
    githubUrl: assessment.githubUrl,
    linkedinUrl: assessment.linkedinUrl,
    portfolioUrl: assessment.portfolioUrl,
    communicationRating: assessment.communicationRating,
    hasProjects: assessment.hasProjects,
    result: assessment.result,
    isPublic: assessment.isPublic,
    createdAt: assessment.createdAt,
  })
})

// Marks an assessment shareable. Idempotent, owner-only — this is the only
// way isPublic ever becomes true, so a link can only start circulating if
// the owner explicitly asked to share it.
assessmentsRouter.patch('/assessments/:id/share', requireAuth, async (req: Request, res: Response) => {
  let assessment
  try {
    assessment = await AssessmentModel.findOneAndUpdate(
      { _id: req.params.id, userId: res.locals.userId },
      { isPublic: true },
      { returnDocument: 'after' }
    ).lean()
  } catch {
    res.status(404).json({ error: 'Assessment not found.' })
    return
  }

  if (!assessment) {
    res.status(404).json({ error: 'Assessment not found.' })
    return
  }

  res.status(200).json({ id: String(assessment._id), isPublic: true })
})

// Deliberately no requireAuth — this is the whole point. Returns only the
// AI's analysis, never the resume text, skills, contact URLs, or which
// account it belongs to, regardless of who's asking.
assessmentsRouter.get('/assessments/:id/public', async (req: Request, res: Response) => {
  let assessment
  try {
    assessment = await AssessmentModel.findOne({ _id: req.params.id, isPublic: true })
      .select('result createdAt')
      .lean()
  } catch {
    res.status(404).json({ error: 'This shared result is unavailable.' })
    return
  }

  if (!assessment) {
    res.status(404).json({ error: 'This shared result is unavailable.' })
    return
  }

  res.status(200).json({ result: assessment.result, createdAt: assessment.createdAt })
})
