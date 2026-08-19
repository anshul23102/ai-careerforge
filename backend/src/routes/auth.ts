import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { UserModel } from '../models/User'
import { signToken } from '../auth/jwt'
import { requireAuth } from '../auth/requireAuth'

export const authRouter = Router()

const MIN_PASSWORD_LENGTH = 8
const SALT_ROUNDS = 10

function toPublicUser(user: { _id: unknown; name: string; email: string }) {
  return { id: String(user._id), name: user.name, email: user.email }
}

authRouter.post('/auth/signup', async (req: Request, res: Response) => {
  const { name, email, password } = req.body ?? {}

  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, and password are required.' })
    return
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` })
    return
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const existing = await UserModel.findOne({ email: normalizedEmail })
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' })
    return
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await UserModel.create({ name, email: normalizedEmail, passwordHash })

  const token = signToken(String(user._id))
  res.status(201).json({ token, user: toPublicUser(user) })
})

authRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required.' })
    return
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const user = await UserModel.findOne({ email: normalizedEmail })
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false

  if (!user || !passwordMatches) {
    res.status(401).json({ error: 'Invalid email or password.' })
    return
  }

  const token = signToken(String(user._id))
  res.status(200).json({ token, user: toPublicUser(user) })
})

authRouter.get('/auth/me', requireAuth, async (_req: Request, res: Response) => {
  const user = await UserModel.findById(res.locals.userId)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  res.status(200).json({ user: toPublicUser(user) })
})
