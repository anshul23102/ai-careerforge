# Frontend Integration with the Backend (Phase 4)

## Context

Phases 1-3 built a fully working, independently-verified backend (Express + MongoDB on Render): auth, resume parsing, and the full analysis pipeline, all persisted per-user. Nothing in the live frontend uses it yet — the frontend still runs its own parallel, stateless `/api/analyze` and `/api/parse-resume` routes.

This phase wires the frontend to the backend and retires its own duplicate routes.

## Decision (made in conversation)

**Login is required before taking an assessment.** The backend's `/assessments` endpoint always requires auth — there is no anonymous path. This breaks the original "zero friction, no signup" pitch, but matches a decision already made when the backend's auth system was built, and avoids maintaining two parallel code paths (anonymous vs authenticated).

## Scope

- `AuthContext`: holds `{ token, user }`, persisted to `localStorage`, restored on load. Exposes `login`, `signup`, `logout`.
- `/login` and `/signup` pages, calling the backend's `/auth/login` and `/auth/signup`.
- A route guard: `/assess` and `/history` redirect to `/login` if not authenticated.
- `AssessmentForm` rewired to call the backend directly (`POST {backend}/resume/parse`, `POST {backend}/assessments}`) instead of the frontend's own routes. The `name`/`email` step-1 fields are removed from the form — the backend already has the user's name from their account.
- New `/results/[id]` page: fetches `GET {backend}/assessments/:id`. Replaces the old `/results?data=<base64>` page — no more URL-encoding a payload, results are just fetched by ID.
- New `/history` page: `GET {backend}/assessments`, a simple list linking into each `/results/[id]`.
- Remove `frontend/app/api/analyze/route.ts` and `frontend/app/api/parse-resume/route.ts` — nothing calls them after this phase. Remove `GROQ_API_KEY` from the frontend's own env (it's a backend-only secret now).
- New env var: `NEXT_PUBLIC_BACKEND_URL`.

## Out of scope

- Password reset, email verification (already deferred from Phase 2)
- Any redesign of the assessment form's steps/UI beyond removing name/email and updating the submit target
- Rate limiting, CORS lockdown to a specific origin (backend's CORS stays permissive for now)

## Testing plan

- Manual verification against the live Render backend: signup, login, full assessment flow, results page, history page, logout, and the auth-guard redirect for a logged-out visit to `/assess`.
