<div align="center">

# ⚡ AI CareerForge

### Know if you're interview-ready in under 2 minutes.

[![Live Demo](https://img.shields.io/badge/🟢_Live_Demo-ai--careerforge.vercel.app-6eb4ff?style=for-the-badge)](https://ai-careerforge.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Groq AI](https://img.shields.io/badge/Groq-Llama_3.3_70B-f97316?style=for-the-badge)](https://groq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

</div>

<br/>

## 🎯 What is AI CareerForge?

**AI CareerForge** is an AI-powered Interview Readiness Assessment tool that evaluates your profile across **4 critical dimensions** and delivers a personalised score from 0 to 100, with specific strengths, actionable improvements, and a week-by-week action plan.

Built for engineers at every stage: freshers, interns, and experienced developers who want to know exactly where they stand before walking into their next interview.

> No signup. No credit card. Results in under 2 minutes. Completely free.

<br/>

## 📸 Screenshots
<img width="1420" height="702" alt="Screenshot 2026-05-14 at 9 52 15 PM" src="https://github.com/user-attachments/assets/3e948476-9d0e-43b8-bffb-4293c4426149" />

<img width="1406" height="702" alt="Screenshot 2026-05-14 at 9 52 33 PM" src="https://github.com/user-attachments/assets/32c1f82e-213d-4aef-a238-daae9ecf3dee" />

<img width="1447" height="700" alt="Screenshot 2026-05-14 at 9 56 03 PM" src="https://github.com/user-attachments/assets/6ee5d26a-f146-4661-99a7-1633e0bca96f" />

<img width="1432" height="692" alt="Screenshot 2026-05-14 at 9 56 10 PM" src="https://github.com/user-attachments/assets/025f6a78-7e4f-4245-8ece-70a1638f518b" />




<br/>

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🧠 | **4-Dimension AI Analysis** | Technical Skills, Resume Quality, Communication, Portfolio Strength |
| 🤖 | **Real Groq AI** | Llama 3.3 70B analyzes your full profile with deep context |
| 🐙 | **Live GitHub Fetch** | Pulls your real repos, languages, stars and bio via GitHub API |
| 🌐 | **Portfolio Scraping** | Reads your actual portfolio site and factors it into scoring |
| 📊 | **Visual Dashboard** | Animated score gauge, radar chart, dimension bars with insights |
| 🗓️ | **Personalised Action Plan** | Week-by-week roadmap tailored to your specific gaps |
| 🔗 | **Share Your Score** | LinkedIn, X, copy link, or download a PNG score card |
| 🎨 | **Premium Dark UI** | Apple-inspired design with interactive cursor mesh background |
| ⚡ | **Instant Results** | Groq inference in seconds. No waiting, no account needed |

<br/>

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| ⚛️ Framework | Next.js 16.2 (App Router) |
| 📘 Language | TypeScript 5 |
| 🎨 Styling | Tailwind CSS v4 |
| ✨ Animations | Framer Motion v12 |
| 📈 Charts | Recharts v3 |
| 🎯 Icons | Lucide React |
| 🤖 AI Model | Groq — Llama 3.3 70B |
| 🖼️ Canvas FX | Custom Spring Physics Mesh |
| 🚀 Deployment | Vercel |

<br/>

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/anshul23102/ai-careerforge.git
cd ai-careerforge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your Groq API key

Create a `.env.local` file in the root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> 🔑 Get your **free** API key at [console.groq.com](https://console.groq.com). No credit card required.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

<br/>

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     USER JOURNEY                            │
├─────────────────────────────────────────────────────────────┤
│  Step 1 (~30s)  │  Profile: name, role, experience, goals   │
│  Step 2 (~45s)  │  Resume: upload PDF/DOCX/DOC/RTF/TEX/TXT  │
│  Step 3 (~30s)  │  Skills: rate DSA, design, coding 1 to 10 │
│  Step 4 (~15s)  │  Portfolio: GitHub, LinkedIn, site URLs   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │  POST /api/analyze                 │
        │  ├── Fetch GitHub API (live data)  │
        │  ├── Scrape portfolio site         │
        │  └── Call Groq Llama 3.3 70B       │
        └────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │  Results Dashboard                 │
        │  ├── 0 to 100 readiness score      │
        │  ├── 4-dimension breakdown         │
        │  ├── Strengths and improvements    │
        │  └── Week-by-week action plan      │
        └────────────────────────────────────┘
```

<br/>

## 🏗️ Project Structure

```
ai-careerforge/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout (Space Grotesk font)
│   ├── globals.css              # Design system + Tailwind v4
│   ├── assess/
│   │   └── page.tsx             # Assessment page
│   ├── results/
│   │   └── page.tsx             # Results page (reads URL params)
│   └── api/
│       └── analyze/
│           └── route.ts         # AI analysis endpoint
│
├── components/
│   ├── AssessmentForm.tsx       # 4-step form with animations
│   ├── ResultsDashboard.tsx     # Score + charts + action plan
│   ├── InteractiveMesh.tsx      # Canvas cursor-reactive mesh
│   └── StarField.tsx            # Parallax star background
│
└── lib/
    └── types.ts                 # AssessmentData & AnalysisResult types
```

<br/>

## 🤖 AI Prompt Architecture

The analysis prompt sent to Groq includes:

- ✅ Candidate profile (role, experience, target companies)
- ✅ Full resume text
- ✅ Self-rated skill scores (calibrated by experience level)
- ✅ **Live GitHub data** — bio, repos, languages, stars (fetched via GitHub API)
- ✅ **Portfolio content** — scraped from the actual website
- ✅ Communication self-rating

The AI returns structured JSON scored across 4 dimensions with strengths, prioritised improvements, and a phased action plan. All personalised with specific details from your real profile.

<br/>

## 📄 License

MIT © 2026 AI CareerForge
