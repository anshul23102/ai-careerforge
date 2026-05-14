'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  User, Mail, Briefcase, ChevronRight, ChevronLeft,
  FileText, Brain, GitBranch, Link2, Globe, MessageSquare,
  CheckCircle, Loader2, Clock
} from 'lucide-react'
import type { AssessmentData } from '../lib/types'

const ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'ML Engineer',
  'DevOps Engineer',
  'Product Manager',
  'Other',
]

const EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher', subtitle: 'No experience yet' },
  { value: 'intern', label: 'Intern/Student', subtitle: 'Currently studying or interning' },
  { value: '1-2years', label: '1–2 Years', subtitle: 'Junior engineer' },
  { value: '3-5years', label: '3–5 Years', subtitle: 'Mid-level engineer' },
] as const

const SKILLS = [
  { key: 'dsa', label: 'Data Structures & Algorithms', icon: '🧩' },
  { key: 'systemDesign', label: 'System Design', icon: '🏗️' },
  { key: 'projects', label: 'Projects & Practical Experience', icon: '🚀' },
  { key: 'coding', label: 'Coding Proficiency', icon: '💻' },
  { key: 'csFundamentals', label: 'CS Fundamentals', icon: '📚' },
] as const

const COMMUNICATION_LEVELS = [
  { rating: 1, label: 'Needs Work', emoji: '😅' },
  { rating: 2, label: 'Basic', emoji: '🙂' },
  { rating: 3, label: 'Good', emoji: '😊' },
  { rating: 4, label: 'Strong', emoji: '😎' },
  { rating: 5, label: 'Excellent', emoji: '🌟' },
]

function getSkillLabel(v: number): string {
  if (v <= 3) return 'Beginner'
  if (v <= 6) return 'Intermediate'
  if (v <= 9) return 'Advanced'
  return 'Expert'
}

function getSkillColor(v: number): string {
  if (v <= 3) return '#f97316'
  if (v <= 6) return '#eab308'
  if (v <= 9) return '#3b82f6'
  return '#22c55e'
}

const defaultFormData: AssessmentData = {
  name: '',
  email: '',
  targetRole: '',
  experienceLevel: 'fresher',
  targetCompanies: '',
  resumeText: '',
  skills: {
    dsa: 5,
    systemDesign: 5,
    projects: 5,
    coding: 5,
    csFundamentals: 5,
  },
  githubUrl: '',
  linkedinUrl: '',
  portfolioUrl: '',
  communicationRating: 3,
  hasProjects: false,
}

const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
}

export default function AssessmentForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState<AssessmentData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [elapsedTime, setElapsedTime] = useState(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function update<K extends keyof AssessmentData>(key: K, value: AssessmentData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  function updateSkill(key: keyof AssessmentData['skills'], value: number) {
    setFormData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [key]: value },
    }))
  }

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {}
    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required'
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
      if (!formData.targetRole) newErrors.targetRole = 'Please select a role'
    }
    if (currentStep === 2) {
      if (formData.resumeText.trim().length < 100)
        newErrors.resumeText = 'Please provide at least 100 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function goNext() {
    if (!validateStep()) return
    setDirection(1)
    setCurrentStep((s) => Math.min(s + 1, 4))
  }

  function goBack() {
    setDirection(-1)
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    if (!validateStep()) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const result = await res.json()
      const payload = { result, name: formData.name }
      const encoded = btoa(JSON.stringify(payload))
      router.push(`/results?data=${encoded}`)
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
      setIsSubmitting(false)
    }
  }

  const progressPct = ((currentStep - 1) / 3) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Background orbs */}
      <div className="orb orb-blue" style={{ width: 400, height: 400, top: 0, left: 0, opacity: 0.08 }} />
      <div className="orb orb-purple" style={{ width: 350, height: 350, bottom: 0, right: 0, opacity: 0.08 }} />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Interview Readiness</span> Assessment
          </h1>
          <p className="text-white/50">Answer a few quick questions for your personalized score</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-1.5"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                    style={{
                      background: s <= currentStep
                        ? 'linear-gradient(135deg, #6eb4ff, #a5b4fc)'
                        : 'rgba(255,255,255,0.06)',
                      color: s <= currentStep ? 'white' : 'rgba(255,255,255,0.3)',
                      boxShadow: s === currentStep ? '0 0 16px rgba(165,180,252,0.6)' : 'none',
                    }}
                  >
                    {s < currentStep ? <CheckCircle size={14} /> : s}
                  </div>
                  {s < 4 && (
                    <div
                      className="w-8 h-0.5 transition-all duration-500"
                      style={{
                        background: s < currentStep ? 'linear-gradient(90deg,#6eb4ff,#a5b4fc)' : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white/40">
              <Clock size={14} />
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-2 text-right text-xs text-white/30">Step {currentStep} of 4</div>
        </div>

        {/* Form card */}
        <div className="glass-strong rounded-3xl p-8 gradient-border overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* ── STEP 1: Profile ── */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Your Profile</h2>
                    <p className="text-white/40 text-sm">Tell us about yourself and your career goals</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        <User size={14} className="inline mr-1.5" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Alex Johnson"
                        value={formData.name}
                        onChange={(e) => update('name', e.target.value)}
                      />
                      {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        <Mail size={14} className="inline mr-1.5" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="alex@example.com"
                        value={formData.email}
                        onChange={(e) => update('email', e.target.value)}
                      />
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      <Briefcase size={14} className="inline mr-1.5" />
                      Target Role
                    </label>
                    <select
                      className="input-field"
                      value={formData.targetRole}
                      onChange={(e) => update('targetRole', e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.04)', color: formData.targetRole ? 'white' : 'rgba(255,255,255,0.3)' }}
                    >
                      <option value="" disabled style={{ background: '#0d0d1f' }}>Select your target role</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r} style={{ background: '#0d0d1f', color: 'white' }}>{r}</option>
                      ))}
                    </select>
                    {errors.targetRole && <p className="text-red-400 text-xs mt-1">{errors.targetRole}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-3">Experience Level</label>
                    <div className="grid grid-cols-2 gap-3">
                      {EXPERIENCE_LEVELS.map((el) => (
                        <button
                          key={el.value}
                          type="button"
                          onClick={() => update('experienceLevel', el.value)}
                          className="text-left p-4 rounded-2xl border transition-all duration-300"
                          style={{
                            background: formData.experienceLevel === el.value
                              ? 'rgba(165,180,252,0.15)'
                              : 'rgba(255,255,255,0.03)',
                            borderColor: formData.experienceLevel === el.value
                              ? 'rgba(165,180,252,0.5)'
                              : 'rgba(255,255,255,0.08)',
                            boxShadow: formData.experienceLevel === el.value
                              ? '0 0 20px rgba(165,180,252,0.2)'
                              : 'none',
                          }}
                        >
                          <div className="font-semibold text-white text-sm">{el.label}</div>
                          <div className="text-white/40 text-xs mt-0.5">{el.subtitle}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Target Companies
                      <span className="text-white/30 font-normal ml-2">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Google, Amazon, Startup..."
                      value={formData.targetCompanies}
                      onChange={(e) => update('targetCompanies', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 2: Resume ── */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Your Resume</h2>
                    <p className="text-white/40 text-sm">Paste your resume or describe your background</p>
                  </div>

                  <div
                    className="p-4 rounded-2xl text-sm flex items-start gap-3"
                    style={{ background: 'rgba(110,180,255,0.06)', border: '1px solid rgba(110,180,255,0.15)' }}
                  >
                    <span className="text-cyan-400 mt-0.5">💡</span>
                    <p className="text-white/60">
                      <strong className="text-white">Tip:</strong> Include your education, work experience, projects, skills, and achievements. The more detail you provide, the better your analysis will be.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      <FileText size={14} className="inline mr-1.5" />
                      Resume / Experience
                    </label>
                    <textarea
                      className="input-field resize-none"
                      rows={12}
                      placeholder="Paste your resume text here, or describe your:
• Education (degree, university, graduation year)
• Work experience (company, role, responsibilities, achievements)
• Projects (what you built, tech stack, impact)
• Skills (programming languages, frameworks, tools)
• Certifications or notable achievements..."
                      value={formData.resumeText}
                      onChange={(e) => update('resumeText', e.target.value)}
                      style={{ fontFamily: 'inherit', lineHeight: 1.6 }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      {errors.resumeText
                        ? <p className="text-red-400 text-xs">{errors.resumeText}</p>
                        : <span />
                      }
                      <span
                        className="text-xs"
                        style={{
                          color: formData.resumeText.length < 100
                            ? 'rgba(249,115,22,0.8)'
                            : 'rgba(255,255,255,0.3)'
                        }}
                      >
                        {formData.resumeText.length} chars {formData.resumeText.length < 100 && `(min 100)`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Technical Skills ── */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Technical Skills</h2>
                    <p className="text-white/40 text-sm">Rate yourself honestly - AI will calibrate the scores</p>
                  </div>

                  <div className="space-y-5">
                    {SKILLS.map(({ key, label, icon }) => {
                      const val = formData.skills[key]
                      const skillColor = getSkillColor(val)
                      const skillLabel = getSkillLabel(val)
                      const fillPct = ((val - 1) / 9) * 100

                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                              <span>{icon}</span>
                              {label}
                            </label>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                style={{
                                  background: `${skillColor}18`,
                                  color: skillColor,
                                  border: `1px solid ${skillColor}33`,
                                }}
                              >
                                {skillLabel}
                              </span>
                              <span
                                className="text-base font-bold w-6 text-center"
                                style={{ color: skillColor }}
                              >
                                {val}
                              </span>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="progress-bar mb-1" style={{ height: 4 }}>
                              <div
                                className="h-full rounded-full transition-all duration-200"
                                style={{
                                  width: `${fillPct}%`,
                                  background: `linear-gradient(90deg, ${skillColor}88, ${skillColor})`,
                                  boxShadow: `0 0 8px ${skillColor}66`,
                                }}
                              />
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              step={1}
                              value={val}
                              onChange={(e) => updateSkill(key, Number(e.target.value))}
                              className="absolute inset-0 w-full opacity-0 cursor-pointer"
                              style={{ height: '100%' }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-white/25">
                            <span>1 - Beginner</span>
                            <span>10 - Expert</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── STEP 4: Portfolio & Communication ── */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Portfolio & Communication</h2>
                    <p className="text-white/40 text-sm">Last step - your online presence and soft skills</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        <GitBranch size={14} className="inline mr-1.5" />
                        GitHub URL
                        <span className="text-white/30 font-normal ml-2">(optional)</span>
                      </label>
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://github.com/yourusername"
                        value={formData.githubUrl}
                        onChange={(e) => update('githubUrl', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        <Link2 size={14} className="inline mr-1.5" />
                        LinkedIn URL
                        <span className="text-white/30 font-normal ml-2">(optional)</span>
                      </label>
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={formData.linkedinUrl}
                        onChange={(e) => update('linkedinUrl', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        <Globe size={14} className="inline mr-1.5" />
                        Portfolio Website
                        <span className="text-white/30 font-normal ml-2">(optional)</span>
                      </label>
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://yourportfolio.dev"
                        value={formData.portfolioUrl}
                        onChange={(e) => update('portfolioUrl', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-3">
                      <MessageSquare size={14} className="inline mr-1.5" />
                      Communication Self-Rating
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {COMMUNICATION_LEVELS.map(({ rating, label, emoji }) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => update('communicationRating', rating)}
                          className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border transition-all duration-300"
                          style={{
                            background: formData.communicationRating === rating
                              ? 'rgba(165,180,252,0.2)'
                              : 'rgba(255,255,255,0.03)',
                            borderColor: formData.communicationRating === rating
                              ? 'rgba(165,180,252,0.6)'
                              : 'rgba(255,255,255,0.08)',
                            transform: formData.communicationRating === rating ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          <span className="text-2xl">{emoji}</span>
                          <span className="text-xs text-white/60 text-center leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={formData.hasProjects}
                        onChange={(e) => update('hasProjects', e.target.checked)}
                      />
                      <div
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300"
                        style={{
                          background: formData.hasProjects ? 'linear-gradient(135deg,#6eb4ff,#a5b4fc)' : 'transparent',
                          borderColor: formData.hasProjects ? '#a5b4fc' : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {formData.hasProjects && <CheckCircle size={12} className="text-white" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                        I have significant projects to showcase
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">
                        Side projects, open source contributions, or substantial work projects
                      </div>
                    </div>
                  </label>

                  {errors.submit && (
                    <div className="p-4 rounded-xl text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {errors.submit}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all duration-300 font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="btn-primary flex items-center gap-2"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Get My Score
                  <Brain size={18} />
                </>
              )}
            </button>
          )}
        </div>

        {/* Loading overlay */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center"
              style={{ background: 'rgba(5,5,15,0.92)', backdropFilter: 'blur(12px)' }}
            >
              <div className="orb orb-purple" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              <div className="relative z-10 text-center">
                <div className="text-5xl mb-6 animate-spin inline-block">⚡</div>
                <h3 className="text-2xl font-bold text-white mb-2">Analyzing Your Profile</h3>
                <p className="text-white/50 mb-8">AI is evaluating your readiness...</p>
                <div className="flex gap-3 justify-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 dot-1" />
                  <div className="w-3 h-3 rounded-full bg-purple-400 dot-2" />
                  <div className="w-3 h-3 rounded-full bg-pink-400 dot-3" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
