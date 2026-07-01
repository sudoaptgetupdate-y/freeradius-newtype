import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Users, Server, Activity, ArrowUpRight, Ticket, CheckCircle2, AlertTriangle, Zap, UserX, CalendarIcon, Download, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NetworkTrafficChart } from "@/components/network-traffic-chart"
import { FailedLoginsList } from "@/components/failed-logins-list"
import { useAuth } from "@/contexts/auth-context"
import api from "@/lib/api"

type DashboardStats = {
  totalTenants: number
  onlineUsers: number
  trafficGB: string
  activeVouchers: number
  routerStatus: "online" | "offline" | "unknown"
}

export function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === "super_admin") {
    return <MasterDashboard />
  }

  return <TenantDashboard />
}

function MasterDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    onlineUsers: 0,
    trafficGB: "0 GB",
    activeVouchers: 0,
    routerStatus: "unknown"
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats")
        setStats(response.data)
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Dashboard Header Style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('dashboard.masterTitle')}</h2>
          <p className="text-[15px] text-muted-foreground mt-1">{t('dashboard.masterSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex h-10 px-4 rounded-xl border-border bg-card text-foreground shadow-sm font-medium hover:bg-accent/50 hover:text-primary transition-colors">
            <CalendarIcon className="mr-2 h-[18px] w-[18px] text-primary" />
            Jan 20, 2026 - Feb 09, 2026
          </Button>
          <Button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">
            <Download className="mr-2 h-[18px] w-[18px]" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Tenants */}
        <Card className="border-none shadow-md overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-muted-foreground mb-1">{t('dashboard.totalTenants')}</p>
                <h3 className="text-3xl font-bold text-foreground">{stats.totalTenants}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Server className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="flex items-center text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +2
              </span>
              <span className="text-muted-foreground ml-2 text-[13px]">{t('dashboard.totalTenantsDesc')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Online Users */}
        <Card className="border-none shadow-md overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-muted-foreground mb-1">{t('dashboard.onlineUsers')}</p>
                <h3 className="text-3xl font-bold text-foreground">{stats.onlineUsers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#49beff]/10 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="flex items-center text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +12%
              </span>
              <span className="text-muted-foreground ml-2 text-[13px]">{t('dashboard.onlineUsersMasterDesc')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Network Traffic */}
        <Card className="border-none shadow-md overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-muted-foreground mb-1">{t('dashboard.networkTraffic')}</p>
                <h3 className="text-3xl font-bold text-foreground">{stats.trafficGB}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#13deb9]/10 flex items-center justify-center shrink-0">
                <Activity className="h-6 w-6 text-[#13deb9]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="flex items-center text-[#13deb9] font-semibold bg-[#13deb9]/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +8%
              </span>
              <span className="text-muted-foreground ml-2 text-[13px]">{t('dashboard.networkTrafficMasterDesc')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Vouchers */}
        <Card className="border-none shadow-md overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-muted-foreground mb-1">Active Vouchers</p>
                <h3 className="text-3xl font-bold text-foreground">{stats.activeVouchers || 1240}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#f6b51e]/10 flex items-center justify-center shrink-0">
                <Ticket className="h-6 w-6 text-[#f6b51e]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="flex items-center text-[#f6b51e] font-semibold bg-[#f6b51e]/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +145
              </span>
              <span className="text-muted-foreground ml-2 text-[13px]">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Network Traffic Chart */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-md">
          <CardHeader className="px-6 py-5 border-b border-border/50">
            <CardTitle className="text-lg">{t('dashboard.globalTrafficTitle')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('dashboard.globalTrafficDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px]">
              <NetworkTrafficChart />
            </div>
          </CardContent>
        </Card>
        
        <div className="col-span-1">
          <div className="bg-card rounded-xl shadow-md h-full overflow-hidden border-none">
            <div className="px-6 py-5 border-b border-border/50">
              <h3 className="font-semibold text-lg text-foreground">Security Log</h3>
              <p className="text-sm text-muted-foreground mt-1">Failed authentication attempts</p>
            </div>
            <div className="p-0">
              <FailedLoginsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TenantDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    onlineUsers: 0,
    trafficGB: "0 GB",
    activeVouchers: 0,
    routerStatus: "unknown"
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats")
        setStats(response.data)
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Dashboard Header Style for Tenant */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('dashboard.tenantTitle', { name: user?.name || "Your Site" })}</h2>
          <p className="text-[15px] text-muted-foreground mt-1">{t('dashboard.tenantSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex h-10 px-4 rounded-xl border-border bg-card text-destructive shadow-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors">
            <UserX className="mr-2 h-[18px] w-[18px]" />
            {t('dashboard.disconnectAll')}
          </Button>
          <Button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">
            <Zap className="mr-2 h-[18px] w-[18px]" />
            {t('dashboard.generateVouchers')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Router Status */}
        <Card className="border-none shadow-md overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-muted-foreground mb-1">{t('dashboard.routerStatus')}</p>
                {stats.routerStatus === "online" ? (
                  <h3 className="text-3xl font-bold text-[#13deb9]">{t('dashboard.routerOnline')}</h3>
                ) : (
                  <h3 className="text-3xl font-bold text-[#ef4444]">{t('dashboard.routerOffline')}</h3>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stats.routerStatus === 'online' ? 'bg-[#13deb9]/10' : 'bg-[#ef4444]/10'}`}>
                <Server className={`h-6 w-6 ${stats.routerStatus === 'online' ? 'text-[#13deb9]' : 'text-[#ef4444]'}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
               {stats.routerStatus === "online" ? (
                  <>
                    <CheckCircle2 className="mr-1 h-[18px] w-[18px] text-[#13deb9]" />
                    <span className="text-muted-foreground ml-1 text-[13px]">{t('dashboard.routerOnlineDesc')}</span>
                  </>
               ) : (
                  <>
                    <AlertTriangle className="mr-1 h-[18px] w-[18px] text-[#ef4444]" />
                    <span className="text-muted-foreground ml-1 text-[13px]">{t('dashboard.routerOfflineDesc')}</span>
                  </>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Online Users */}
        <Card className="border-none shadow-md overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-muted-foreground mb-1">{t('dashboard.onlineUsers')}</p>
                <h3 className="text-3xl font-bold text-foreground">{stats.onlineUsers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#49beff]/10 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
               <span className="text-muted-foreground text-[13px]">{t('dashboard.onlineUsersTenantDesc')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Vouchers */}
        <Card className="border-none shadow-md overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-muted-foreground mb-1">{t('dashboard.activeVouchers')}</p>
                <h3 className="text-3xl font-bold text-foreground">{stats.activeVouchers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#f6b51e]/10 flex items-center justify-center shrink-0">
                <Ticket className="h-6 w-6 text-[#f6b51e]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-muted-foreground text-[13px]">{t('dashboard.activeVouchersDesc')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Network Traffic */}
        <Card className="border-none shadow-md overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-muted-foreground mb-1">{t('dashboard.networkTraffic')}</p>
                <h3 className="text-3xl font-bold text-foreground">{stats.trafficGB}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#5d87ff]/10 flex items-center justify-center shrink-0">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-muted-foreground text-[13px]">{t('dashboard.networkTrafficTenantDesc')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Network Traffic Chart */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-md">
          <CardHeader className="px-6 py-5 border-b border-border/50">
            <CardTitle className="text-lg">{t('dashboard.siteTrafficTitle')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('dashboard.siteTrafficDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
             <div className="h-[350px]">
               <NetworkTrafficChart />
             </div>
          </CardContent>
        </Card>

        <div className="col-span-1">
          <div className="bg-card rounded-xl shadow-md h-full overflow-hidden border-none">
            <div className="px-6 py-5 border-b border-border/50">
              <h3 className="font-semibold text-lg text-foreground">Security Log</h3>
              <p className="text-sm text-muted-foreground mt-1">Failed authentication attempts</p>
            </div>
            <div className="p-0">
              <FailedLoginsList />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 mt-6">
        <Card className="col-span-1 md:col-span-3 lg:col-span-4 border-none shadow-md">
          <CardHeader className="px-6 py-5 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Group Analytics Overview
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Monitor active sessions and bandwidth utilization across your organizational groups.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Top Groups by Active Sessions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium">Grade 10</span>
                    </div>
                    <span className="text-sm font-semibold">42</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">Staff</span>
                    </div>
                    <span className="text-sm font-semibold">15</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="text-sm font-medium">Grade 11</span>
                    </div>
                    <span className="text-sm font-semibold">8</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:col-span-2">
                 <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Bandwidth Utilization (Mock)</h4>
                 <div className="h-[120px] bg-muted/20 rounded-lg border border-border/50 flex items-center justify-center">
                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Bar Chart Placeholder for Group Traffic
                    </span>
                 </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border/50 text-center sm:text-left">
              <Button variant="link" className="text-primary p-0 h-auto font-medium" onClick={() => window.location.href = '/groups'}>
                Manage all groups &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
