import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchGitHubData } from './github'

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.GITHUB_TOKEN
})

function mockFetchResponses(userBody: unknown, userOk: boolean, reposBody: unknown, reposOk: boolean) {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce({ ok: userOk, json: async () => userBody })
    .mockResolvedValueOnce({ ok: reposOk, json: async () => reposBody }))
}

describe('fetchGitHubData', () => {
  it('returns a formatted summary for a valid profile with repos', async () => {
    mockFetchResponses(
      { name: 'Ada Lovelace', bio: 'Engineer', public_repos: 10, followers: 5, following: 2, created_at: '2020-01-01T00:00:00Z' },
      true,
      [{ fork: false, name: 'repo1', description: 'A project', stargazers_count: 3, language: 'TypeScript', forks_count: 1 }],
      true
    )

    const result = await fetchGitHubData('https://github.com/ada')

    expect(result).toContain('Ada Lovelace')
    expect(result).toContain('repo1: A project [TypeScript, 3 stars, 1 forks]')
  })

  it('excludes forked repos from the summary', async () => {
    mockFetchResponses(
      { name: 'Ada', bio: null, public_repos: 1, followers: 0, following: 0, created_at: '2020-01-01T00:00:00Z' },
      true,
      [{ fork: true, name: 'forked-repo', description: null, stargazers_count: 0, language: null, forks_count: 0 }],
      true
    )

    const result = await fetchGitHubData('https://github.com/ada')

    expect(result).not.toContain('forked-repo')
    expect(result).toContain('No public repositories found.')
  })

  it('returns a graceful message when the profile fetch fails', async () => {
    mockFetchResponses({}, false, [], true)

    const result = await fetchGitHubData('https://github.com/nobody')

    expect(result).toContain('could not be fetched')
  })

  it('returns a graceful message on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const result = await fetchGitHubData('https://github.com/ada')

    expect(result).toBe('GitHub data could not be fetched.')
  })

  it('sends an Authorization header when GITHUB_TOKEN is set', async () => {
    process.env.GITHUB_TOKEN = 'test-token'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'Ada', public_repos: 0, followers: 0, following: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetchMock)

    await fetchGitHubData('https://github.com/ada')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers['Authorization']).toBe('Bearer test-token')
  })
})
