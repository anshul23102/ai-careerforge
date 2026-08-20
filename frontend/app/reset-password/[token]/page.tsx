'use client'

import { useState, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, Loader2 } from 'lucide-react'
import { resetPassword, BackendError } from '../../../lib/backend'

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(params.token, password)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
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
            <span className="gradient-text">Choose</span> a new password
          </h1>
          <p className="text-white/50">Make it something you&apos;ll remember</p>
        </div>

        {success ? (
          <div className="glass-strong rounded-3xl p-8 gradient-border text-center space-y-4">
            <p className="text-white/80">Password reset. Taking you to log in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 gradient-border space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Lock size={14} className="inline mr-1.5" />
                New Password
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

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Lock size={14} className="inline mr-1.5" />
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="input-field"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Resetting...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="text-center text-sm text-white/40">
              <Link href="/login" className="text-white/80 hover:text-white font-medium">
                Back to log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
