import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from './jwt'
import { UserModel } from '../models/User'

// Attaches the authenticated user's id to res.locals.userId rather than
// augmenting Express's Request type globally — keeps the auth concern
// scoped to this middleware and its consumers.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { userId, tokenVersion } = verifyToken(token)

    // A DB round-trip on every authenticated request, in exchange for being
    // able to invalidate a stolen or leaked token immediately (see
    // /auth/reset-password) instead of waiting out its full 7-day validity.
    const user = await UserModel.findById(userId).select('tokenVersion').lean()
    if (!user || user.tokenVersion !== tokenVersion) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    res.locals.userId = userId
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
