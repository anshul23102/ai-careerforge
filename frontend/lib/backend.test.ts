import { describe, it, expect, vi, afterEach } from 'vitest'
import { login, deleteAssessment, unshareAssessment, deleteAccount, getPublicAssessment, BackendError } from './backend'

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

describe('delete and unshare calls', () => {
  function stubOk(body: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('deleteAssessment sends DELETE with the bearer token', async () => {
    const fetchMock = stubOk({ deleted: true })
    await deleteAssessment('tok', 'abc123')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/assessments\/abc123$/)
    expect(init.method).toBe('DELETE')
    expect(init.headers.Authorization).toBe('Bearer tok')
  })

  it('unshareAssessment sends DELETE to the share path', async () => {
    const fetchMock = stubOk({ id: 'abc123', isPublic: false })
    const result = await unshareAssessment('tok', 'abc123')

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/assessments\/abc123\/share$/)
    expect(result.isPublic).toBe(false)
  })

  it('deleteAccount sends the password in the JSON body, not the URL', async () => {
    const fetchMock = stubOk({ deleted: true })
    await deleteAccount('tok', 'hunter2hunter2')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).not.toContain('hunter2')
    expect(JSON.parse(init.body)).toEqual({ password: 'hunter2hunter2' })
  })

  it('getPublicAssessment sends no Authorization header', async () => {
    const fetchMock = stubOk({ result: {}, createdAt: 'now' })
    await getPublicAssessment('abc123')

    expect(fetchMock.mock.calls[0][1]).toBeUndefined()
  })

  it('surfaces a 404 from deleteAssessment as a BackendError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: 'Assessment not found.' }) }))
    await expect(deleteAssessment('tok', 'nope')).rejects.toThrow(BackendError)
  })
})
