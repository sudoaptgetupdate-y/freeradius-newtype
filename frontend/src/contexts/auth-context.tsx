import { createContext, useContext, useState, useEffect } from "react"

type User = {
  id: string
  email: string
  role: string
  tenantId: string
  name?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem("saas-token"))

  useEffect(() => {
    // Basic hydrate from local storage
    const storedToken = localStorage.getItem("saas-token")
    const storedUser = localStorage.getItem("saas-user")
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (e) {
        logout()
      }
    }
  }, [])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("saas-token", newToken)
    localStorage.setItem("saas-user", JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem("saas-token")
    localStorage.removeItem("saas-user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
