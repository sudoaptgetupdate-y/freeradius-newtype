import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LayoutDashboard, Users, Settings, LogOut, Menu, Building2, Server, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useAuth } from "@/contexts/auth-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function DashboardLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const SidebarNav = () => (
    <>
      <div className="h-14 border-b flex items-center px-6">
        <span className="font-bold text-lg tracking-tight">FreeRADIUS SaaS</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <Button variant={location.pathname === "/" ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => navigate("/")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          {t('nav.dashboard')}
        </Button>

        {user?.role === "super_admin" && (
          <Button variant={location.pathname === "/tenants" ? "secondary" : "ghost"} className="w-full justify-start text-muted-foreground" onClick={() => navigate("/tenants")}>
            <Building2 className="mr-2 h-4 w-4" />
            {t('nav.tenants')}
          </Button>
        )}

        <Button variant={location.pathname === "/profiles" ? "secondary" : "ghost"} className="w-full justify-start text-muted-foreground" onClick={() => navigate("/profiles")}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          {t('nav.profiles')}
        </Button>

        <Button variant={location.pathname === "/nas" ? "secondary" : "ghost"} className="w-full justify-start text-muted-foreground" onClick={() => navigate("/nas")}>
          <Server className="mr-2 h-4 w-4" />
          {t('nav.nas')}
        </Button>

        <Button variant={location.pathname === "/users" ? "secondary" : "ghost"} className="w-full justify-start text-muted-foreground" onClick={() => navigate("/users")}>
          <Users className="mr-2 h-4 w-4" />
          {t('nav.users')}
        </Button>

        <Button variant={location.pathname === "/settings" ? "secondary" : "ghost"} className="w-full justify-start text-muted-foreground">
          <Settings className="mr-2 h-4 w-4" />
          {t('nav.settings')}
        </Button>
      </nav>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('nav.logout')}
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-muted/20 flex w-full">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col">
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col bg-card">
                <SidebarNav />
              </SheetContent>
            </Sheet>
            <h1 className="font-semibold text-lg">{t('dashboard.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
