import { describe, it, expect, vi, afterEach } from 'vitest'
import { login, BackendError } from './backend'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('login', () => {
  it('resolves with the token and user on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'abc', user: { id: '1', name: 'Ada', email: 'ada@example.com' } }),
    }))

    const result = await login('ada@example.com', 'password123')
    expect(result.token).toBe('abc')
    expect(result.user.name).toBe('Ada')
  })

  it('throws a BackendError with the server message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid email or password.' }),
    }))

    await expect(login('ada@example.com', 'wrong')).rejects.toThrow(BackendError)
    await expect(login('ada@example.com', 'wrong')).rejects.toThrow('Invalid email or password.')
  })

  it('falls back to a generic message when the error response has no body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error('not json') },
    }))

    await expect(login('ada@example.com', 'wrong')).rejects.toThrow('Request failed with status 500')
  })
})
