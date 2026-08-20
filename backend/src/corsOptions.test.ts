import { describe, it, expect, vi } from 'vitest'
import { corsOptions } from './corsOptions'

function checkOrigin(origin: string | undefined): Promise<boolean> {
  return new Promise((resolve) => {
    const callback = vi.fn((err: Error | null, allow?: boolean) => {
      resolve(!err && !!allow)
    })
    ;(corsOptions.origin as (origin: string | undefined, cb: typeof callback) => void)(origin, callback)
  })
}

describe('corsOptions', () => {
  it('allows requests with no Origin header (curl, server-to-server)', async () => {
    expect(await checkOrigin(undefined)).toBe(true)
  })

  it('allows the production frontend origin', async () => {
    expect(await checkOrigin('https://ai-careerforge.vercel.app')).toBe(true)
  })

  it('allows localhost for local dev', async () => {
    expect(await checkOrigin('http://localhost:3000')).toBe(true)
  })

  it('allows a Vercel preview deployment origin', async () => {
    expect(await checkOrigin('https://ai-careerforge-fwg2z3c99-anshul-jains-projects.vercel.app')).toBe(true)
  })

  it('rejects an unrelated origin', async () => {
    expect(await checkOrigin('https://evil.example.com')).toBe(false)
  })

  it('rejects a lookalike vercel.app domain that does not match the pattern', async () => {
    expect(await checkOrigin('https://totally-different-app.vercel.app')).toBe(false)
  })
})
