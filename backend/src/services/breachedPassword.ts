import crypto from 'node:crypto'

// Checks a password against Have I Been Pwned's Pwned Passwords API using
// k-anonymity: only the first 5 hex chars of the password's SHA-1 hash are
// ever sent over the network, never the password itself or its full hash.
// See https://haveibeenpwned.com/API/v3#PwnedPasswords
const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/'
const REQUEST_TIMEOUT_MS = 3000

export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = sha1.slice(0, 5)
    const suffix = sha1.slice(5)

    const res = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) return false

    const body = await res.text()
    return body.split('\n').some((line) => line.split(':')[0].trim() === suffix)
  } catch {
    // Fail open — an HIBP outage or network hiccup shouldn't block signups
    // or password resets. This is a best-effort defense-in-depth check, not
    // the only line of defense against weak credentials.
    return false
  }
}
