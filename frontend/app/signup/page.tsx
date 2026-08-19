'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { BackendError } from '../../lib/backend'

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      await signup(name, email, password)
      router.push('/assess')
    } catch (err) {
      setError(err instanceof BackendError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
      <div className="orb orb-blue" style={{ width: 400, height: 400, top: 0, left: 0, opacity: 0.08 }} />
      <div className="orb orb-purple" style={{ width: 350, height: 350, bottom: 0, right: 0, opacity: 0.08 }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Create your <span className="gradient-text">account</span>
          </h1>
          <p className="text-white/50">Takes about 30 seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 gradient-border space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              <User size={14} className="inline mr-1.5" />
              Full Name
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              <Mail size={14} className="inline mr-1.5" />
              Email Address
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              <Lock size={14} className="inline mr-1.5" />
              Password
              <span className="text-white/30 font-normal ml-2">(min 8 characters)</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Sign Up
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="text-center text-sm text-white/40">
            Already have an account?{' '}
            <Link href="/login" className="text-white/80 hover:text-white font-medium">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
