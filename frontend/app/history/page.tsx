'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, ArrowRight, Brain } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { listAssessments, type AssessmentSummary } from '../../lib/backend'

function getLevelColor(level?: string): string {
  switch (level) {
    case 'Beginner': return '#f97316'
    case 'Intermediate': return '#eab308'
    case 'Advanced': return '#3b82f6'
    case 'Expert': return '#34d399'
    default: return '#94a3b8'
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const { token, isLoading: isAuthLoading } = useAuth()
  const [assessments, setAssessments] = useState<AssessmentSummary[] | null>(null)

  useEffect(() => {
    if (isAuthLoading) return
    if (!token) {
      router.push('/login')
      return
    }
    listAssessments(token).then((data) => setAssessments(data.assessments))
  }, [isAuthLoading, token, router])

  return (
    <div className="min-h-screen px-4 py-16 relative">
      <div className="orb orb-blue" style={{ width: 400, height: 400, top: 0, left: 0, opacity: 0.08 }} />
      <div className="orb orb-purple" style={{ width: 350, height: 350, bottom: 0, right: 0, opacity: 0.08 }} />

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Your <span className="gradient-text">Assessment History</span>
          </h1>
          <p className="text-white/50">Every readiness score you&apos;ve earned, in one place</p>
        </div>

        {assessments === null && (
          <div className="flex justify-center py-16">
            <div className="flex gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-400 dot-1" />
              <div className="w-3 h-3 rounded-full bg-purple-400 dot-2" />
              <div className="w-3 h-3 rounded-full bg-pink-400 dot-3" />
            </div>
          </div>
        )}

        {assessments?.length === 0 && (
          <div className="glass-strong rounded-3xl p-12 text-center gradient-border">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-white mb-2">No assessments yet</h2>
            <p className="text-white/50 mb-8">Take your first assessment to see it show up here.</p>
            <Link href="/assess" className="btn-primary inline-flex items-center gap-2">
              Start Assessment <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {assessments && assessments.length > 0 && (
          <div className="space-y-4">
            {assessments.map((a) => {
              const color = getLevelColor(a.level)
              return (
                <Link
                  key={a.id}
                  href={`/results/${a.id}`}
                  className="glass-strong rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-white/20 transition-all duration-300 block"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}
                    >
                      {a.overallScore ?? '—'}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{a.targetRole}</div>
                      <div className="text-white/40 text-sm flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(a.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        {a.level && <span className="ml-1">&middot; {a.level}</span>}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-white/30 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/assess" className="btn-primary inline-flex items-center gap-2">
            <Brain size={16} />
            New Assessment
          </Link>
        </div>
      </div>
    </div>
  )
}
