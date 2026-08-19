'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function NavAuthButtons() {
  const { user, isLoading, logout } = useAuth()

  if (isLoading) return null

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/history" className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200">
          History
        </Link>
        <Link
          href="/assess"
          className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5"
          style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem' }}
        >
          New Assessment
          <ArrowRight size={14} />
        </Link>
        <button
          onClick={logout}
          className="text-sm font-medium text-white/40 hover:text-white/70 transition-colors duration-200"
        >
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200">
        Log In
      </Link>
      <Link
        href="/signup"
        className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5"
        style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem' }}
      >
        Start Free
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
