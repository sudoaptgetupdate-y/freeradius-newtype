import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, Building2, Loader2, Mail, Key, Users, Power, PowerOff } from "lucide-react"
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

type TenantData = {
  id: string
  name: string
  maxUsers: number
  maxNas: number
  status: string
  createdAt: string
}

export default function TenantsPage() {
  const { t } = useTranslation()
  const MySwal = withReactContent(Swal)
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    maxUsers: 100,
    maxNas: 1,
    status: "active",
    adminEmail: "",
    adminPassword: ""
  })

  const fetchTenants = async () => {
    try {
      const response = await api.get("/tenants")
      setTenants(response.data)
    } catch (error) {
      console.error("Failed to fetch tenants:", error)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (editingTenantId) {
        const payload: any = { ...formData }
        // Admin fields are not updated through this endpoint
        delete payload.adminEmail
        delete payload.adminPassword
        await api.put(`/tenants/${editingTenantId}`, payload)
      } else {
        await api.post("/tenants", formData)
      }
      setIsDialogOpen(false)
      setFormData({ name: "", maxUsers: 100, maxNas: 1, status: "active", adminEmail: "", adminPassword: "" })
      setEditingTenantId(null)
      toast.success(editingTenantId ? "Tenant updated successfully!" : "Tenant created successfully!")
      fetchTenants()
    } catch (error: any) {
      console.error("Failed to create tenant:", error)
      toast.error(error.response?.data?.error || "Failed to create tenant")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingTenantId(null)
    setFormData({ name: "", maxUsers: 100, maxNas: 1, status: "active", adminEmail: "", adminPassword: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (tenant: TenantData) => {
    setEditingTenantId(tenant.id)
    setFormData({
      name: tenant.name,
      maxUsers: tenant.maxUsers,
      maxNas: tenant.maxNas,
      status: tenant.status,
      adminEmail: "", // Not used in edit mode
      adminPassword: "" // Not used in edit mode
    })
    setIsDialogOpen(true)
  }

  const handleDeleteTenant = async (tenant: TenantData) => {
    const isSuspended = tenant.status === "suspended";
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: isSuspended ? "Do you want to activate this tenant?" : "Do you want to suspend this tenant?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isSuspended ? '#10b981' : '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: isSuspended ? 'Yes, activate!' : 'Yes, suspend it!'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/tenants/${tenant.id}`)
        toast.success(isSuspended ? "Tenant activated successfully!" : "Tenant suspended successfully!")
        fetchTenants()
      } catch (error: any) {
        console.error("Failed to toggle tenant status:", error)
        toast.error(error.response?.data?.error || "Failed to change tenant status")
      }
    }
  }

  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('tenants.title')}</h2>
          <p className="text-muted-foreground">{t('tenants.subtitle')}</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('tenants.addTenant')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('tenants.search')}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[700px] sm:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">{t('tenants.colName')}</TableHead>
                  <TableHead>{t('tenants.colCapacity')}</TableHead>
                  <TableHead>{t('tenants.colStatus')}</TableHead>
                  <TableHead className="text-right">{t('tenants.colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No tenants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          {tenant.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          Users: <span className="font-mono">{tenant.maxUsers}</span> | NAS: <span className="font-mono">{tenant.maxNas}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.status === "active" ? (
                          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                            {t('tenants.statusActive')}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            {t('tenants.statusSuspended')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(tenant)}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className={`h-8 w-8 ${tenant.status === 'suspended' ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-destructive hover:bg-destructive/10'}`}
                          onClick={() => handleDeleteTenant(tenant)}
                          title={tenant.status === 'suspended' ? 'Activate Tenant' : 'Suspend Tenant'}
                        >
                          {tenant.status === "suspended" ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                        </Button>
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
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-foreground [&>button]:hover:bg-muted [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-6 border-b border-border bg-muted/30">
            <DialogTitle className="flex items-center gap-2 text-[20px] sm:text-[22px] font-bold">
              <div className="bg-primary/10 p-2 rounded-full">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              {editingTenantId ? "Edit Tenant" : t('tenants.addTenant')}
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px]">
              {editingTenantId ? "Update tenant site limits and status." : "Create a new tenant site and set their limits. An admin account will be generated."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTenant} className="flex flex-col h-full">
            <div className="grid gap-6 px-5 sm:px-7 py-4 flex-1 overflow-y-auto">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Site Details</h3>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-semibold">{t('tenants.colName')}</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Branch A Hotel" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="maxUsers" className="text-sm font-semibold flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-500" />
                      Max Users
                    </Label>
                    <Input 
                      id="maxUsers" 
                      type="number"
                      min="1"
                      value={formData.maxUsers} 
                      onChange={e => setFormData({...formData, maxUsers: parseInt(e.target.value) || 100})} 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxNas" className="text-sm font-semibold flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-purple-500" />
                      Max NAS
                    </Label>
                    <Input 
                      id="maxNas" 
                      type="number"
                      min="1"
                      value={formData.maxNas} 
                      onChange={e => setFormData({...formData, maxNas: parseInt(e.target.value) || 1})} 
                      required 
                    />
                  </div>
                </div>
                {editingTenantId && (
                  <div className="space-y-1.5 mt-2">
                    <Label htmlFor="status" className="text-sm font-semibold flex items-center gap-1.5">
                      <Power className="h-3.5 w-3.5 text-rose-500" />
                      Status
                    </Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {!editingTenantId && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Admin Account</h3>
                  </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adminEmail" className="text-sm font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-orange-500" />
                    Admin Email
                  </Label>
                  <Input 
                    id="adminEmail" 
                    type="email"
                    value={formData.adminEmail} 
                    onChange={e => setFormData({...formData, adminEmail: e.target.value})} 
                    placeholder="admin@tenant.com" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adminPassword" className="text-sm font-semibold flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-emerald-500" />
                    Temporary Password
                  </Label>
                  <Input 
                    id="adminPassword" 
                    type="text"
                    value={formData.adminPassword} 
                    onChange={e => setFormData({...formData, adminPassword: e.target.value})} 
                    placeholder="password123" 
                    required 
                  />
                </div>
              </div>
              )}
            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTenantId ? "Update Tenant" : "Save Tenant & Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
