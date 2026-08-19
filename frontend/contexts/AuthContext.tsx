'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { signup as apiSignup, login as apiLogin, fetchMe, type AuthUser } from '../lib/backend'

const TOKEN_STORAGE_KEY = 'ai-careerforge.token'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  signup: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!stored) {
      setIsLoading(false)
      return
    }
    fetchMe(stored)
      .then(({ user }) => {
        setToken(stored)
        setUser(user)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      })
      .finally(() => setIsLoading(false))
  }, [])

  function persistSession(nextToken: string, nextUser: AuthUser) {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    setToken(nextToken)
    setUser(nextUser)
  }

  async function signup(name: string, email: string, password: string) {
    const { token, user } = await apiSignup(name, email, password)
    persistSession(token, user)
  }

  async function login(email: string, password: string) {
    const { token, user } = await apiLogin(email, password)
    persistSession(token, user)
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
