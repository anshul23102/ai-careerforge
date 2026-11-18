# AI CareerForge

An interview readiness assessment. You upload a resume, rate your skills, and optionally link a GitHub profile and portfolio site. The app reads those sources, asks a large language model to evaluate the candidate, and returns a 0 to 100 readiness score across four dimensions, with strengths, prioritized improvements, and a phased action plan.

Live app: https://ai-careerforge.vercel.app

## What it does

1. **Account.** Email and password signup. Passwords are hashed with bcrypt, sessions use signed JWTs.
2. **Resume upload.** PDF, DOCX, DOC, RTF, LaTeX (.tex), TXT, and Markdown are parsed to text on the server. Scanned or image-only documents are not supported (there is no OCR).
3. **Live enrichment.** If a GitHub URL is given, the backend reads the public profile and top repositories from the GitHub API. If a portfolio URL is given, the backend fetches the page, and falls back to a headless browser for JavaScript-rendered sites.
4. **AI analysis.** The collected data is sent to `openai/gpt-oss-120b` on Groq. The response is validated against a strict schema before it is stored or shown.
5. **Results.** A score gauge, radar chart, per-dimension breakdown, strengths, improvements, and an action plan. Past assessments are listed in a history page.
6. **Sharing.** The owner can publish a read-only link that exposes only the AI analysis, never the resume, skills, or contact URLs, and can revoke it at any time.
7. **Data control.** Any assessment can be deleted, and an account can be deleted together with everything stored about it.

The score is an LLM judgement based on self-reported ratings plus public profile data. It is guidance for preparation, not a validated hiring metric.

## Architecture

```
Browser (Next.js on Vercel)
   |  HTTPS, JSON, Authorization: Bearer <JWT>
   v
Express API (Docker on Render)
   |-- /auth/*          signup, login, me, forgot/reset password, delete account
   |-- /resume/parse    multipart upload, parsed in memory
   |-- /assessments/*   create, list, read, share, unshare, delete, public view
   |-- /health          liveness and database status
   |
   |-- MongoDB Atlas    users, assessments
   |-- GitHub REST API  profile and repos
   |-- Portfolio site   plain fetch, headless Chromium fallback (SSRF guarded)
   |-- Groq API         gpt-oss-120b analysis
   |-- Resend           password reset email
```

The repository is an npm workspaces monorepo:

| Path | Purpose |
|---|---|
| `frontend/` | Next.js 16 App Router UI (TypeScript, Tailwind v4, Framer Motion, Recharts) |
| `backend/` | Express 5 API (TypeScript, Mongoose, Zod, Vitest, Supertest) |
| `packages/parsers/` | Resume text extraction for each supported file format |
| `packages/shared/` | Types and helpers shared by frontend and backend |
| `docs/` | Design specs written before each major phase |

## The analysis pipeline

1. `POST /assessments` validates the body with Zod: every field has a type, range, and length bound (for example skill ratings are integers from 1 to 10 and the resume is at most 30,000 characters).
2. GitHub and portfolio data are fetched in parallel. A failure in either degrades to a short placeholder string rather than failing the request.
3. The prompt is assembled. Resume, GitHub, and portfolio text are untrusted, so each is wrapped in its own tag (`<resume>`, `<github_data>`, `<portfolio_data>`), any attempt to close or reopen those tags from inside the text is stripped, and the system prompt tells the model to evaluate that content and never obey it.
4. The model is called with temperature 0.3.
5. The reply is parsed and validated against `analysisResultSchema`. Scores are rounded and clamped to 0 to 100. A malformed or schema-violating reply triggers one corrective retry in which the exact problem is fed back to the model.
6. The result is stored together with run metadata: model name, prompt version, attempt count, and latency. This makes output quality and latency comparable across prompt versions.

## Security

- Passwords: bcrypt (cost 12), 8 to 72 byte limit (bcrypt ignores bytes past 72), and a Have I Been Pwned k-anonymity check that never sends the password or its full hash.
- Sessions: HS256 JWT with the algorithm pinned on verification and a per-user `tokenVersion`. A password reset bumps the version, which invalidates every earlier token immediately.
- Login timing: an unknown email still runs a full bcrypt comparison, so response time does not reveal which emails are registered.
- Password reset: random 32 byte token, only its SHA-256 hash is stored, 15 minute expiry, single use, identical response whether or not the email exists.
- SSRF: user-supplied portfolio URLs are restricted to http and https, resolved, and rejected if any address is private, loopback, link-local (including cloud metadata), or reserved. The check repeats on every redirect and on every request made by the headless browser.
- Rate limiting: separate limits for auth, assessment creation, and resume parsing. The app trusts exactly one proxy hop so limits apply per client IP.
- Transport and headers: strict CORS allow-list, Helmet on the API, CSP, HSTS, and frame protection on the frontend.
- Input: Zod bounds on every assessment field, 1 MB JSON body cap, 5 MB upload cap, uploads parsed in memory and never written to disk.
- Errors: internal error detail is logged server-side and never returned to clients.
- Containers: `.dockerignore` keeps `.env` files out of image layers.

## Testing

```bash
cd backend && npm test      # API, auth, validation, SSRF, rate limits (MongoDB in memory)
cd frontend && npm test     # API client
cd packages/parsers && npm test
cd packages/shared && npm test
```

Backend tests run against `mongodb-memory-server` and mock only the network edges (Groq, email, breached-password lookup), so routes, middleware, and Mongoose models are exercised for real.

## Running locally

Prerequisites: Node 20 or newer, a MongoDB connection string, and a Groq API key.

```bash
git clone https://github.com/anshul23102/ai-careerforge.git
cd ai-careerforge
npm install
```

Create `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?appName=Cluster0
JWT_SECRET=<long random string>
GROQ_API_KEY=<groq key>
RESEND_API_KEY=<resend key>
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
# optional
# GITHUB_TOKEN=<token, raises the GitHub API limit from 60 to 5000 per hour>
# ALLOWED_ORIGINS=https://extra.example.com
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

Run each in its own terminal:

```bash
cd backend && npm run dev     # http://localhost:3001
cd frontend && npm run dev    # http://localhost:3000
```

## Deployment

- Frontend: Vercel, root directory `frontend`.
- Backend: Render web service built from `backend/Dockerfile` with the monorepo root as the build context (see `render.yaml`). The image installs system Chromium for the portfolio renderer.
- Database: MongoDB Atlas.

## Known limitations

These are deliberate trade-offs or open items, listed so they are not surprises.

- **Cold starts.** The backend runs on Render's free tier and sleeps after about 15 minutes idle, so the first request after a quiet period can take roughly 30 to 60 seconds. A scheduled GitHub Actions ping helps but GitHub does not guarantee the schedule.
- **Password reset email.** Resend's shared test sender only delivers to the account owner. Reset emails reach other users only after a sending domain is verified.
- **No email verification.** Anyone can register with any address.
- **Token storage.** The JWT is kept in `localStorage`, which is readable by any script on the page. The mitigations are a strict CSP, no `dangerouslySetInnerHTML`, and React's default escaping. Moving to httpOnly cookies would be stronger but needs cross-site cookie and CSRF handling.
- **Score validity.** Scores come from an LLM and from self-ratings. They are not calibrated against real interview outcomes.
- **Prompt injection.** Fencing and instructions reduce it but cannot eliminate it. Output validation bounds the damage to a wrong score for the person who submitted the text.
- **Scanned resumes.** No OCR, so image-only PDFs are rejected.
- **DNS rebinding.** The SSRF guard resolves a hostname and then the HTTP client resolves it again. Pinning the validated address to the connection would close that gap.
- **Headless browser sandbox.** Chromium runs with its internal sandbox disabled because the container is unprivileged. The URL allow-list and the container boundary are the compensating controls.

## License

MIT
