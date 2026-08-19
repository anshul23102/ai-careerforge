import express, { type Express } from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health'
import { authRouter } from './routes/auth'

export function createApp(): Express {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(healthRouter)
  app.use(authRouter)
  return app
}
