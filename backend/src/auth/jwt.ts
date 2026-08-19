import jwt from 'jsonwebtoken'

const JWT_EXPIRY = '7d'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return secret
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: JWT_EXPIRY })
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, getSecret())
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new Error('Invalid token payload')
  }
  return payload.sub
}
