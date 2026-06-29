import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useAuth } from "@/contexts/auth-context"
import api from "@/lib/api"

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await api.post("/auth/login", { email, password })
      const { token, user } = response.data
      
      login(token, user)
      toast.success("Login successful!")
      navigate("/")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid credentials")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@saas.local" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('login.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
