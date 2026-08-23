import { describe, it, expect, vi, afterEach } from 'vitest'
import crypto from 'node:crypto'
import { isPasswordBreached } from './breachedPassword'

afterEach(() => {
  vi.restoreAllMocks()
})

function sha1(value: string): string {
  return crypto.createHash('sha1').update(value).digest('hex').toUpperCase()
}

describe('isPasswordBreached', () => {
  it('returns true when the suffix is present in the range response', async () => {
    const password = 'password123'
    const hash = sha1(password)
    const suffix = hash.slice(5)

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `AAAA0:3\n${suffix}:12345\nBBBB1:1`,
      })
    )

    await expect(isPasswordBreached(password)).resolves.toBe(true)
  })

  it('returns false when the suffix is absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'AAAA0:3\nBBBB1:1',
      })
    )

    await expect(isPasswordBreached('some-unique-password')).resolves.toBe(false)
  })

  it('never sends the full password hash or plaintext to the API', async () => {
    const password = 'correct-horse-battery-staple'
    const fullHash = sha1(password)
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', mockFetch)

    await isPasswordBreached(password)

    const requestedUrl = mockFetch.mock.calls[0][0] as string
    expect(requestedUrl).not.toContain(password)
    expect(requestedUrl).not.toContain(fullHash)
    expect(requestedUrl.endsWith(fullHash.slice(0, 5))).toBe(true)
  })

  it('fails open (returns false) when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    await expect(isPasswordBreached('anything')).resolves.toBe(false)
  })

  it('fails open when the API returns a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, text: async () => '' }))
    await expect(isPasswordBreached('anything')).resolves.toBe(false)
  })
})
