import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { healthRouter } from './routes/health'
import { authRouter } from './routes/auth'
import { resumeRouter } from './routes/resume'
import { assessmentsRouter } from './routes/assessments'
import { corsOptions } from './corsOptions'

export function createApp(): Express {
  const app = express()
  app.use(cors(corsOptions))
  if (process.env.VITEST !== 'true') {
    // Skip the keep-alive workflow's /health pings so real traffic doesn't
    // get drowned out in Render's log stream.
    app.use(morgan('combined', { skip: (req) => req.path === '/health' }))
  }
  app.use(express.json())
  app.use(healthRouter)
  app.use(authRouter)
  app.use(resumeRouter)
  app.use(assessmentsRouter)

  // The cors middleware forwards a disallowed-origin rejection to Express's
  // error handling as a generic Error, which would otherwise surface as an
  // unhandled 500 with a raw stack trace — turn it into a clean 403.
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error && err.message.startsWith('Origin ') && err.message.endsWith('is not allowed by CORS')) {
      res.status(403).json({ error: 'This origin is not allowed to access this API.' })
      return
    }
    next(err)
  })

  return app
}
