import { Router, type Request, type Response } from 'express'
import { isDatabaseConnected } from '../db'

export const healthRouter = Router()

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mongo: isDatabaseConnected() ? 'connected' : 'disconnected',
  })
})
