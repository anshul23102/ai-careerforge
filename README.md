# AI CareerForge - Interview Readiness Assessment

![AI CareerForge](https://img.shields.io/badge/AI%20CareerForge-Interview%20Ready-8b5cf6?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![Groq AI](https://img.shields.io/badge/Groq-AI%20Powered-orange?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)

> Know if you're interview-ready - in under 2 minutes, powered by Groq AI.

---

## Live Demo

🟢 Live: [https://ai-careerforge.vercel.app](https://ai-careerforge.vercel.app)

---

## What Is AI CareerForge?

AI CareerForge is an AI-powered Interview Readiness Assessment tool that analyzes your profile across **4 critical dimensions** - Technical Skills, Resume Quality, Communication, and Portfolio Strength - and delivers a personalized score, strengths, improvement areas, and a concrete action plan.

Built for engineers at every stage: freshers, interns, and experienced developers looking to crack interviews at top tech companies.

---

## Features

- **4-Dimension Analysis** - Technical, Resume, Communication, Portfolio
- **AI-Powered by Groq** - Uses Llama 3.3 70B to deeply evaluate your profile
- **Personalized Action Plan** - Week-by-week roadmap tailored to your gaps
- **Visual Dashboard** - Animated score gauge, radar chart, progress bars
- **Multi-Step Form** - Clean, guided 4-step assessment with real-time validation
- **Instant Results** - Get your score in seconds, no account needed
- **Responsive & Immersive** - Dark glassmorphism UI with animations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Animations | Framer Motion v12 |
| Charts | Recharts v3 |
| Icons | Lucide React v1.16 |
| AI | Groq - Llama 3.3 70B (groq-sdk) |

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/anshul23102/ai-careerforge.git
cd ai-careerforge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your Groq API key

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get your free API key at [console.groq.com](https://console.groq.com) - no credit card required.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

```
Step 1: Fill Your Profile (~30 sec)
  └─ Name, email, target role, experience level, target companies

Step 2: Quick Skills Assessment (~60 sec)
  └─ Rate DSA, System Design, Coding, Projects, CS Fundamentals
  └─ Paste your resume / describe your background

Step 3: Portfolio & Communication
  └─ GitHub, LinkedIn, Portfolio URLs
  └─ Communication self-rating

→ Groq AI analyzes everything and returns your score
→ Redirect to personalized dashboard with charts and action plan
```

---

## Architecture Overview

```
app/
  page.tsx              - Landing page (Server Component)
  layout.tsx            - Root layout with Geist font
  globals.css           - Global styles + Tailwind v4
  assess/
    page.tsx            - Assessment page (imports client component)
  results/
    page.tsx            - Results page (Client Component, reads URL params)
  api/
    analyze/
      route.ts          - POST handler → Groq API → AnalysisResult JSON

components/
  AssessmentForm.tsx    - 4-step form with framer-motion transitions
  ResultsDashboard.tsx  - Animated results with Recharts radar chart

lib/
  types.ts              - AssessmentData & AnalysisResult TypeScript types
```

**Data flow:**
1. Form submits `AssessmentData` to `POST /api/analyze`
2. Route handler calls Groq (Llama 3.3 70B) with a structured prompt
3. AI returns `AnalysisResult` as JSON
4. Result is base64-encoded and passed as URL param to `/results`
5. Results page decodes and renders the dashboard

---

## Screenshots

_Add screenshots here_

---

## Demo Video

🎥 [Watch Demo](https://drive.google.com/your-demo-link)

---

## License

MIT © 2025 AI CareerForge
