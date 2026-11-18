import { z } from 'zod'

// Request-body validation for POST /assessments. The route used to check only
// that required fields were truthy, so a 900KB "targetRole", a skill rating of
// 9999, or an experienceLevel of "wizard" were all accepted and then pasted
// straight into the LLM prompt and stored. Bounding every field closes that
// input-validation gap (CWE-20) and also caps prompt size and cost.
const rating = (min: number, max: number) => z.number().int().min(min).max(max)

const optionalUrl = z.string().trim().max(300).default('')

export const assessmentInputSchema = z.object({
  targetRole: z.string().trim().min(1).max(100),
  experienceLevel: z.enum(['fresher', 'intern', '1-2years', '3-5years']),
  targetCompanies: z.string().trim().max(300).default(''),
  resumeText: z.string().trim().min(1).max(30000),
  skills: z.object({
    dsa: rating(1, 10),
    systemDesign: rating(1, 10),
    projects: rating(1, 10),
    coding: rating(1, 10),
    csFundamentals: rating(1, 10),
  }),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  communicationRating: rating(1, 5),
  hasProjects: z.boolean(),
})

export type AssessmentInput = z.infer<typeof assessmentInputSchema>

export function describeFieldErrors(error: z.ZodError): string {
  const fields = [...new Set(error.issues.map((issue) => issue.path.join('.') || 'body'))]
  return `Missing or invalid fields: ${fields.join(', ')}`
}

// bcrypt only hashes the first 72 BYTES of its input and silently ignores the
// rest, so two long passwords sharing a 72-byte prefix would be equivalent.
// Rejecting anything longer is the standard fix.
export const MAX_PASSWORD_BYTES = 72
export const MAX_NAME_LENGTH = 100
export const MAX_EMAIL_LENGTH = 254
