import jwt from 'jsonwebtoken'

const JWT_EXPIRY = '7d'
const JWT_ALGORITHM = 'HS256'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return secret
}

export function signToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ sub: userId, tokenVersion }, getSecret(), {
    expiresIn: JWT_EXPIRY,
    algorithm: JWT_ALGORITHM,
  })
}

export interface TokenPayload {
  userId: string
  tokenVersion: number
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, getSecret(), { algorithms: [JWT_ALGORITHM] })
  if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.tokenVersion !== 'number') {
    throw new Error('Invalid token payload')
  }
  return { userId: payload.sub, tokenVersion: payload.tokenVersion }
}
