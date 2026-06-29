import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { LayoutDashboard, Users, Settings, LogOut, Menu, Building2, Server, ShieldCheck, Search, Bell, ChevronDown, Wifi, UserCog, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useAuth } from "@/contexts/auth-context"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export function DashboardLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to
    return (
      <Button 
        variant={isActive ? "default" : "ghost"} 
        className={`w-full justify-start font-medium transition-all px-4 py-3 h-auto rounded-lg ${isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`} 
        onClick={() => navigate(to)}
      >
        <Icon className={`mr-3 h-[18px] w-[18px] ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
        <span className="text-[15px]">{label}</span>
      </Button>
    )
  }

  const SidebarNav = () => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      <div className="h-[76px] flex items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 font-bold text-[22px] tracking-tight text-sidebar-foreground">
          <div className="bg-primary p-1.5 rounded-lg border border-primary/20 shadow-sm shadow-primary/20">
            <Wifi className="h-6 w-6 text-primary-foreground" />
          </div>
          FreeRADIUS
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-[11px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-3 px-2 mt-2">Overview</div>
        <NavItem to="/" icon={LayoutDashboard} label={t('nav.dashboard')} />
        
        
        <div className="text-[11px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-3 px-2 mt-6">Management</div>
        {user?.role === "super_admin" && (
          <NavItem to="/tenants" icon={Building2} label={t('nav.tenants')} />
        )}
        <NavItem to="/admins" icon={UserCog} label={t('nav.admins')} />
        
        <NavItem to="/profiles" icon={ShieldCheck} label={t('nav.profiles')} />
        <NavItem to="/nas" icon={Server} label={t('nav.nas')} />
        <NavItem to="/vouchers" icon={Ticket} label="Vouchers" />
        <NavItem to="/users" icon={Users} label={t('nav.users')} />
        
        {user?.role === "super_admin" && (
          <div className="mt-4 pt-4 border-t border-sidebar-border/50">
            <div className="text-[11px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-3 px-2">System</div>
            <NavItem to="/settings" icon={Settings} label="Global Settings" />
          </div>
        )}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-2 hover:bg-accent/50 h-14 rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {(user?.name || user?.email)?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col items-start truncate text-left">
                  <span className="text-[15px] font-semibold leading-none text-sidebar-foreground truncate">{user?.name || user?.email?.split('@')[0]}</span>
                  <span className="text-xs text-muted-foreground mt-1.5 truncate capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/40 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg border-border/50 p-2">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user?.name || user?.email?.split('@')[0]}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || 'admin@saas.local'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer rounded-lg py-2">
              <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
              <span className="text-[15px]">{t('nav.settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg py-2">
              <LogOut className="mr-3 h-4 w-4" />
              <span className="text-[15px]">{t('nav.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="h-screen overflow-hidden bg-muted/40 flex w-full font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-[270px] bg-sidebar hidden lg:flex flex-col z-10 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.02)]">
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Header */}
        <header className="h-[76px] bg-background flex items-center justify-between px-4 lg:px-8 z-20 sticky top-0 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center flex-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden mr-2 text-muted-foreground hover:bg-accent/50 rounded-full h-10 w-10">
                  <Menu className="h-[22px] w-[22px]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[270px] p-0 flex flex-col border-r-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Sidebar navigation for mobile</SheetDescription>
                <SidebarNav />
              </SheetContent>
            </Sheet>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center max-w-md w-full relative">
              <Search className="h-[18px] w-[18px] absolute left-4 text-muted-foreground/70" />
              <Input 
                type="search" 
                placeholder="Search..." 
                className="pl-11 bg-accent/30 border-transparent focus-visible:bg-background focus-visible:border-primary/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all h-[42px] shadow-none w-64 lg:w-[400px] rounded-full text-[15px]"
              />
            </div>
            
            <h1 className="font-bold text-[20px] lg:hidden tracking-tight">{t('dashboard.title')}</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-accent/30 text-muted-foreground hover:text-primary hover:bg-accent transition-colors relative">
              <Bell className="h-[20px] w-[20px]" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-error ring-2 ring-background"></span>
            </Button>
            <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto relative bg-background/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
