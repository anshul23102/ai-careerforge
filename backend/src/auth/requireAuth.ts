import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from './jwt'

// Attaches the authenticated user's id to res.locals.userId rather than
// augmenting Express's Request type globally — keeps the auth concern
// scoped to this middleware and its consumers.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    res.locals.userId = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
