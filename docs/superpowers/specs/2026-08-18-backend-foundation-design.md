# Backend Foundation (MERN Migration, Phase 1)

## Context: why this exists

AI CareerForge currently runs entirely as Next.js API routes on Vercel's serverless functions. That hit real limits: bundle size constraints made headless-browser rendering (for JS-only portfolio sites) awkward to fit safely within Vercel's function size budget, and serverless functions aren't a good fit for adding real persistence and background work later.

The decision (made in conversation, not re-litigated here): move the API layer to a standalone Express + TypeScript backend (the "MERN" backend), hosted somewhere that isn't serverless-constrained, with MongoDB for persistence. The Next.js frontend stays on Vercel — it will call out to this new backend instead of its own `/api/*` routes.

This is a multi-phase project. This spec covers **Phase 1 only**: standing up the backend's skeleton, hosting, and database connection. It intentionally does nothing functional yet — no auth, no migrated analysis logic, no assessment history. Those are Phases 2–4, each get their own spec when we get there.

## Goal

An Express + TypeScript service that:
- Lives in `backend/` in this same repo (monorepo, not a separate repo)
- Connects to a MongoDB Atlas database on startup
- Exposes a `GET /health` endpoint returning service + database status
- Is deployed on Render via Docker and reachable over the public internet
- Has its own test suite (Vitest + Supertest) and CI-runnable type-checking

Nothing in the existing Next.js app changes in this phase — the frontend keeps using its current `/api/analyze` and `/api/parse-resume` routes until Phase 3 migrates that logic over and Phase 4 repoints the frontend.

## Scope

**In scope:**
- `backend/` directory: Express + TypeScript project, own `package.json`, own `node_modules`
- MongoDB connection via `mongoose` (the standard MERN ODM), reading `MONGODB_URI` from env
- `GET /health` endpoint: returns `{ status: 'ok', mongo: 'connected' | 'disconnected' }`
- A `Dockerfile` for the backend, suitable for Render's Docker deploy path
- A `render.yaml` (Render's infra-as-code config) so the service is reproducible, not just clicked together in a dashboard
- Vitest + Supertest test for the health endpoint (mocking the Mongo connection so tests don't need a live database)
- `.env.example` documenting required environment variables

**Out of scope (future phases):**
- Any authentication or user model (Phase 2)
- Migrating `/api/analyze`, resume parsing, GitHub fetch, or portfolio rendering (Phase 3)
- Any change to the Next.js frontend or its existing API routes (Phase 4)
- CORS configuration beyond what's needed for local dev testing (real cross-origin setup happens in Phase 4 when the frontend actually calls this backend)

## Architecture

```
ai-careerforge/                  (existing repo root)
├── app/, components/, lib/      (existing Next.js frontend — unchanged)
├── backend/                     (new)
│   ├── src/
│   │   ├── index.ts             (Express app entry point, starts server + connects Mongo)
│   │   ├── db.ts                (Mongo connection logic, exported for reuse/testing)
│   │   └── routes/
│   │       └── health.ts        (GET /health handler)
│   ├── src/routes/health.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── Dockerfile
│   └── .env.example
└── render.yaml                  (Render service definition, repo root)
```

`db.ts` exports a `connectToDatabase(uri: string): Promise<void>` function, kept separate from `index.ts` so it can be tested and reasoned about independently of the HTTP server setup.

The health route reads the current `mongoose.connection.readyState` rather than pinging the database on every request — cheap, accurate, no extra round-trip per health check.

## Environment variables

- `MONGODB_URI` — MongoDB Atlas connection string (you'll get this after creating a free Atlas cluster)
- `PORT` — defaults to `3001` locally; Render sets this automatically in production

## Deployment

Render's Docker-based web service, pointed at the `backend/` subdirectory of this repo (Render supports a "root directory" setting for monorepos). `render.yaml` at the repo root declares this service so it's defined in code, not just Render's dashboard — if you ever need to recreate it, the config is versioned.

You will need to, yourself (I can't do these — account creation and payment/API-key handling aren't things I can do on your behalf):
1. Create a MongoDB Atlas account, a free-tier cluster, and get its connection string
2. Create a Render account and connect this GitHub repo
3. Set `MONGODB_URI` as an environment variable in Render's dashboard for the new service

Once those exist, I can verify the deployed `/health` endpoint responds correctly.

## Testing plan

- `backend/src/routes/health.test.ts`: uses Supertest against the Express app, with `mongoose.connection.readyState` checked directly rather than requiring a real database connection in tests — asserts the endpoint returns `200` and the expected shape for both a connected and disconnected state (achieved by mocking `readyState`).
- `npx tsc --noEmit` in `backend/` for type-checking, matching the pattern already used in the frontend.
- Manual verification: run the backend locally against a real Atlas connection string, confirm `/health` shows `mongo: 'connected'`; after deploying to Render, confirm the same over the public URL.

## Open questions / follow-ups (not blocking this spec)

- CORS setup for the frontend-to-backend calls is deferred to Phase 4, once we know the actual production frontend origin to allow.
- Logging/observability (beyond Render's built-in logs) is not addressed here — revisit if Phase 3's migrated endpoints need it.
