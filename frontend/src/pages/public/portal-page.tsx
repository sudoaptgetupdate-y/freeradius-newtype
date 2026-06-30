import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "react-toastify"
import api from "@/lib/api"
import { PortalLayout } from "@/layouts/portal-layout"
import { LoginForm } from "@/components/portal/login-form"
import { RegisterForm } from "@/components/portal/register-form"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { UserPlus } from "lucide-react"

interface PortalPageProps {
  defaultTab?: "login" | "register"
}

export default function PortalPage({ defaultTab = "login" }: PortalPageProps) {
  const { tenantId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab)

  // Sync tab state when URL route changes
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  // Fetch Portal Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get(`/portal/settings/${tenantId}`)
        setSettings(data)
        // Apply theme color
        if (data.themeColor) {
          document.documentElement.style.setProperty('--primary', data.themeColor)
        }
      } catch (error) {
        console.error("Failed to fetch portal settings:", error)
        toast.error("Invalid portal link or tenant not found")
      } finally {
        setLoading(false)
      }
    }
    
    if (tenantId) {
      fetchSettings()
    }
  }, [tenantId])

  const handleTabChange = (tab: "login" | "register") => {
    setActiveTab(tab)
    // Update URL to match active tab for correct routing behavior (without reloading page)
    const route = tab === "login" ? `/portal/${tenantId}` : `/register/${tenantId}`
    navigate(`${route}?${searchParams.toString()}`, { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-destructive mb-4">
            <UserPlus className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <CardTitle className="text-xl mb-2">Invalid Link</CardTitle>
          <CardDescription>
            The captive portal link is invalid or the tenant does not exist.
          </CardDescription>
        </Card>
      </div>
    )
  }

  return (
    <PortalLayout 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
      settings={settings}
    >
      <div className="relative overflow-hidden w-full h-full flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col"
            >
              <LoginForm 
                tenantId={tenantId!} 
                settings={settings} 
                onRegisterClick={() => handleTabChange("register")} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col"
            >
              <RegisterForm 
                tenantId={tenantId!} 
                settings={settings} 
                onLoginClick={() => handleTabChange("login")} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalLayout>
  )
}
