'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts'
import {
  Brain, FileText, MessageSquare, Briefcase,
  CheckCircle, AlertTriangle, ArrowRight, RotateCcw, Share2,
  TrendingUp, Target, Zap, X, Link2, Download
} from 'lucide-react'
import Link from 'next/link'
import type { AnalysisResult } from '../lib/types'

interface ResultsDashboardProps {
  result: AnalysisResult
  candidateName: string
}

function getLevelColor(level: AnalysisResult['level']): string {
  switch (level) {
    case 'Beginner': return '#f97316'
    case 'Intermediate': return '#eab308'
    case 'Advanced': return '#3b82f6'
    case 'Expert': return '#34d399'
  }
}

function getPriorityColor(priority: string): string {
  if (priority === 'High') return '#ef4444'
  if (priority === 'Medium') return '#eab308'
  return '#34d399'
}

const dimensionConfig = [
  {
    key: 'technical', label: 'Technical', icon: Brain,
    color: '#6eb4ff', bg: 'rgba(110,180,255,0.12)', border: 'rgba(110,180,255,0.25)',
    what: 'DSA, system design, coding & CS fundamentals',
    insights: [
      { max: 30, text: 'Core technical concepts need significant work before interviews' },
      { max: 50, text: 'Basic knowledge present — consistent practice on DSA will help' },
      { max: 70, text: 'Solid foundation, focus on system design and problem solving depth' },
      { max: 85, text: 'Strong technical profile — polish edge cases and complexity analysis' },
      { max: 100, text: 'Excellent technical depth — ready for top-tier engineering interviews' },
    ],
  },
  {
    key: 'resume', label: 'Resume', icon: FileText,
    color: '#a5b4fc', bg: 'rgba(165,180,252,0.12)', border: 'rgba(165,180,252,0.25)',
    what: 'Clarity, impact, experience & presentation quality',
    insights: [
      { max: 30, text: 'Resume needs a full rewrite — structure, impact and keywords are weak' },
      { max: 50, text: 'Resume conveys basics but lacks strong impact statements and metrics' },
      { max: 70, text: 'Good resume overall — add quantified achievements to stand out more' },
      { max: 85, text: 'Well-structured resume that communicates value clearly to recruiters' },
      { max: 100, text: 'Outstanding resume — highly likely to clear ATS and impress recruiters' },
    ],
  },
  {
    key: 'communication', label: 'Communication', icon: MessageSquare,
    color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.25)',
    what: 'Clarity of expression, articulation & confidence',
    insights: [
      { max: 30, text: 'Communication gaps may significantly affect interview performance' },
      { max: 50, text: 'Can convey ideas but struggles under pressure — practice mock interviews' },
      { max: 70, text: 'Communicates reasonably well — work on concise, structured answers' },
      { max: 85, text: 'Strong communicator — can articulate technical concepts with confidence' },
      { max: 100, text: 'Exceptional communication — a clear differentiator in any interview' },
    ],
  },
  {
    key: 'portfolio', label: 'Portfolio', icon: Briefcase,
    color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)',
    what: 'GitHub, projects, LinkedIn & online presence',
    insights: [
      { max: 30, text: 'Online presence is minimal — start building projects and profiles now' },
      { max: 50, text: 'Some presence exists but projects lack depth or visibility' },
      { max: 70, text: 'Decent portfolio — make projects more impactful and document them well' },
      { max: 85, text: 'Strong portfolio presence that validates your technical credibility' },
      { max: 100, text: 'Impressive portfolio — projects speak volumes to any hiring team' },
    ],
  },
] as const

function getDimensionInsight(insights: readonly { max: number; text: string }[], score: number): string {
  return insights.find(i => score <= i.max)?.text ?? insights[insights.length - 1].text
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

export default function ResultsDashboard({ result, candidateName }: ResultsDashboardProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [strokeOffset, setStrokeOffset] = useState(440)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [barWidths, setBarWidths] = useState<Record<string, number>>({
    technical: 0,
    resume: 0,
    communication: 0,
    portfolio: 0,
  })
  const hasAnimated = useRef(false)

  const circumference = 2 * Math.PI * 70 // r=70
  const targetOffset = circumference - (result.overall_score / 100) * circumference

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    // Score count-up
    const duration = 1500
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * result.overall_score))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    // SVG gauge
    setTimeout(() => {
      setStrokeOffset(targetOffset)
    }, 200)

    // Bar widths
    setTimeout(() => {
      setBarWidths({
        technical: result.dimensions.technical,
        resume: result.dimensions.resume,
        communication: result.dimensions.communication,
        portfolio: result.dimensions.portfolio,
      })
    }, 400)
  }, [result, targetOffset])

  const radarData = [
    { subject: 'Technical', score: result.dimensions.technical },
    { subject: 'Resume', score: result.dimensions.resume },
    { subject: 'Communication', score: result.dimensions.communication },
    { subject: 'Portfolio', score: result.dimensions.portfolio },
  ]

  const levelColor = getLevelColor(result.level)
  const firstName = candidateName.split(' ')[0]

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleLinkedIn() {
    const text = `Just assessed my Interview Readiness on AI CareerForge!\n\n My Score: ${result.overall_score}/100 - ${result.level} level\n Technical: ${result.dimensions.technical} | Resume: ${result.dimensions.resume} | Communication: ${result.dimensions.communication} | Portfolio: ${result.dimensions.portfolio}\n\nCheck yours: ${window.location.origin}`
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  function handleTwitter() {
    const text = `Just got my Interview Readiness Score on AI CareerForge!\n\nScore: ${result.overall_score}/100 (${result.level})\nTechnical: ${result.dimensions.technical} | Resume: ${result.dimensions.resume}\n\nCheck yours for free:`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin)}`
    window.open(url, '_blank')
  }

  function handleDownloadCard() {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    const ctx = canvas.getContext('2d')!

    // Background
    const bg = ctx.createLinearGradient(0, 0, 1200, 630)
    bg.addColorStop(0, '#07080f')
    bg.addColorStop(0.5, '#0d0520')
    bg.addColorStop(1, '#07080f')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1200, 630)

    // Grid lines
    ctx.strokeStyle = 'rgba(165,180,252,0.08)'
    ctx.lineWidth = 1
    for (let x = 0; x < 1200; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 630); ctx.stroke() }
    for (let y = 0; y < 630; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke() }

    // Glow orb left
    const glow1 = ctx.createRadialGradient(150, 150, 0, 150, 150, 300)
    glow1.addColorStop(0, 'rgba(110,180,255,0.15)')
    glow1.addColorStop(1, 'transparent')
    ctx.fillStyle = glow1
    ctx.fillRect(0, 0, 600, 400)

    // Glow orb right
    const glow2 = ctx.createRadialGradient(1050, 480, 0, 1050, 480, 280)
    glow2.addColorStop(0, 'rgba(165,180,252,0.2)')
    glow2.addColorStop(1, 'transparent')
    ctx.fillStyle = glow2
    ctx.fillRect(600, 200, 600, 430)

    // Brand
    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fillText('AI CareerForge', 60, 60)

    // Title
    ctx.font = 'bold 42px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillText('Interview Readiness Score', 60, 130)

    // Name
    ctx.font = '500 26px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillText(candidateName, 60, 175)

    // Big score
    const scoreGrad = ctx.createLinearGradient(60, 200, 300, 380)
    scoreGrad.addColorStop(0, '#6eb4ff')
    scoreGrad.addColorStop(0.5, '#a5b4fc')
    scoreGrad.addColorStop(1, '#c084fc')
    ctx.font = 'bold 160px system-ui, sans-serif'
    ctx.fillStyle = scoreGrad
    ctx.fillText(`${result.overall_score}`, 60, 380)
    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillText('/ 100', 60, 430)

    // Level badge
    const lc = getLevelColor(result.level)
    ctx.beginPath()
    ctx.roundRect(60, 460, 170, 46, 23)
    ctx.fillStyle = `${lc}22`
    ctx.fill()
    ctx.strokeStyle = `${lc}55`
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.font = 'bold 20px system-ui, sans-serif'
    ctx.fillStyle = lc
    ctx.textAlign = 'center'
    ctx.fillText(result.level, 145, 489)
    ctx.textAlign = 'left'

    // Dimension bars (right side)
    const dims = [
      { label: 'Technical', value: result.dimensions.technical, color: '#6eb4ff' },
      { label: 'Resume', value: result.dimensions.resume, color: '#a5b4fc' },
      { label: 'Communication', value: result.dimensions.communication, color: '#c084fc' },
      { label: 'Portfolio', value: result.dimensions.portfolio, color: '#34d399' },
    ]
    const startX = 520
    dims.forEach((d, i) => {
      const y = 200 + i * 95
      ctx.font = 'bold 20px system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText(d.label, startX, y)
      ctx.font = 'bold 24px system-ui, sans-serif'
      ctx.fillStyle = d.color
      ctx.textAlign = 'right'
      ctx.fillText(`${d.value}`, 1140, y)
      ctx.textAlign = 'left'
      // Track
      ctx.beginPath()
      ctx.roundRect(startX, y + 12, 580, 10, 5)
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      ctx.fill()
      // Fill
      ctx.beginPath()
      ctx.roundRect(startX, y + 12, (580 * d.value) / 100, 10, 5)
      ctx.fillStyle = d.color
      ctx.fill()
    })

    // Footer
    ctx.font = '18px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillText('ai-careerforge.vercel.app', 60, 590)

    // Download
    const link = document.createElement('a')
    link.download = `${candidateName.replace(/\s+/g, '-')}-readiness-score.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="min-h-screen bg-[#07080f]">
      {/* Home nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-semibold text-white/70 hover:text-white border border-white/08 hover:border-purple-500/30 transition-all duration-300"
        >
          <span className="text-base">←</span>
          AI CareerForge
        </Link>
      </nav>

      {/* ── HERO SCORE SECTION ── */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden grid-bg">
        <div className="orb orb-blue" style={{ width: 500, height: 500, top: '-20%', left: '-10%', opacity: 0.12 }} />
        <div className="orb orb-purple" style={{ width: 450, height: 450, bottom: '-20%', right: '-10%', opacity: 0.12 }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-white/60 mb-6 border border-purple-500/20">
              <Zap size={14} className="text-yellow-400" />
              Assessment Complete
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Hello, <span className="gradient-text">{firstName}!</span>
            </h1>
            <p className="text-white/50 text-lg mb-12 max-w-xl mx-auto">{result.summary}</p>
          </motion.div>

          {/* Circular Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="relative inline-block">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6eb4ff" />
                    <stop offset="50%" stopColor="#a5b4fc" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
                <circle
                  cx="100" cy="100" r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="12"
                />
                <circle
                  cx="100" cy="100" r="70"
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold text-white score-appear">{displayScore}</span>
                <span className="text-white/40 text-sm">out of 100</span>
              </div>
            </div>

            <div
              className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base"
              style={{
                background: `${levelColor}18`,
                color: levelColor,
                border: `1px solid ${levelColor}33`,
                boxShadow: `0 0 20px ${levelColor}22`,
              }}
            >
              <TrendingUp size={16} />
              {result.level}
            </div>

            <p className="mt-4 text-white/50 text-sm max-w-md mx-auto">{result.hireability}</p>
          </motion.div>
        </div>
      </section>

      <motion.div
        className="max-w-5xl mx-auto px-6 py-16 space-y-16"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* ── DIMENSION SCORES ── */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Target size={22} className="text-purple-400" />
            Dimension Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {dimensionConfig.map(({ key, label, icon: Icon, color, bg, border, what, insights }) => {
              const score = result.dimensions[key]
              const insight = getDimensionInsight(insights, score)
              return (
                <div
                  key={key}
                  className="glass rounded-2xl p-6"
                  style={{ border: `1px solid ${border}`, background: bg }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-xl"
                        style={{ background: `${color}18`, border: `1px solid ${color}22` }}
                      >
                        <Icon size={18} style={{ color }} />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{label}</div>
                        <div className="text-white/35 text-xs">{what}</div>
                      </div>
                    </div>
                    <span className="text-2xl font-bold flex-shrink-0" style={{ color }}>
                      {score}
                    </span>
                  </div>
                  <div className="progress-bar mt-4">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${barWidths[key] ?? 0}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                        boxShadow: `0 0 10px ${color}55`,
                        transitionDelay: '500ms',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-white/30">
                    <span>0</span>
                    <span>100</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: `${color}bb` }}>
                    {insight}
                  </p>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ── RADAR CHART ── */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Brain size={22} className="text-cyan-400" />
            Skills Radar
          </h2>
          <div className="glass rounded-2xl p-6 border border-white/05">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid
                  stroke="rgba(255,255,255,0.08)"
                  gridType="polygon"
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#a5b4fc"
                  fill="#a5b4fc"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ fill: '#a5b4fc', r: 4 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* ── STRENGTHS ── */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle size={22} className="text-green-400" />
            Your Strengths
          </h2>
          <div className="space-y-3">
            {result.strengths.map((strength, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="flex items-start gap-4 glass rounded-2xl p-5 border border-green-500/15"
                style={{ background: 'rgba(34,197,94,0.05)' }}
              >
                <div
                  className="p-1.5 rounded-full mt-0.5 flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.2)' }}
                >
                  <CheckCircle size={16} className="text-green-400" />
                </div>
                <p className="text-white/80 leading-relaxed">{strength}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── IMPROVEMENTS ── */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertTriangle size={22} className="text-yellow-400" />
            Areas to Improve
          </h2>
          <div className="space-y-4">
            {result.improvements.map((imp, i) => {
              const pc = getPriorityColor(imp.priority)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i + 0.3 }}
                  className="glass rounded-2xl p-5 border"
                  style={{ borderColor: `${pc}25`, background: `${pc}05` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-semibold text-white">{imp.area}</span>
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: `${pc}18`,
                        color: pc,
                        border: `1px solid ${pc}33`,
                      }}
                    >
                      {imp.priority}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">{imp.suggestion}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ── ACTION PLAN ── */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <ArrowRight size={22} className="text-blue-400" />
            Your Action Plan
          </h2>
          <div className="space-y-6">
            {result.action_plan.map((phase, i) => {
              const colors = ['#6eb4ff', '#a5b4fc', '#c084fc']
              const c = colors[i % colors.length]
              return (
                <div key={i} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: `${c}18`, border: `1px solid ${c}33`, color: c }}
                    >
                      {i + 1}
                    </div>
                    {i < result.action_plan.length - 1 && (
                      <div className="w-px flex-1 mt-2" style={{ background: `${c}30` }} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div
                      className="text-sm font-semibold mb-3 px-3 py-1 rounded-full inline-block"
                      style={{ background: `${c}12`, color: c, border: `1px solid ${c}25` }}
                    >
                      {phase.timeframe}
                    </div>
                    <div className="glass rounded-2xl p-5 space-y-2 border border-white/05">
                      {phase.tasks.map((task, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${c}15`, border: `1px solid ${c}25` }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                          </div>
                          <span className="text-white/70 text-sm leading-relaxed">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ── CTA ── */}
        <motion.section variants={item} className="text-center py-8">
          <div className="glass-strong rounded-3xl p-10 gradient-border">
            <h2 className="text-2xl font-bold text-white mb-2">Take the Next Step</h2>
            <p className="text-white/50 mb-8">Use your personalized plan to land your dream role.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center justify-center gap-2 px-7 py-3 rounded-full font-semibold transition-all duration-300"
                style={{
                  background: 'rgba(165,180,252,0.15)',
                  border: '1px solid rgba(165,180,252,0.35)',
                  color: '#a5b4fc',
                }}
              >
                <Share2 size={18} />
                Share Your Score
              </button>
              <Link
                href="/assess"
                className="btn-primary flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Start Over
              </Link>
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* ── SHARE MODAL ── */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong rounded-3xl p-8 w-full max-w-md gradient-border"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Share Your Score</h3>
                  <p className="text-white/40 text-sm mt-0.5">
                    {result.overall_score}/100 - {result.level} level
                  </p>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 rounded-full hover:bg-white/08 transition-colors text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Share options */}
              <div className="space-y-3">
                {/* LinkedIn */}
                <button
                  onClick={handleLinkedIn}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] group"
                  style={{ background: 'rgba(10,102,194,0.12)', border: '1px solid rgba(10,102,194,0.25)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                    style={{ background: 'rgba(10,102,194,0.2)', color: '#0a66c2' }}>
                    in
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-sm">Share on LinkedIn</div>
                    <div className="text-white/40 text-xs">Post your score to your professional network</div>
                  </div>
                  <ArrowRight size={16} className="text-white/30 ml-auto group-hover:text-white/60 transition-colors" />
                </button>

                {/* Twitter / X */}
                <button
                  onClick={handleTwitter}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] group"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>
                    𝕏
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-sm">Share on X / Twitter</div>
                    <div className="text-white/40 text-xs">Tweet your readiness score</div>
                  </div>
                  <ArrowRight size={16} className="text-white/30 ml-auto group-hover:text-white/60 transition-colors" />
                </button>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] group"
                  style={{
                    background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(165,180,252,0.1)',
                    border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(165,180,252,0.25)'}`,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(165,180,252,0.2)', color: copied ? '#34d399' : '#a5b4fc' }}>
                    <Link2 size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm" style={{ color: copied ? '#34d399' : 'white' }}>
                      {copied ? 'Link Copied!' : 'Copy Shareable Link'}
                    </div>
                    <div className="text-white/40 text-xs">Anyone with this link can view your results</div>
                  </div>
                  {copied && <CheckCircle size={16} className="text-green-400 ml-auto" />}
                </button>

                {/* Download Card */}
                <button
                  onClick={handleDownloadCard}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] group"
                  style={{ background: 'rgba(110,180,255,0.08)', border: '1px solid rgba(110,180,255,0.2)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(110,180,255,0.15)', color: '#6eb4ff' }}>
                    <Download size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-sm">Download Score Card</div>
                    <div className="text-white/40 text-xs">Save a beautiful PNG card of your results</div>
                  </div>
                  <ArrowRight size={16} className="text-white/30 ml-auto group-hover:text-white/60 transition-colors" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
