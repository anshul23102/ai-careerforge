import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { stripHtmlToText, type AssessmentData, type AnalysisResult } from '@ai-careerforge/shared'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Unauthenticated GitHub API calls share a 60 req/hr pool per IP across all
// users of this app. A token raises that to 5,000 req/hr. Falls back to
// unauthenticated calls if GITHUB_TOKEN isn't set — the app still works,
// just with the lower shared limit.
const githubHeaders: Record<string, string> = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'AI-CareerForge',
}
if (process.env.GITHUB_TOKEN) {
  githubHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
}

// ── Fetch real GitHub data via public API ──────────────────────────────────
async function fetchGitHubData(url: string): Promise<string> {
  try {
    const username = url.replace(/\/$/, '').split('/').pop()
    if (!username) return 'GitHub URL provided but username could not be extracted.'

    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: githubHeaders,
        next: { revalidate: 300 },
      }),
      fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6&type=owner`, {
        headers: githubHeaders,
        next: { revalidate: 300 },
      }),
    ])

    if (!userRes.ok) return `GitHub profile @${username} could not be fetched (may be private or invalid).`

    const user = await userRes.json()
    const repos = reposRes.ok ? await reposRes.json() : []

    const ownRepos = Array.isArray(repos)
      ? repos.filter((r: { fork: boolean }) => !r.fork)
      : []

    const repoSummary = ownRepos.length > 0
      ? ownRepos
          .slice(0, 5)
          .map((r: { name: string; description: string; stargazers_count: number; language: string; forks_count: number }) =>
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

// ── Fetch portfolio / personal site text ──────────────────────────────────
async function fetchPortfolioData(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-CareerForge-bot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return `Portfolio site returned status ${res.status}.`

    const text = stripHtmlToText(await res.text())

    if (!text) {
      return 'Portfolio site returned no readable text (it may require JavaScript rendering not supported here).'
    }

    return `Portfolio website content (${url}):\n${text}`
  } catch {
    return 'Portfolio site could not be fetched (may block bots or timed out).'
  }
}

// ── Build the main AI prompt ───────────────────────────────────────────────
function buildPrompt(data: AssessmentData, enriched: { github: string; portfolio: string }): string {
  const skillAvg = Object.values(data.skills).reduce((a, b) => a + b, 0) / 5
  const hasLinkedin = !!data.linkedinUrl.trim()

  return `Analyze this candidate profile and provide an interview readiness assessment:

**CANDIDATE PROFILE**
- Name: ${data.name}
- Target Role: ${data.targetRole}
- Experience Level: ${data.experienceLevel}
- Target Companies: ${data.targetCompanies || 'Not specified'}

**RESUME / EXPERIENCE**
${data.resumeText}

**TECHNICAL SKILLS (self-rated 1-10)**
- Data Structures & Algorithms: ${data.skills.dsa}/10
- System Design: ${data.skills.systemDesign}/10
- Projects & Practical Experience: ${data.skills.projects}/10
- Coding Proficiency: ${data.skills.coding}/10
- CS Fundamentals: ${data.skills.csFundamentals}/10
- Average: ${skillAvg.toFixed(1)}/10

**PORTFOLIO & ONLINE PRESENCE**
- LinkedIn: ${hasLinkedin ? data.linkedinUrl + ' (provided — factor in professional presence)' : 'Not provided'}
- Has significant projects: ${data.hasProjects ? 'Yes' : 'No'}
- Communication self-rating: ${data.communicationRating}/5

**LIVE GITHUB DATA (fetched in real-time)**
${enriched.github}

**LIVE PORTFOLIO DATA (fetched in real-time)**
${enriched.portfolio}

**INSTRUCTIONS**
Based on this complete profile (including real GitHub and portfolio data above), provide a comprehensive interview readiness assessment. The GitHub and portfolio data is real — use specific details from it (repo names, languages, stars, bio) to make your feedback concrete and personalized. Consider:
1. Technical depth relative to target role and experience level
2. Resume quality, clarity, and impact
3. Portfolio strength — use actual repo data to assess project quality
4. Communication confidence
5. Overall readiness for interviews at the target companies

Return ONLY valid JSON (no markdown, no code blocks, no extra text) with this exact structure:
{
  "overall_score": <integer 0-100>,
  "level": "<Beginner|Intermediate|Advanced|Expert>",
  "dimensions": {
    "technical": <integer 0-100>,
    "resume": <integer 0-100>,
    "communication": <integer 0-100>,
    "portfolio": <integer 0-100>
  },
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": [
    {"area": "<area>", "suggestion": "<actionable suggestion>", "priority": "<High|Medium|Low>"},
    {"area": "<area>", "suggestion": "<actionable suggestion>", "priority": "<High|Medium|Low>"},
    {"area": "<area>", "suggestion": "<actionable suggestion>", "priority": "<High|Medium|Low>"},
    {"area": "<area>", "suggestion": "<actionable suggestion>", "priority": "<High|Medium|Low>"}
  ],
  "action_plan": [
    {"timeframe": "This Week", "tasks": ["<task1>", "<task2>", "<task3>"]},
    {"timeframe": "Next 2-3 Weeks", "tasks": ["<task1>", "<task2>", "<task3>"]},
    {"timeframe": "Next 1-2 Months", "tasks": ["<task1>", "<task2>", "<task3>"]}
  ],
  "summary": "<2-3 sentence personalized summary mentioning their name, target role, and specific details from their GitHub/portfolio>",
  "hireability": "<One sentence on overall hireability at target companies>"
}`
}

const SYSTEM_PROMPT = 'You are an expert career coach and technical recruiter with 15+ years of experience at top tech companies (Google, Amazon, Microsoft, Meta). Analyze candidate profiles and provide detailed, actionable interview readiness assessments. When real GitHub or portfolio data is provided, reference specific projects and details in your feedback. Always respond with valid JSON only - no markdown, no code fences, no extra text.'

function stripCodeFence(text: string): string {
  return text.startsWith('```')
    ? text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
    : text
}

// ── Call the model and parse its JSON, retrying once with the parse error if malformed ──
async function getAnalysis(prompt: string): Promise<AnalysisResult> {
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ]

  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await client.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      max_tokens: 2048,
      temperature: 0.3,
      messages,
    })

    const raw = completion.choices[0]?.message?.content?.trim() || ''
    const analysisText = stripCodeFence(raw)

    try {
      return JSON.parse(analysisText) as AnalysisResult
    } catch (parseError) {
      if (attempt === 1) throw parseError
      const message = parseError instanceof Error ? parseError.message : 'Unknown parse error'
      messages.push(
        { role: 'assistant', content: raw },
        { role: 'user', content: `That response failed to parse as JSON: ${message}. Return ONLY the corrected, valid JSON object matching the required schema, no markdown, no extra text.` }
      )
    }
  }

  throw new Error('unreachable')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data: AssessmentData = await request.json()

    if (!data.name || !data.email || !data.targetRole || !data.resumeText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch GitHub + portfolio data in parallel (non-blocking — failures return graceful strings)
    const [githubData, portfolioData] = await Promise.all([
      data.githubUrl?.trim()    ? fetchGitHubData(data.githubUrl)       : Promise.resolve('GitHub URL not provided.'),
      data.portfolioUrl?.trim() ? fetchPortfolioData(data.portfolioUrl) : Promise.resolve('Portfolio URL not provided.'),
    ])

    const prompt = buildPrompt(data, { github: githubData, portfolio: portfolioData })
    const result = await getAnalysis(prompt)
    return NextResponse.json(result)

  } catch (error: unknown) {
    console.error('Analysis error:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Analysis failed: ${message}` }, { status: 500 })
  }
}
