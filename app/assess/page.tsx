import type { Metadata } from 'next'
import Link from 'next/link'
import { Target } from 'lucide-react'
import AssessmentForm from '../../components/AssessmentForm'

export const metadata: Metadata = {
  title: 'Assess Yourself - AI CareerForge',
  description: 'Complete your interview readiness assessment in under 2 minutes.',
}

export default function AssessPage() {
  return (
    <main className="relative min-h-screen bg-[#07080f]">
      {/* Sticky nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity group-hover:opacity-80"
              style={{ background: "linear-gradient(135deg, #a5b4fc, #6eb4ff)" }}>
              <Target size={14} className="text-white" />
            </div>
            <span className="font-semibold text-white/70 group-hover:text-white text-sm tracking-tight transition-colors">
              AI CareerForge
            </span>
          </Link>
          <span className="text-white/25 text-sm">Assessment</span>
        </div>
      </nav>

      <AssessmentForm />
    </main>
  )
}
