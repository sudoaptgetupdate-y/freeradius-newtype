import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Loader2, User, Calendar, Layers, Laptop, Database, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import api from "@/lib/api"
import type {  UserData  } from "@/types/user"

interface UserDetailsDialogProps {
  username: string | null
  onClose: () => void
  user: any
  users: UserData[]
}

export function UserDetailsDialog({
  username,
  onClose,
  user,
  users
}: UserDetailsDialogProps) {
  const isOpen = !!username
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [userDetails, setUserDetails] = useState<any>(null)

  useEffect(() => {
    if (username) {
      const fetchDetails = async () => {
        setIsDetailsLoading(true)
        setUserDetails(null)
        try {
          let tenantIdQuery = ""
          if (user?.role === "super_admin" || user?.role === "admin") {
            const targetUser = users.find(u => u.username === username)
            if (targetUser && (targetUser as any).tenantId) {
              tenantIdQuery = `?tenantId=${(targetUser as any).tenantId}`
            }
          }
          const response = await api.get(`/users/${username}/details${tenantIdQuery}`)
          setUserDetails(response.data)
        } catch (error) {
          console.error("Failed to fetch user details:", error)
          toast.error("Failed to load user details")
          onClose()
        } finally {
          setIsDetailsLoading(false)
        }
      }
      fetchDetails()
    }
  }, [username, user?.role, users, onClose])

  const formatBytes = (bytesStr: string) => {
    const bytes = Number(bytesStr || 0)
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${seconds % 60}s`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
          <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
            User Details: {userDetails?.username || username || "Loading..."}
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
            Deep insights and session history for this user.
          </DialogDescription>
        </DialogHeader>

        {isDetailsLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : userDetails ? (
          <div className="px-5 sm:px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Summary Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="text-sm px-3 py-1 bg-primary/5 text-primary border-primary/20">
                <Layers className="h-3.5 w-3.5 mr-1.5 inline" />
                Group: {userDetails.groupName || "None"}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                Profile: {userDetails.profileName}
              </Badge>
              {userDetails.activeSession ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-sm px-3 py-1">
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-sm px-3 py-1 text-muted-foreground">
                  Offline
                </Badge>
              )}
            </div>

            {/* Personal Information */}
            <div className="bg-muted/10 border border-border/50 p-4 rounded-xl space-y-3">
              <h4 className="font-semibold text-foreground text-sm flex items-center">
                <User className="mr-2 h-4 w-4 text-primary" /> Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">First Name</span> <span className="font-medium">{userDetails.personalInfo?.firstName || "-"}</span></div>
                <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Last Name</span> <span className="font-medium">{userDetails.personalInfo?.lastName || "-"}</span></div>
                <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Member ID</span> <span className="font-mono">{userDetails.personalInfo?.memberId || "-"}</span></div>
                <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Citizen ID</span> <span className="font-mono">{userDetails.personalInfo?.citizenId || "-"}</span></div>
                <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Email</span> <span>{userDetails.personalInfo?.email || "-"}</span></div>
                <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Phone</span> <span>{userDetails.personalInfo?.phone || "-"}</span></div>
              </div>
              {userDetails.personalInfo?.expiration && (
                <div className="pt-3 mt-3 border-t border-border/50">
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Account Expiration</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md inline-flex items-center mt-0.5">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    {userDetails.personalInfo.expiration}
                  </span>
                </div>
              )}
            </div>

            {/* Active Session Info (If online) */}
            {userDetails.activeSession && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                <h4 className="font-semibold text-emerald-700 text-sm flex items-center">
                  <Laptop className="mr-2 h-4 w-4" /> Active Connection Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-emerald-800">
                  <div>IP Address: <span className="font-mono">{userDetails.activeSession.framedipaddress || "-"}</span></div>
                  <div>MAC Address: <span className="font-mono">{userDetails.activeSession.callingstationid || "-"}</span></div>
                  <div>Started: <span className="font-mono">{new Date(userDetails.activeSession.acctstarttime).toLocaleString()}</span></div>
                  <div>NAS IP: <span className="font-mono">{userDetails.activeSession.nasipaddress}</span></div>
                </div>
              </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 flex items-center space-x-3 bg-muted/20 border-border/50 shadow-none">
                <Database className="h-8 w-8 text-primary/85" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total Data</p>
                  <p className="text-sm font-bold mt-0.5">{formatBytes(userDetails.stats.totalBytes)}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center space-x-3 bg-muted/20 border-border/50 shadow-none">
                <Clock className="h-8 w-8 text-primary/85" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Online Time</p>
                  <p className="text-sm font-bold mt-0.5">{formatDuration(userDetails.stats.totalDuration)}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center space-x-3 bg-muted/20 border-border/50 shadow-none">
                <Calendar className="h-8 w-8 text-primary/85" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Last Login</p>
                  <p className="text-sm font-bold mt-0.5">
                    {userDetails.stats.lastLogin ? new Date(userDetails.stats.lastLogin).toLocaleDateString() : "Never"}
                  </p>
                </div>
              </Card>
            </div>

            {/* Used Devices (MAC addresses) */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Used MAC Addresses ({userDetails.macs.length})</h4>
              {userDetails.macs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No devices recorded.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userDetails.macs.map((mac: string) => (
                    <Badge key={mac} variant="secondary" className="font-mono text-xs px-2.5 py-0.5">
                      {mac}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sessions Table */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recent Login History (Last 5 Sessions)</h4>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[500px] text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>MAC Address</TableHead>
                      <TableHead>Termination Cause</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userDetails.recentSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          No history found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      userDetails.recentSessions.map((sess: any) => (
                        <TableRow key={sess.radacctid}>
                          <TableCell className="font-mono">{new Date(sess.acctstarttime).toLocaleString()}</TableCell>
                          <TableCell>{formatDuration(sess.acctsessiontime)}</TableCell>
                          <TableCell className="font-mono">{sess.framedipaddress || "-"}</TableCell>
                          <TableCell className="font-mono">{sess.callingstationid || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{sess.acctterminatecause || "Active"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No data.
          </div>
        )}
        <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
          <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
