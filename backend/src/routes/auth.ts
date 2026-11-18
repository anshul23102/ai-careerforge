import crypto from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { UserModel } from '../models/User'
import { signToken } from '../auth/jwt'
import { requireAuth } from '../auth/requireAuth'
import { authLimiter } from '../rateLimiters'
import { sendPasswordResetEmail } from '../services/email'
import { isPasswordBreached } from '../services/breachedPassword'
import { AssessmentModel } from '../models/Assessment'
import { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH, MAX_PASSWORD_BYTES } from '../validation'

export const authRouter = Router()

const MIN_PASSWORD_LENGTH = 8
const SALT_ROUNDS = 12
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000

// A hash of a password that never validates, used to run bcrypt.compare's
// full cost even when the account doesn't exist — otherwise a login attempt
// against an unknown email returns near-instantly while one against a real
// email takes as long as a real bcrypt comparison, letting an attacker
// enumerate registered accounts purely from response timing.
const DUMMY_PASSWORD_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeOO2q8Q0.7hqU8Y0OT7wpF9WQ8Z2s1qBK'

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Shared by signup and reset: length floor, and the 72-byte ceiling bcrypt can
// actually honor. Returns an error message, or null when the password is fine.
function passwordRuleViolation(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return `Password must be at most ${MAX_PASSWORD_BYTES} bytes (about ${MAX_PASSWORD_BYTES} characters).`
  }
  return null
}

async function rejectBreachedPassword(password: string, res: Response): Promise<boolean> {
  if (await isPasswordBreached(password)) {
    res.status(400).json({
      error: 'This password has appeared in a known data breach. Please choose a different one.',
    })
    return true
  }
  return false
}

function toPublicUser(user: { _id: unknown; name: string; email: string }) {
  return { id: String(user._id), name: user.name, email: user.email }
}

authRouter.post('/auth/signup', authLimiter, async (req: Request, res: Response) => {
  const { name, email, password } = req.body ?? {}

  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, and password are required.' })
    return
  }

  if (String(name).trim().length > MAX_NAME_LENGTH || String(email).length > MAX_EMAIL_LENGTH) {
    res.status(400).json({ error: 'Name or email is too long.' })
    return
  }

  const violation = passwordRuleViolation(String(password))
  if (violation) {
    res.status(400).json({ error: violation })
    return
  }

  if (await rejectBreachedPassword(String(password), res)) return

  const normalizedEmail = String(email).toLowerCase().trim()
  const existing = await UserModel.findOne({ email: normalizedEmail })
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' })
    return
  }

  const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS)
  const user = await UserModel.create({ name: String(name), email: normalizedEmail, passwordHash })

  const token = signToken(String(user._id), user.tokenVersion)
  res.status(201).json({ token, user: toPublicUser(user) })
})

authRouter.post('/auth/login', authLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required.' })
    return
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const user = await UserModel.findOne({ email: normalizedEmail })
  // Always run a bcrypt comparison, even for an unknown email, so response
  // timing can't be used to enumerate which emails have accounts.
  const passwordMatches = await bcrypt.compare(String(password), user?.passwordHash || DUMMY_PASSWORD_HASH)

  if (!user || !passwordMatches) {
    res.status(401).json({ error: 'Invalid email or password.' })
    return
  }

  const token = signToken(String(user._id), user.tokenVersion)
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

const GENERIC_FORGOT_PASSWORD_MESSAGE = 'If an account exists for that email, a reset link has been sent.'

authRouter.post('/auth/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body ?? {}
  if (!email) {
    res.status(400).json({ error: 'email is required.' })
    return
  }

  const normalizedEmail = String(email).toLowerCase().trim()
  const user = await UserModel.findOne({ email: normalizedEmail })

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    user.resetTokenHash = hashResetToken(token)
    user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await user.save()

    const frontendUrl = process.env.FRONTEND_URL || 'https://ai-careerforge.vercel.app'
    const resetUrl = `${frontendUrl}/reset-password/${token}`

    try {
      await sendPasswordResetEmail(user.email, resetUrl)
    } catch (error) {
      console.error('Failed to send password reset email:', error)
    }
  }

  res.status(200).json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE })
})

authRouter.post('/auth/reset-password', authLimiter, async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {}
  if (!token || !password) {
    res.status(400).json({ error: 'token and password are required.' })
    return
  }

  const violation = passwordRuleViolation(String(password))
  if (violation) {
    res.status(400).json({ error: violation })
    return
  }

  if (await rejectBreachedPassword(String(password), res)) return

  const tokenHash = hashResetToken(String(token))
  const user = await UserModel.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() },
  })

  if (!user) {
    res.status(400).json({ error: 'This reset link is invalid or has expired.' })
    return
  }

  user.passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS)
  user.resetTokenHash = null
  user.resetTokenExpiresAt = null
  // Invalidates every JWT issued before this reset — if the account was
  // compromised, this is what actually locks the attacker's session out
  // instead of leaving their token valid for the rest of its 7-day life.
  user.tokenVersion += 1
  await user.save()

  res.status(200).json({ message: 'Password reset successfully.' })
})

// Account deletion: removes the user and every assessment (and the resume text
// inside it). The current password is required so a stolen token alone cannot
// destroy an account. This is the right-to-erasure path for data the app
// stores about a person.
authRouter.delete('/auth/me', authLimiter, requireAuth, async (req: Request, res: Response) => {
  const { password } = req.body ?? {}
  if (!password) {
    res.status(400).json({ error: 'password is required to delete your account.' })
    return
  }

  const user = await UserModel.findById(res.locals.userId)
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    res.status(401).json({ error: 'Incorrect password.' })
    return
  }

  await AssessmentModel.deleteMany({ userId: user._id })
  await UserModel.deleteOne({ _id: user._id })

  res.status(200).json({ deleted: true })
})
