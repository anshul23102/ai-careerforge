import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import type { AssessmentData, AnalysisResult } from '../../../lib/types'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

function buildPrompt(data: AssessmentData): string {
  const skillAvg = Object.values(data.skills).reduce((a, b) => a + b, 0) / 5
  const hasGithub = !!data.githubUrl.trim()
  const hasLinkedin = !!data.linkedinUrl.trim()
  const hasPortfolio = !!data.portfolioUrl.trim()

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

**PORTFOLIO & PRESENCE**
- GitHub: ${hasGithub ? data.githubUrl : 'Not provided'}
- LinkedIn: ${hasLinkedin ? data.linkedinUrl : 'Not provided'}
- Portfolio: ${hasPortfolio ? data.portfolioUrl : 'Not provided'}
- Has significant projects: ${data.hasProjects ? 'Yes' : 'No'}
- Communication self-rating: ${data.communicationRating}/5

**INSTRUCTIONS**
Based on this profile, provide a comprehensive interview readiness assessment. Consider:
1. Technical depth relative to target role and experience level
2. Resume quality, clarity, and impact
3. Portfolio strength and professional presence
4. Communication confidence and articulation ability
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
  "summary": "<2-3 sentence personalized summary mentioning their name and target role>",
  "hireability": "<One sentence on overall hireability at target companies>"
}`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data: AssessmentData = await request.json()

    if (!data.name || !data.email || !data.targetRole || !data.resumeText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert career coach and technical recruiter with 15+ years of experience at top tech companies (Google, Amazon, Microsoft, Meta). Analyze candidate profiles and provide detailed, actionable interview readiness assessments. Always respond with valid JSON only - no markdown, no code fences, no extra text.',
        },
        {
          role: 'user',
          content: buildPrompt(data),
        },
      ],
    })

    let analysisText = completion.choices[0]?.message?.content?.trim() || ''

    // Strip any accidental markdown code fences
    if (analysisText.startsWith('```')) {
      analysisText = analysisText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
    }

    const result: AnalysisResult = JSON.parse(analysisText)

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Analysis error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    )
  }
}
