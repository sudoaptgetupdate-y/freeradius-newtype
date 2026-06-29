import { useState, useEffect } from "react"
import { Search, Filter, MoreHorizontal, Plus, Edit, Trash2, LogOut, Loader2, User, Key, Package, Building, Eye, Calendar, Clock, Database, Laptop } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { usePagination } from "@/hooks/use-pagination"
import { DataTablePagination } from "@/components/data-table-pagination"

type UserData = {
  id: string
  username: string
  mac: string
  ip: string
  dataUsage: string
  status: string
  isOnline: boolean
  profileName: string
  tenantId?: string
}

type ProfileData = {
  name: string
  tenantId?: string
}

export function UsersPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const MySwal = withReactContent(Swal)
  const [users, setUsers] = useState<UserData[]>([])
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    profileName: "",
    tenantId: ""
  })

  // Details Dialog State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [userDetails, setUserDetails] = useState<any>(null)

  const handleOpenDetails = async (username: string) => {
    setIsDetailsOpen(true)
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
      setIsDetailsOpen(false)
    } finally {
      setIsDetailsLoading(false)
    }
  }

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

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users")
      setUsers(response.data.users)
    } catch (error) {
      console.error("Failed to fetch users", error)
    }
  }

  const fetchProfiles = async () => {
    try {
      const response = await api.get("/profiles")
      setProfiles(response.data)
    } catch (error) {
      console.error("Failed to fetch profiles", error)
    }
  }

  const fetchTenants = async () => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      try {
        const response = await api.get("/tenants")
        const tenantData = response.data
        setTenants(tenantData)
        if (tenantData.length === 1 && !formData.tenantId) {
          setFormData(prev => ({...prev, tenantId: tenantData[0].id}))
        }
      } catch (error) {
        console.error("Failed to fetch tenants", error)
      }
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchProfiles()
    fetchTenants()
  }, [user])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((user?.role === "super_admin" || user?.role === "admin") && !formData.tenantId) {
      toast.error("Please select a Tenant before saving.")
      return
    }

    setIsLoading(true)
    
    try {
      const payload: any = { 
        username: formData.username,
        password: formData.password,
        profileName: formData.profileName
      }
      if (formData.tenantId) payload.tenantId = formData.tenantId

      await api.post("/users", payload)
      setIsDialogOpen(false)
      setFormData({ username: "", password: "", profileName: "", tenantId: "" })
      toast.success("User created successfully!")
      fetchUsers()
    } catch (error: any) {
      console.error("Failed to create user:", error)
      toast.error(error.response?.data?.error || "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (username: string) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete user ${username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        let tenantIdQuery = ""
        if (user?.role === "super_admin" || user?.role === "admin") {
          const targetUser = users.find(u => u.username === username)
          if (targetUser && (targetUser as any).tenantId) {
            tenantIdQuery = `?tenantId=${(targetUser as any).tenantId}`
          }
        }
        await api.delete(`/users/${username}${tenantIdQuery}`)
        toast.success("User deleted successfully!")
        fetchUsers()
      } catch (error: any) {
        console.error("Failed to delete user:", error)
        toast.error(error.response?.data?.error || "Failed to delete user")
      }
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.mac.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || (statusFilter === "online" ? user.isOnline : !user.isOnline)
    
    return matchesSearch && matchesStatus
  })

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData,
    totalPages,
    totalItems
  } = usePagination(filteredUsers)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('users.title')}</h2>
          <p className="text-muted-foreground">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('users.addUser')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('users.search')}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('users.filterAll')}</SelectItem>
                  <SelectItem value="online">{t('users.filterOnline')}</SelectItem>
                  <SelectItem value="offline">{t('users.filterOffline')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 flex flex-col h-[540px]">
          <div className="rounded-md border overflow-auto max-h-[420px]">
            <Table className="min-w-[800px] sm:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.colUsername')}</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead className="hidden md:table-cell">{t('users.colMac')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('users.colIp')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('users.colDataUsage')}</TableHead>
                  <TableHead>{t('users.colStatus')}</TableHead>
                  <TableHead className="text-right">{t('users.colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span
                            className={`font-semibold cursor-pointer hover:underline transition-colors ${
                              user.isOnline 
                                ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" 
                                : "text-muted-foreground/80 hover:text-foreground"
                            }`}
                            onClick={() => handleOpenDetails(user.username)}
                          >
                            {user.username}
                          </span>
                          {(user as any).tenantId && (
                            <span className="text-xs text-muted-foreground">Tenant: {(user as any).tenantId}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{user.profileName}</Badge></TableCell>
                      <TableCell className={`font-mono text-xs hidden md:table-cell ${user.isOnline ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>{user.mac}</TableCell>
                      <TableCell className={`font-mono text-xs hidden lg:table-cell ${user.isOnline ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>{user.ip}</TableCell>
                      <TableCell className={`hidden sm:table-cell ${user.isOnline ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground/60"}`}>{user.dataUsage}</TableCell>
                      <TableCell>
                        {user.isOnline ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5 font-medium inline-flex items-center gap-1.5 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t('users.statusOnline')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-muted px-2 py-0.5 font-medium inline-flex items-center gap-1.5 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                            {t('users.statusOffline')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetails(user.username)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('users.actionEdit')}
                            </DropdownMenuItem>
                            {user.isOnline && (
                              <DropdownMenuItem className="text-orange-600 focus:text-orange-600">
                                <LogOut className="mr-2 h-4 w-4" />
                                {t('users.actionDisconnect')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteUser(user.username)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('users.actionDelete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
              Add User
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              Create a new user and assign a package.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0">
            <div className="grid gap-5 px-5 sm:px-7 py-4 flex-1 overflow-y-auto">
              {(user?.role === "super_admin" || user?.role === "admin") && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Label htmlFor="tenant" className="text-[14px] font-semibold text-foreground">Select Tenant</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val, profileName: ""})}>
                      <SelectTrigger id="tenant" className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[14px] font-semibold text-foreground">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="username" 
                      value={formData.username} 
                      onChange={e => setFormData({...formData, username: e.target.value})} 
                      required 
                      placeholder="Enter username"
                      className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[14px] font-semibold text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password"
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      required 
                      placeholder="Enter password"
                      className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile" className="text-[14px] font-semibold text-foreground">
                    Package / Profile
                  </Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={formData.profileName} onValueChange={(val) => setFormData({...formData, profileName: val})} required>
                      <SelectTrigger className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                        <SelectValue placeholder="Select a package" />
                      </SelectTrigger>
                    <SelectContent>
                      {profiles
                        .filter(p => !p.tenantId || p.tenantId === formData.tenantId)
                        .map(p => (
                          <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || profiles.length === 0} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
              User Details: {userDetails?.username || "Loading..."}
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
            <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
