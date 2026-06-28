import { useState, useEffect } from "react"
import { ShieldAlert, Clock, MonitorSmartphone } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

type FailedLog = {
  id: string
  timestamp: string
  username: string
  mac: string
  reason: string
}

export function FailedLoginsList() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<FailedLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get("/dashboard/logs/failed-logins")
        setLogs(response.data.logs || [])
      } catch (error) {
        console.error("Failed to fetch failed logins", error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <ShieldAlert className="mr-2 h-5 w-5" />
            {t('security.recentFailedLogins')}
          </CardTitle>
          <CardDescription>{t('security.loadingLogs')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-emerald-500 flex items-center">
            <ShieldAlert className="mr-2 h-5 w-5 opacity-50" />
            {t('security.noFailedLogins')}
          </CardTitle>
          <CardDescription>{t('security.noFailedLoginsDesc')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-destructive/20 shadow-sm">
      <CardHeader className="bg-destructive/5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-destructive flex items-center">
              <ShieldAlert className="mr-2 h-5 w-5" />
              {t('security.recentFailedLogins')}
            </CardTitle>
            <CardDescription className="mt-1">
              {t('security.failedLoginsDesc')}
            </CardDescription>
          </div>
          <Badge variant="destructive" className="font-mono">
            {logs.length} {t('security.detected')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium">{log.username}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <div className="flex items-center text-muted-foreground font-mono text-xs">
                  <MonitorSmartphone className="mr-1 h-3 w-3" />
                  {log.mac}
                </div>
                <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 text-xs font-normal">
                  {log.reason}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
