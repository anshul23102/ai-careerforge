export interface AssessmentData {
  // Step 1: Profile
  name: string
  email: string
  targetRole: string
  experienceLevel: 'fresher' | 'intern' | '1-2years' | '3-5years'
  targetCompanies: string

  // Step 2: Resume
  resumeText: string

  // Step 3: Technical Skills (1-10)
  skills: {
    dsa: number
    systemDesign: number
    projects: number
    coding: number
    csFundamentals: number
  }

  // Step 4: Portfolio & Communication
  githubUrl: string
  linkedinUrl: string
  portfolioUrl: string
  communicationRating: number // 1-5
  hasProjects: boolean
}

export interface AnalysisResult {
  overall_score: number
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  dimensions: {
    technical: number
    resume: number
    communication: number
    portfolio: number
  }
  strengths: string[]
  improvements: Array<{
    area: string
    suggestion: string
    priority: 'High' | 'Medium' | 'Low'
  }>
  action_plan: Array<{
    timeframe: string
    tasks: string[]
  }>
  summary: string
  hireability: string
}
