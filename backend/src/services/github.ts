// Unauthenticated GitHub API calls share a 60 req/hr pool per IP across all
// users of this app. A token raises that to 5,000 req/hr. Falls back to
// unauthenticated calls if GITHUB_TOKEN isn't set — the app still works,
// just with the lower shared limit.
function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AI-CareerForge',
  }
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

interface GitHubRepo {
  fork: boolean
  name: string
  description: string | null
  stargazers_count: number
  language: string | null
  forks_count: number
}

interface GitHubUser {
  name: string | null
  bio: string | null
  public_repos: number
  followers: number
  following: number
  created_at?: string
}

export async function fetchGitHubData(url: string): Promise<string> {
  try {
    const username = url.replace(/\/$/, '').split('/').pop()
    if (!username) return 'GitHub URL provided but username could not be extracted.'

    const headers = githubHeaders()
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6&type=owner`, { headers }),
    ])

    if (!userRes.ok) return `GitHub profile @${username} could not be fetched (may be private or invalid).`

    const user = await userRes.json() as GitHubUser
    const repos = (reposRes.ok ? await reposRes.json() : []) as GitHubRepo[]
    const ownRepos = Array.isArray(repos) ? repos.filter((r) => !r.fork) : []

    const repoSummary = ownRepos.length > 0
      ? ownRepos
          .slice(0, 5)
          .map((r) =>
            `  - ${r.name}${r.description ? ': ' + r.description : ''} [${r.language || 'N/A'}, ${r.stargazers_count} stars, ${r.forks_count} forks]`
          )
          .join('\n')
      : '  No public repositories found.'

    return `GitHub Profile (@${username}):
  - Name: ${user.name || username}
  - Bio: ${user.bio || 'Not provided'}
  - Public repos: ${user.public_repos}
  - Followers: ${user.followers} | Following: ${user.following}
  - Account created: ${user.created_at?.slice(0, 10)}
  Top repositories:
${repoSummary}`
  } catch {
    return 'GitHub data could not be fetched.'
  }
}
