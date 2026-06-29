import { useState, useEffect } from "react"
import { Search, Filter, MoreHorizontal, Plus, Edit, Trash2, LogOut, Loader2, User, Key, Package, Building } from "lucide-react"
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
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="rounded-md border overflow-x-auto">
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
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{user.username}</span>
                          {(user as any).tenantId && (
                            <span className="text-xs text-muted-foreground">Tenant: {(user as any).tenantId}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{user.profileName}</Badge></TableCell>
                      <TableCell className="font-mono text-xs hidden md:table-cell">{user.mac}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{user.ip}</TableCell>
                      <TableCell className="hidden sm:table-cell">{user.dataUsage}</TableCell>
                      <TableCell>
                        {user.isOnline ? (
                          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                            {t('users.statusOnline')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
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
    </div>
  )
}
