# Backend Auth (MERN Migration, Phase 2)

## Context

Phase 1 stood up the Express + TypeScript + MongoDB backend skeleton (see `2026-08-18-backend-foundation-design.md`), deployed on Render and connected to MongoDB Atlas. This phase adds user accounts, which Phase 3 (migrating the analysis logic) needs in order to tie each assessment to a user for history storage.

## Goal

Signup, login, and an authenticated "who am I" endpoint, backed by a `User` model in MongoDB.

## Decisions (made in conversation, not re-litigated here)

- **JWT, not sessions** — stateless tokens avoid cross-origin cookie complications between the Vercel-hosted frontend and Render-hosted backend, which are different domains.
- **No email verification** — accounts are created immediately on signup. Matches the app's existing low-friction ethos, and avoids adding an email-sending service as a new dependency right now.

## Scope

**In scope:**
- `User` model: `email` (unique, lowercased), `passwordHash`, `name`, `createdAt`
- `POST /auth/signup` — `{ name, email, password }` → `201` with `{ token, user: { id, name, email } }`
- `POST /auth/login` — `{ email, password }` → `200` with `{ token, user: { id, name, email } }`
- `GET /auth/me` — requires `Authorization: Bearer <token>` → `200` with `{ user: { id, name, email } }`
- `requireAuth` middleware: verifies the JWT, attaches `req.userId`, used by `/auth/me` and (in Phase 3) the migrated analysis endpoints
- Password hashing via `bcryptjs` (pure JS, no native build step)
- Minimum password length: 8 characters, enforced server-side
- `JWT_SECRET` env var for signing tokens, 7-day expiry

**Out of scope (future phases):**
- Password reset / forgot-password flow
- Email verification
- OAuth / social login
- Rate limiting on auth endpoints (worth revisiting before this handles real traffic, not blocking Phase 2)
- Any frontend changes (Phase 4)

## Data model

```ts
interface User {
  email: string       // unique index, stored lowercased
  passwordHash: string
  name: string
  createdAt: Date
}
```

## Error handling

- Signup with an already-registered email → `409` `{ error: 'An account with this email already exists.' }`
- Signup with a password under 8 characters → `400` `{ error: 'Password must be at least 8 characters.' }`
- Login with a wrong password or unknown email → `401` `{ error: 'Invalid email or password.' }` (same message for both cases, so the response doesn't reveal which emails are registered)
- `/auth/me` with a missing, malformed, or expired token → `401` `{ error: 'Unauthorized' }`

## Testing plan

- Unit tests for `requireAuth` middleware: valid token attaches `userId`, missing/invalid/expired token returns 401
- Integration tests (Supertest) for all three endpoints against a real in-memory or test MongoDB connection: successful signup, duplicate-email rejection, successful login, wrong-password rejection, `/auth/me` with and without a valid token
- Manual verification: signup and login against the live Render deployment once implemented
