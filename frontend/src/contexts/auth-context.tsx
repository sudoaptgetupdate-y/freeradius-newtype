import { createContext, useContext, useState, useEffect } from "react"

type User = {
  id: string
  email?: string
  username?: string // For end_users
  role: string
  tenantId: string | null
  name?: string
  isImpersonating?: boolean
  originalAdminId?: string
  primaryDeviceType?: string
  defaultRegisterProfile?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isImpersonating: boolean
  impersonatedTenantName: string | null
  login: (token: string, user: User) => void
  logout: () => void
  startImpersonation: (token: string, user: User, tenantName: string) => void
  exitImpersonation: () => { token: string; user: User } | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEYS = {
  token: "saas-token",
  user: "saas-user",
  originalToken: "saas-original-token",
  originalUser: "saas-original-user",
  tenantName: "saas-impersonated-tenant-name",
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.user)
    if (stored) {
      try { return JSON.parse(stored) } catch { return null }
    }
    return null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.token))
  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.user)
    if (stored) {
      try { return !!JSON.parse(stored).isImpersonating } catch { return false }
    }
    return false
  })
  const [impersonatedTenantName, setImpersonatedTenantName] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.tenantName))

  useEffect(() => {
    // Keep this check to invalidate token if something is corrupt
    const storedUser = localStorage.getItem(STORAGE_KEYS.user)
    if (storedUser) {
      try {
        JSON.parse(storedUser)
      } catch {
        logout()
      }
    }
  }, [])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(STORAGE_KEYS.token, newToken)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser))
    // Clear any leftover impersonation state on fresh login
    localStorage.removeItem(STORAGE_KEYS.originalToken)
    localStorage.removeItem(STORAGE_KEYS.originalUser)
    localStorage.removeItem(STORAGE_KEYS.tenantName)
    setToken(newToken)
    setUser(newUser)
    setIsImpersonating(false)
    setImpersonatedTenantName(null)
  }

  const logout = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
    setToken(null)
    setUser(null)
    setIsImpersonating(false)
    setImpersonatedTenantName(null)
  }

  const startImpersonation = (impToken: string, impUser: User, tenantName: string) => {
    // Save master session before switching
    const currentToken = localStorage.getItem(STORAGE_KEYS.token)
    const currentUser = localStorage.getItem(STORAGE_KEYS.user)
    if (currentToken) localStorage.setItem(STORAGE_KEYS.originalToken, currentToken)
    if (currentUser) localStorage.setItem(STORAGE_KEYS.originalUser, currentUser)

    // Switch to impersonation session
    localStorage.setItem(STORAGE_KEYS.token, impToken)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(impUser))
    localStorage.setItem(STORAGE_KEYS.tenantName, tenantName)

    setToken(impToken)
    setUser(impUser)
    setIsImpersonating(true)
    setImpersonatedTenantName(tenantName)
  }

  const exitImpersonation = (): { token: string; user: User } | null => {
    const originalToken = localStorage.getItem(STORAGE_KEYS.originalToken)
    const originalUserStr = localStorage.getItem(STORAGE_KEYS.originalUser)

    if (!originalToken || !originalUserStr) {
      // Fallback: just logout
      logout()
      return null
    }

    const originalUser: User = JSON.parse(originalUserStr)

    // Restore master session
    localStorage.setItem(STORAGE_KEYS.token, originalToken)
    localStorage.setItem(STORAGE_KEYS.user, originalUserStr)
    localStorage.removeItem(STORAGE_KEYS.originalToken)
    localStorage.removeItem(STORAGE_KEYS.originalUser)
    localStorage.removeItem(STORAGE_KEYS.tenantName)

    setToken(originalToken)
    setUser(originalUser)
    setIsImpersonating(false)
    setImpersonatedTenantName(null)

    return { token: originalToken, user: originalUser }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isImpersonating,
        impersonatedTenantName,
        login,
        logout,
        startImpersonation,
        exitImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
