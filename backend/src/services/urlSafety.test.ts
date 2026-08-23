import { describe, it, expect, vi, beforeEach } from 'vitest'
import dns from 'node:dns/promises'
import { assertSafeUrl, fetchSafely, UnsafeUrlError } from './urlSafety'

vi.mock('node:dns/promises', () => ({
  default: { lookup: vi.fn() },
}))

const mockedLookup = vi.mocked(dns.lookup)

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})

describe('assertSafeUrl', () => {
  it('rejects invalid URLs', async () => {
    await expect(assertSafeUrl('not a url')).rejects.toThrow(UnsafeUrlError)
  })

  it('rejects non-http(s) schemes', async () => {
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow(UnsafeUrlError)
    await expect(assertSafeUrl('ftp://example.com')).rejects.toThrow(UnsafeUrlError)
  })

  it('rejects a literal loopback IP', async () => {
    await expect(assertSafeUrl('http://127.0.0.1/admin')).rejects.toThrow(UnsafeUrlError)
  })

  it('rejects a literal private IP', async () => {
    await expect(assertSafeUrl('http://10.0.0.5/')).rejects.toThrow(UnsafeUrlError)
    await expect(assertSafeUrl('http://192.168.1.1/')).rejects.toThrow(UnsafeUrlError)
  })

  it('rejects the cloud metadata link-local address', async () => {
    await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(UnsafeUrlError)
  })

  it('rejects a hostname that resolves to a private address', async () => {
    mockedLookup.mockResolvedValue([{ address: '10.1.2.3', family: 4 }] as never)
    await expect(assertSafeUrl('http://internal.example.com/')).rejects.toThrow(UnsafeUrlError)
  })

  it('allows a hostname that resolves to a public address', async () => {
    mockedLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never)
    const url = await assertSafeUrl('https://example.com/portfolio')
    expect(url.hostname).toBe('example.com')
  })

  it('rejects when DNS resolution fails', async () => {
    mockedLookup.mockRejectedValue(new Error('ENOTFOUND'))
    await expect(assertSafeUrl('https://nonexistent.invalid/')).rejects.toThrow(UnsafeUrlError)
  })
})

describe('fetchSafely', () => {
  it('validates the target before fetching', async () => {
    await expect(fetchSafely('http://127.0.0.1/')).rejects.toThrow(UnsafeUrlError)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('follows a redirect to another public URL', async () => {
    mockedLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never)
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'https://example.com/final' } })
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const res = await fetchSafely('https://example.com/start')
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('blocks a redirect into a private address', async () => {
    mockedLookup.mockImplementation(async (hostname: unknown) => {
      if (hostname === 'example.com') return [{ address: '93.184.216.34', family: 4 }] as never
      return [{ address: '169.254.169.254', family: 4 }] as never
    })
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 302, headers: { location: 'http://internal.local/secret' } })
    )

    await expect(fetchSafely('https://example.com/start')).rejects.toThrow(UnsafeUrlError)
  })
})
