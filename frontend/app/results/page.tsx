'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import ResultsDashboard from '../../components/ResultsDashboard'
import InteractiveMesh from '../../components/InteractiveMesh'
import type { AnalysisResult } from '@ai-careerforge/shared'

interface DecodedPayload {
  result: AnalysisResult
  name: string
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const [payload, setPayload] = useState<DecodedPayload | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const data = searchParams.get('data')
    if (!data) { setError(true); setLoading(false); return }
    try {
      const decoded = JSON.parse(atob(data)) as DecodedPayload
      if (!decoded.result || !decoded.name) throw new Error('Invalid data')
      setPayload(decoded)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080f]">
        <InteractiveMesh />
        <div className="orb orb-purple" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="relative z-10 text-center">
          <div className="text-4xl mb-6">⚡</div>
          <h2 className="text-2xl font-bold text-white mb-4">Loading your results...</h2>
          <div className="flex gap-3 justify-center">
            <div className="w-3 h-3 rounded-full bg-blue-400 dot-1" />
            <div className="w-3 h-3 rounded-full bg-purple-400 dot-2" />
            <div className="w-3 h-3 rounded-full bg-pink-400 dot-3" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !payload) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080f] px-6">
        <InteractiveMesh />
        <div className="orb orb-purple" style={{ width: 350, height: 350, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.1 }} />
        <div className="relative z-10 text-center glass-strong rounded-3xl p-12 max-w-md w-full gradient-border">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-3">No Results Found</h2>
          <p className="text-white/50 mb-8">
            We couldn&apos;t find your assessment results. This might happen if the link expired or was incomplete.
          </p>
          <Link href="/assess" className="btn-primary inline-flex items-center gap-2">
            Take the Assessment <span>→</span>
          </Link>
        </div>
      </div>
    )
  }

  return <ResultsDashboard result={payload.result} candidateName={payload.name} />
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080f]">
          <div className="flex gap-3 justify-center">
            <div className="w-3 h-3 rounded-full bg-blue-400 dot-1" />
            <div className="w-3 h-3 rounded-full bg-purple-400 dot-2" />
            <div className="w-3 h-3 rounded-full bg-pink-400 dot-3" />
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
