import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { format } from "date-fns"
import { Activity, Clock, Database, Globe, History, KeyRound, Laptop, Loader2, LogOut, ShieldAlert, WifiOff } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"

export function SelfCareDashboard() {
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [profile, setProfile] = useState<any>(null)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [profileRes, activeRes, historyRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/selfcare/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/selfcare/sessions/active`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/selfcare/sessions/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (profileRes.ok) setProfile(await profileRes.json())
      if (activeRes.ok) setActiveSessions(await activeRes.json())
      if (historyRes.ok) setHistory(await historyRes.json())

    } catch (error) {
      console.error("Failed to fetch dashboard data", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [token])

  const handleDisconnect = async (sessionId: string, nasIp: string) => {
    if (!confirm("Are you sure you want to disconnect this device?")) return

    setDisconnectingId(sessionId)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/selfcare/sessions/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ acctsessionid: sessionId, nasipaddress: nasIp })
      })

      if (res.ok) {
        toast.success("Disconnect command sent")
        setTimeout(fetchData, 2000) // Wait for NAS to actually disconnect before refreshing
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to disconnect")
      }
    } catch (error) {
      toast.error("Network error while trying to disconnect")
    } finally {
      setDisconnectingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 MB"
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return "0 mins"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  // Calculate Data Progress
  const dataLimit = profile?.limits?.dataLimit
  const dataUsed = profile?.usage?.totalBytes || 0
  const dataProgress = dataLimit ? Math.min((dataUsed / dataLimit) * 100, 100) : 0

  // Calculate Time Progress
  const timeLimit = profile?.limits?.timeLimit
  const timeUsed = profile?.usage?.totalTime || 0
  const timeProgress = timeLimit ? Math.min((timeUsed / timeLimit) * 100, 100) : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Section: Overview & Actions */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 shadow-md border-border/50">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Account Overview</CardTitle>
                <CardDescription>Welcome back, {profile?.username}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/selfcare/${user?.tenantId}/settings`)}>
                <KeyRound className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Current Profile</span>
              <span className="font-bold text-base flex items-center">
                <ShieldAlert className="h-4 w-4 mr-2 text-primary" />
                {profile?.profileName || 'Default'}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Status</span>
              <span className="font-bold text-base flex items-center">
                {activeSessions.length > 0 ? (
                  <><Badge variant="default" className="bg-green-500 hover:bg-green-600">Online</Badge></>
                ) : (
                  <><Badge variant="secondary">Offline</Badge></>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-500" />
              Data Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-bold">{formatBytes(dataUsed)}</span>
              <span className="text-sm text-muted-foreground font-medium">
                / {dataLimit ? formatBytes(dataLimit) : "Unlimited"}
              </span>
            </div>
            {dataLimit ? (
              <Progress value={dataProgress} className="h-2" />
            ) : (
              <Progress value={100} className="h-2 opacity-20" />
            )}
            <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
              <span className="flex items-center"><LogOut className="h-3 w-3 mr-1 rotate-90" /> DL: {formatBytes(profile?.usage?.downloadBytes)}</span>
              <span className="flex items-center"><LogOut className="h-3 w-3 mr-1 -rotate-90" /> UL: {formatBytes(profile?.usage?.uploadBytes)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              Time Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-bold">{formatDuration(timeUsed)}</span>
              <span className="text-sm text-muted-foreground font-medium">
                / {timeLimit ? formatDuration(timeLimit) : "Unlimited"}
              </span>
            </div>
            {timeLimit ? (
              <Progress value={timeProgress} className="h-2" />
            ) : (
              <Progress value={100} className="h-2 opacity-20" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Active Devices
            </CardTitle>
            <Badge variant="outline">{activeSessions.length} Online</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activeSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Laptop className="h-10 w-10 mb-3 opacity-20" />
              <p>No devices are currently connected.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>MAC Address</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.radacctid}>
                      <TableCell className="font-medium flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        {session.framedipaddress || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{session.callingstationid || '-'}</TableCell>
                      <TableCell>{session.acctstarttime ? format(new Date(session.acctstarttime), 'MMM d, yyyy HH:mm') : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDisconnect(session.acctsessionid, session.nasipaddress)}
                          disabled={disconnectingId === session.acctsessionid}
                        >
                          {disconnectingId === session.acctsessionid ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                          ) : (
                            <WifiOff className="h-4 w-4 mr-1.5" />
                          )}
                          Disconnect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-lg flex items-center">
            <History className="h-5 w-5 mr-2 text-muted-foreground" />
            Recent Session History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No session history found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Data Used</TableHead>
                    <TableHead>MAC Address</TableHead>
                    <TableHead>Cause</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((session) => (
                    <TableRow key={session.radacctid}>
                      <TableCell>{session.acctstarttime ? format(new Date(session.acctstarttime), 'MMM d, HH:mm') : '-'}</TableCell>
                      <TableCell>{formatDuration(session.acctsessiontime)}</TableCell>
                      <TableCell>{formatBytes(Number(session.acctinputoctets || 0) + Number(session.acctoutputoctets || 0))}</TableCell>
                      <TableCell className="font-mono text-xs">{session.callingstationid}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {session.acctterminatecause || (session.acctstoptime ? 'Unknown' : 'Active')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
