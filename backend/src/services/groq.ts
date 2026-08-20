import Groq from 'groq-sdk'
import type { AssessmentData, AnalysisResult } from '@ai-careerforge/shared'

const SYSTEM_PROMPT = 'You are an expert career coach and technical recruiter with 15+ years of experience at top tech companies (Google, Amazon, Microsoft, Meta). Analyze candidate profiles and provide detailed, actionable interview readiness assessments. When real GitHub or portfolio data is provided, reference specific projects and details in your feedback. Always respond with valid JSON only - no markdown, no code fences, no extra text.'

export function buildPrompt(
  data: AssessmentData & { name: string },
  enriched: { github: string; portfolio: string }
): string {
  const skillAvg = Object.values(data.skills).reduce((a, b) => a + b, 0) / 5
  const hasLinkedin = !!data.linkedinUrl?.trim()

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

function stripCodeFence(text: string): string {
  return text.startsWith('```')
    ? text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
    : text
}

// Calls the model and parses its JSON, retrying once with the parse error
// fed back to the model if the first response is malformed.
export async function getAnalysis(prompt: string, client: Groq): Promise<AnalysisResult> {
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
