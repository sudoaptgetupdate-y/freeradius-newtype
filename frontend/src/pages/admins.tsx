import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, Building, Loader2, UserCog, Mail, ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { usePagination } from "@/hooks/use-pagination"
import { DataTablePagination } from "@/components/data-table-pagination"

type AdminData = {
  id: string
  email: string
  role: string
  tenantId: string | null
  createdAt: string
}

type TenantData = {
  id: string
  name: string
}

export default function AdminsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const MySwal = withReactContent(Swal)
  
  const [adminsList, setAdminsList] = useState<AdminData[]>([])
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "tenant_admin",
    tenantId: ""
  })

  const fetchAdmins = async () => {
    try {
      const response = await api.get("/admins")
      setAdminsList(response.data)
    } catch (error) {
      console.error("Failed to fetch admins:", error)
    }
  }

  const fetchTenants = async () => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      try {
        const response = await api.get("/tenants")
        setTenants(response.data)
      } catch (error) {
        console.error("Failed to fetch tenants:", error)
      }
    }
  }

  useEffect(() => {
    fetchAdmins()
    fetchTenants()
  }, [user])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validations
    if ((user?.role === "super_admin" || user?.role === "admin") && !formData.tenantId && (formData.role === "tenant_admin" || formData.role === "tenant_staff")) {
      toast.error("Please select a Tenant Site for this role.")
      return
    }

    if (!editingId && !formData.password) {
      toast.error("Password is required for new users.")
      return
    }

    setIsLoading(true)
    try {
      const payload: any = { ...formData }
      if (!payload.tenantId || payload.role === "super_admin" || payload.role === "master_staff") {
        delete payload.tenantId
      }
      if (!payload.password) {
        delete payload.password
      }
      
      if (editingId) {
        await api.put(`/admins/${editingId}`, payload)
      } else {
        await api.post("/admins", payload)
      }
      
      setIsDialogOpen(false)
      setFormData({ email: "", password: "", role: "tenant_admin", tenantId: "" })
      setEditingId(null)
      toast.success(editingId ? "User updated successfully!" : "User created successfully!")
      fetchAdmins()
    } catch (error: any) {
      console.error(editingId ? "Failed to update User:" : "Failed to create User:", error)
      const errorMsg = error.response?.data?.message || error.response?.data?.error || (editingId ? "Failed to update User" : "Failed to create User")
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({ email: "", password: "", role: "tenant_admin", tenantId: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (admin: AdminData) => {
    setEditingId(admin.id)
    setFormData({
      email: admin.email,
      password: "", // empty for update
      role: admin.role,
      tenantId: admin.tenantId || ""
    })
    setIsDialogOpen(true)
  }

  const handleDeleteAdmin = async (id: string, email: string) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the user ${email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/admins/${id}`)
        toast.success("User deleted successfully!")
        fetchAdmins()
      } catch (error: any) {
        console.error("Failed to delete admin:", error)
        toast.error(error.response?.data?.error || "Failed to delete user")
      }
    }
  }

  const filteredAdmins = adminsList.filter(admin => 
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    admin.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData,
    totalPages,
    totalItems
  } = usePagination(filteredAdmins)

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'super_admin': return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'master_staff': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'tenant_admin': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'tenant_staff': return 'bg-green-500/10 text-green-600 border-green-500/20'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('admins.title')}</h2>
          <p className="text-muted-foreground">{t('admins.subtitle')}</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('admins.addAdmin')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('admins.search')}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 flex flex-col h-[540px]">
          <div className="rounded-md border overflow-auto max-h-[420px]">
            <Table className="min-w-[700px] sm:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">{t('admins.colEmail')}</TableHead>
                  <TableHead>{t('admins.colRole')}</TableHead>
                  {user?.role === "super_admin" && (
                    <TableHead>{t('admins.colTenant')}</TableHead>
                  )}
                  <TableHead className="text-right">{t('admins.colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === "super_admin" ? 4 : 3} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((admin) => (
                    <TableRow key={admin.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeColor(admin.role)}>
                          {admin.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      {user?.role === "super_admin" && (
                        <TableCell>
                          {admin.tenantId ? (
                            <span className="flex items-center text-sm">
                              <Building className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                              {tenants.find(t => t.id === admin.tenantId)?.name || "Unknown"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">System Wide</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(admin)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                          onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                          disabled={admin.id === user?.id} // Cannot delete self
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-gradient-to-r from-slate-800 to-slate-900">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-white pr-6">
              {editingId ? "Edit System User" : t('admins.addAdmin')}
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-slate-300 mt-1 sm:mt-1.5">
              {editingId ? "Update user account information and roles." : "Create a new user account for the system."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="flex flex-col flex-1 min-h-0">
            <div className="grid gap-4 px-5 sm:px-7 py-4 flex-1 overflow-y-auto">
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[14px] font-semibold text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="user@example.com" 
                    required 
                    className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[14px] font-semibold text-foreground">
                  Password {editingId && <span className="text-muted-foreground font-normal text-xs">(Leave empty to keep current)</span>}
                </Label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password"
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    placeholder={editingId ? "Enter new password" : "Secure password"} 
                    required={!editingId}
                    className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-[14px] font-semibold text-foreground">
                  User Role
                </Label>
                <div className="relative">
                  <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                    <SelectTrigger id="role" className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  <SelectContent>
                    {user?.role === "super_admin" && (
                      <>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="master_staff">Master Staff</SelectItem>
                      </>
                    )}
                    <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                    <SelectItem value="tenant_staff">Tenant Staff</SelectItem>
                  </SelectContent>
                </Select>
                </div>
              </div>

              {user?.role === "super_admin" && (formData.role === "tenant_admin" || formData.role === "tenant_staff") && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50 mt-2">
                  <Label htmlFor="tenant" className="text-[14px] font-semibold text-foreground">Assign to Tenant Site</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val})}>
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

            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update User" : "Save User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
