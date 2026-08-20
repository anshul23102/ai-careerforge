'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import { forgotPassword, BackendError } from '../../lib/backend'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await forgotPassword(email)
      setSubmitted(true)
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
            <span className="gradient-text">Reset</span> your password
          </h1>
          <p className="text-white/50">We&apos;ll email you a link to reset it</p>
        </div>

        {submitted ? (
          <div className="glass-strong rounded-3xl p-8 gradient-border text-center space-y-4">
            <p className="text-white/80">
              If an account exists for <span className="font-medium text-white">{email}</span>, a reset link is on
              its way. Check your inbox.
            </p>
            <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium">
              Back to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 gradient-border space-y-5">
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
                  Sending link...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="text-center text-sm text-white/40">
              Remembered your password?{' '}
              <Link href="/login" className="text-white/80 hover:text-white font-medium">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
