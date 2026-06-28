import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Users, Server, Activity, ArrowUpRight, Ticket, CheckCircle2, AlertTriangle, Zap, UserX } from "lucide-react"
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.masterTitle')}</h2>
        <p className="text-muted-foreground">{t('dashboard.masterSubtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Tenants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalTenants')}
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 inline-flex items-center">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +2
              </span>{" "}
              {t('dashboard.totalTenantsDesc')}
            </p>
          </CardContent>
        </Card>

        {/* Online Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.onlineUsers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.onlineUsersMasterDesc')}
            </p>
          </CardContent>
        </Card>

        {/* Network Traffic */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.networkTraffic')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trafficGB}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.networkTrafficMasterDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Network Traffic Chart */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.globalTrafficTitle')}</CardTitle>
            <CardDescription>
              {t('dashboard.globalTrafficDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <NetworkTrafficChart />
          </CardContent>
        </Card>
        
        <div className="col-span-1">
          <FailedLoginsList />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.tenantTitle', { name: user?.name || "Your Site" })}</h2>
          <p className="text-muted-foreground">{t('dashboard.tenantSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            <UserX className="mr-2 h-4 w-4" />
            {t('dashboard.disconnectAll')}
          </Button>
          <Button>
            <Zap className="mr-2 h-4 w-4" />
            {t('dashboard.generateVouchers')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Router Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.routerStatus')}
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.routerStatus === "online" ? (
              <>
                <div className="text-2xl font-bold text-emerald-500">{t('dashboard.routerOnline')}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" />
                  {t('dashboard.routerOnlineDesc')}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">{t('dashboard.routerOffline')}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <AlertTriangle className="mr-1 h-3 w-3 text-destructive" />
                  {t('dashboard.routerOfflineDesc')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Online Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.onlineUsers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.onlineUsersTenantDesc')}
            </p>
          </CardContent>
        </Card>

        {/* Active Vouchers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.activeVouchers')}
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVouchers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.activeVouchersDesc')}
            </p>
          </CardContent>
        </Card>

        {/* Network Traffic */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.networkTraffic')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trafficGB}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.networkTrafficTenantDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Network Traffic Chart */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.siteTrafficTitle')}</CardTitle>
            <CardDescription>
              {t('dashboard.siteTrafficDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <NetworkTrafficChart />
          </CardContent>
        </Card>

        <div className="col-span-1">
          <FailedLoginsList />
        </div>
      </div>
    </div>
  )
}
