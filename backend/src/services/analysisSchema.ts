import { z } from 'zod'
import type { AnalysisResult } from '@ai-careerforge/shared'

// The model is asked for JSON, but nothing forces it to comply: it can return
// a score of 140, omit a field, or invent a level name. Everything downstream
// (the results dashboard, the history list, the public share page) trusts this
// shape, so it is validated at the boundary instead of being cast with `as`.
//
// Scores are rounded and clamped rather than rejected, because "72.5" or "101"
// is a harmless formatting slip; a missing field or a wrong type is not, and
// is rejected so the caller can ask the model to try again.
const score = z
  .number()
  .finite()
  .transform((n) => Math.min(100, Math.max(0, Math.round(n))))

const text = z.string().trim().min(1).max(1500)

export const analysisResultSchema = z.object({
  overall_score: score,
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  dimensions: z.object({
    technical: score,
    resume: score,
    communication: score,
    portfolio: score,
  }),
  strengths: z.array(text).min(1).max(8),
  improvements: z
    .array(
      z.object({
        area: text,
        suggestion: text,
        priority: z.enum(['High', 'Medium', 'Low']),
      })
    )
    .min(1)
    .max(8),
  action_plan: z
    .array(
      z.object({
        timeframe: text,
        tasks: z.array(text).min(1).max(8),
      })
    )
    .min(1)
    .max(6),
  summary: text,
  hireability: text,
})

export type ParsedAnalysis = z.infer<typeof analysisResultSchema>

// Compile-time guarantee that the validated shape and the shared type the
// frontend consumes cannot drift apart.
export function toAnalysisResult(parsed: ParsedAnalysis): AnalysisResult {
  return parsed
}

export function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 6)
    .map((issue) => `${issue.path.join('.') || 'response'}: ${issue.message}`)
    .join('; ')
}
