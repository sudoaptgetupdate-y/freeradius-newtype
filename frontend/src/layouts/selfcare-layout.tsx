import { Outlet, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LogOut, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useAuth } from "@/contexts/auth-context"

export function SelfCareLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    // Re-route back to this tenant's selfcare login
    if (tenantId) {
      navigate(`/selfcare/${tenantId}/login`)
    } else if (user?.tenantId) {
      navigate(`/selfcare/${user.tenantId}/login`)
    } else {
      navigate("/")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-8 flex h-[70px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
              <Wifi className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-foreground leading-none">Self-Care</span>
              <span className="text-xs text-muted-foreground mt-1">Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageToggle />
            <ThemeToggle />
            {user && (
              <Button variant="outline" onClick={handleLogout} className="rounded-full shadow-sm">
                <LogOut className="mr-2 h-4 w-4" />
                {t('common.logout', 'Logout')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-muted/10">
        <div className="container mx-auto px-4 sm:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
