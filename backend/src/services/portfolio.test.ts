import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchPortfolioData } from './portfolio'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockFetch(html: string, ok = true, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, status, text: async () => html }))
}

describe('fetchPortfolioData', () => {
  it('returns the plain-fetch text when the page has real content', async () => {
    const longBio = 'Full-stack engineer building distributed systems. '.repeat(6)
    mockFetch(`<html><body><h1>Jane Smith</h1><p>${longBio}</p></body></html>`)
    const render = vi.fn()

    const result = await fetchPortfolioData('https://example.com', render)

    expect(result).toContain('Jane Smith')
    expect(render).not.toHaveBeenCalled()
  })

  it('falls back to headless rendering when the plain fetch looks like an empty SPA shell', async () => {
    mockFetch('<html><body><div id="root"></div></body></html>')
    const render = vi.fn().mockResolvedValue('<html><body><h1>Rendered Jane Smith</h1></body></html>')

    const result = await fetchPortfolioData('https://example.com', render)

    expect(render).toHaveBeenCalledWith('https://example.com')
    expect(result).toContain('Rendered Jane Smith')
  })

  it('reports no readable text when both plain fetch and render fail to produce content', async () => {
    mockFetch('<html><body><div id="root"></div></body></html>')
    const render = vi.fn().mockResolvedValue(null)

    const result = await fetchPortfolioData('https://example.com', render)

    expect(result).toContain('no readable text')
  })

  it('returns a status message for a non-ok response', async () => {
    mockFetch('', false, 404)

    const result = await fetchPortfolioData('https://example.com')

    expect(result).toContain('status 404')
  })

  it('returns a graceful message on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))

    const result = await fetchPortfolioData('https://example.com')

    expect(result).toContain('could not be fetched')
  })
})
