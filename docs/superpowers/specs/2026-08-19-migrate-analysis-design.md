# Migrate Analysis Logic to the Backend (Phase 3, part 2)

## Context

Phase 1 (backend foundation) and Phase 2 (auth) are live and verified on Render + MongoDB Atlas. Phase 3 part 1 (this repo's monorepo restructuring) made `@ai-careerforge/parsers` and `@ai-careerforge/shared` available to both the frontend and backend.

This phase migrates the actual analysis pipeline — currently living entirely in the frontend's `/api/analyze` and `/api/parse-resume` Next.js routes — into the backend, as authenticated endpoints that persist each completed assessment to MongoDB.

The frontend's existing routes are **not removed** in this phase. They keep working exactly as today. Frontend integration (pointing the UI at the new backend endpoints, adding login/signup UI, a history page) is Phase 4.

## Goal

- `POST /resume/parse` — same contract as today's `/api/parse-resume` (multipart file upload → extracted text), using `@ai-careerforge/parsers`. Requires auth.
- `POST /assessments` — the full analysis: GitHub fetch, portfolio fetch (with a headless-Chrome fallback for JS-rendered sites), the Groq call, saved to MongoDB tied to the authenticated user. Requires auth.
- `GET /assessments` — list the current user's past assessments, newest first (summary fields only — score, role, date — not full resume text).
- `GET /assessments/:id` — one assessment's full detail, only if it belongs to the requesting user.

## Data model

```ts
interface Assessment {
  userId: ObjectId          // ref User
  targetRole: string
  experienceLevel: string
  resumeText: string
  skills: { dsa, systemDesign, projects, coding, csFundamentals: number }
  githubUrl: string
  linkedinUrl: string
  portfolioUrl: string
  communicationRating: number
  hasProjects: boolean
  result: AnalysisResult    // the full Groq output, from @ai-careerforge/shared
  createdAt: Date
}
```

`name`/`email` are no longer part of the stored record or the AI prompt input — they come from the authenticated `User` (`req.user`), not the request body. This is a deliberate behavior change from the frontend's current version, which still asks for name/email inline (a UX Phase 4 will need to reconcile — noted as an open question below, not blocking this phase).

## Portfolio rendering (bringing back headless Chrome)

Same design as the earlier (reverted) Vercel attempt, minus the serverless constraints that killed it there:
- Plain HTTP fetch first (fast path, matches current frontend behavior).
- If the extracted text looks like an empty SPA shell (`stripHtmlToText` result under ~200 chars), fall back to `puppeteer-core` pointed at the Docker image's system Chromium (`PUPPETEER_EXECUTABLE_PATH`, already set up in `backend/Dockerfile`).
- Any failure at any stage degrades gracefully to a descriptive string, never fails the whole request — same philosophy as the existing frontend code.

## Environment variables (new for the backend)

- `GROQ_API_KEY` — same key already used by the frontend
- `GITHUB_TOKEN` — optional, same as the frontend's optional token support

## Error handling

- `POST /assessments` with a missing required field → `400`
- Any route without a valid `Authorization: Bearer` token → `401` (via the existing `requireAuth` middleware)
- `GET /assessments/:id` for an assessment belonging to a different user → `404` (not `403` — don't confirm the ID exists to someone who doesn't own it)
- Groq call failure → `500` with a generic message (matches current frontend behavior, no retry-loop change needed here since that logic gets ported as-is)

## Testing plan

- Unit tests for the portfolio fetch/render fallback logic (mocking `fetch` and the Puppeteer call, not spinning up a real browser in CI)
- Integration tests (Supertest + mongodb-memory-server, matching the Phase 2 pattern) for all four endpoints: auth required, successful creation, list ownership, detail ownership/404 isolation
- Manual verification: real end-to-end call against Render with a live Groq key and a live MongoDB Atlas connection, plus one real portfolio URL that needs the headless-Chrome fallback

## Out of scope (future work)

- Frontend integration (Phase 4)
- Reconciling name/email UX between the account and the per-assessment form
- Rate limiting on `/assessments` (real cost consideration once this takes real traffic — noted, not blocking)
