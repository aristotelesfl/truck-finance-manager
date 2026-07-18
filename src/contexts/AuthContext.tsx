import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { watchAuthState } from '../firebase/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchAuthState((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return <AuthContext value={{ user, loading }}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
