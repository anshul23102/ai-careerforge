import type { AssessmentData, AnalysisResult } from '@ai-careerforge/shared'

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ai-careerforge-backend-mfcs.onrender.com'

export class BackendError extends Error {}

async function parseJsonOrThrow(res: Response): Promise<unknown> {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error || `Request failed with status ${res.status}`
    throw new BackendError(message)
  }
  return data
}

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  return parseJsonOrThrow(res) as Promise<AuthResponse>
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return parseJsonOrThrow(res) as Promise<AuthResponse>
}

export async function fetchMe(token: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseJsonOrThrow(res) as Promise<{ user: AuthUser }>
}

export async function parseResume(token: string, file: File): Promise<{ text: string }> {
  const body = new FormData()
  body.set('file', file)
  const res = await fetch(`${BACKEND_URL}/resume/parse`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })
  return parseJsonOrThrow(res) as Promise<{ text: string }>
}

export type AssessmentSubmission = Omit<AssessmentData, 'name' | 'email'>

export async function createAssessment(
  token: string,
  data: AssessmentSubmission
): Promise<{ id: string; result: AnalysisResult }> {
  const res = await fetch(`${BACKEND_URL}/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  return parseJsonOrThrow(res) as Promise<{ id: string; result: AnalysisResult }>
}

export interface AssessmentSummary {
  id: string
  targetRole: string
  experienceLevel: string
  createdAt: string
  overallScore?: number
  level?: string
}

export async function listAssessments(token: string): Promise<{ assessments: AssessmentSummary[] }> {
  const res = await fetch(`${BACKEND_URL}/assessments`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseJsonOrThrow(res) as Promise<{ assessments: AssessmentSummary[] }>
}

export interface AssessmentDetail extends AssessmentSubmission {
  id: string
  result: AnalysisResult
  createdAt: string
}

export async function getAssessment(token: string, id: string): Promise<AssessmentDetail> {
  const res = await fetch(`${BACKEND_URL}/assessments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseJsonOrThrow(res) as Promise<AssessmentDetail>
}
