import rateLimit from 'express-rate-limit'

// express-rate-limit's store is a module-level singleton shared across every
// request in the process — including every test in the suite, which would
// otherwise trip these limits just by exercising the same route repeatedly.
// Vitest sets process.env.VITEST, so this only disables limiting in tests,
// never in production.
const skipInTests = () => process.env.VITEST === 'true'

// Signup/login: generous enough for normal retries (typos, forgotten
// passwords) but blocks credential-stuffing/brute-force loops.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
})

// Each assessment triggers a real Groq inference call (real cost) plus a
// GitHub fetch and possibly a headless-Chrome render — keep this tight.
export const assessmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: 'Too many assessments requested. Please try again later.' },
})

// Resume parsing is CPU-only (no external API cost) but still worth
// bounding against abuse.
export const resumeParseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: 'Too many resume uploads. Please try again later.' },
})
