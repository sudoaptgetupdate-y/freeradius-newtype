import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, Server, Loader2, Network, Tag, Key, Type, Building } from "lucide-react"
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

type NasData = {
  id: number
  tenantId: string
  nasname: string
  shortname: string
  type: string
  secret: string
  apiUsername?: string
  apiPasswordEncrypted?: string
}

export default function NasPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const MySwal = withReactContent(Swal)
  const [nasList, setNasList] = useState<NasData[]>([])
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    nasname: "",
    shortname: "",
    type: "mikrotik",
    secret: "",
    tenantId: "",
    apiUsername: "",
    apiPasswordEncrypted: ""
  })

  const fetchNas = async () => {
    try {
      const response = await api.get("/nas")
      setNasList(response.data)
    } catch (error) {
      console.error("Failed to fetch NAS:", error)
    }
  }

  const fetchTenants = async () => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      try {
        const response = await api.get("/tenants")
        const tenantData = response.data
        setTenants(tenantData)
        // Auto-select if there is exactly 1 tenant
        if (tenantData.length === 1 && !formData.tenantId) {
          setFormData(prev => ({...prev, tenantId: tenantData[0].id}))
        }
      } catch (error) {
        console.error("Failed to fetch tenants:", error)
      }
    }
  }

  useEffect(() => {
    fetchNas()
    fetchTenants()
  }, [user])

  const handleCreateNas = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((user?.role === "super_admin" || user?.role === "admin") && !formData.tenantId) {
      toast.error("Please select a Tenant from the dropdown before saving.")
      return
    }

    setIsLoading(true)
    try {
      const payload: any = { ...formData }
      if (!payload.tenantId) {
        delete payload.tenantId
      }
      
      if (editingId) {
        await api.put(`/nas/${editingId}`, payload)
      } else {
        await api.post("/nas", payload)
      }
      
      setIsDialogOpen(false)
      setFormData({ nasname: "", shortname: "", type: "mikrotik", secret: "", tenantId: "", apiUsername: "", apiPasswordEncrypted: "" })
      setEditingId(null)
      toast.success(editingId ? "NAS updated successfully!" : "NAS created successfully!")
      fetchNas() // Refresh list
    } catch (error: any) {
      console.error(editingId ? "Failed to update NAS:" : "Failed to create NAS:", error)
      const errorMsgStr = error.response?.data?.message || error.response?.data?.error || (editingId ? "Failed to update NAS" : "Failed to create NAS")
      toast.error(typeof errorMsgStr === 'string' ? errorMsgStr : JSON.stringify(errorMsgStr))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({ nasname: "", shortname: "", type: "mikrotik", secret: "", tenantId: "", apiUsername: "", apiPasswordEncrypted: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (nas: NasData) => {
    setEditingId(nas.id)
    setFormData({
      nasname: nas.nasname,
      shortname: nas.shortname,
      type: nas.type || "other",
      secret: nas.secret || "",
      tenantId: nas.tenantId || "",
      apiUsername: nas.apiUsername || "",
      apiPasswordEncrypted: nas.apiPasswordEncrypted || ""
    })
    setIsDialogOpen(true)
  }

  const handleDeleteNas = async (id: number) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: "Do you want to delete this router?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/nas/${id}`)
        toast.success("NAS deleted successfully!")
        fetchNas() // Refresh list
      } catch (error: any) {
        console.error("Failed to delete NAS:", error)
        toast.error(error.response?.data?.error || "Failed to delete NAS")
      }
    }
  }

  const filteredNas = nasList.filter(nas => 
    nas.nasname.toLowerCase().includes(searchQuery.toLowerCase()) || 
    nas.shortname.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTestApi = async (id: number) => {
    try {
      MySwal.fire({
        title: 'Testing Connection...',
        text: 'Please wait while we connect to the router API.',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading()
        }
      })
      const response = await api.get(`/nas/${id}/status`)
      const data = response.data.data
      let info = "Connection Successful!"
      if (data && data.uptime) {
        info = `Uptime: ${data.uptime} | CPU Load: ${data['cpu-load']}% | Free Mem: ${(data['free-memory'] / 1024 / 1024).toFixed(2)} MB`
      }
      MySwal.fire({
        title: 'Success!',
        text: info,
        icon: 'success'
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Connection failed"
      MySwal.fire({
        title: 'API Test Failed',
        text: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
        icon: 'error'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('nas.title')}</h2>
          <p className="text-muted-foreground">{t('nas.subtitle')}</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('nas.addNas')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('nas.search')}
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
                  <TableHead className="w-[200px]">{t('nas.colName')}</TableHead>
                  <TableHead>{t('nas.colIp')}</TableHead>
                  <TableHead>{t('nas.colType')}</TableHead>
                  <TableHead>{t('nas.colSecret')}</TableHead>
                  <TableHead className="text-right">{t('nas.colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No router/NAS devices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNas.map((nas) => (
                    <TableRow key={nas.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                          {nas.shortname}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{nas.nasname}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {nas.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {nas.secret.replace(/./g, '*')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(nas)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteNas(nas.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {nas.type === 'mikrotik' && (
                          <Button variant="outline" size="sm" className="h-8 ml-2" onClick={() => handleTestApi(nas.id)}>
                            Test API
                          </Button>
                        )}
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
              {editingId ? "Edit Router" : t('nas.addNas')}
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              {editingId ? "Update the connection details for this router." : "Enter the connection details for the new router."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNas} className="flex flex-col flex-1 min-h-0">
            <div className="grid gap-4 px-5 sm:px-7 py-4 flex-1 overflow-y-auto">
              {(user?.role === "super_admin" || user?.role === "admin") && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Label htmlFor="tenant" className="text-[14px] font-semibold text-foreground">Select Tenant</Label>
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="shortname" className="text-[14px] font-semibold text-foreground">
                      {t('nas.colName')} (Shortname)
                    </Label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="shortname" 
                        value={formData.shortname} 
                        onChange={e => setFormData({...formData, shortname: e.target.value})} 
                        placeholder="e.g. Branch A Mikrotik" 
                        required 
                        className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nasname" className="text-[14px] font-semibold text-foreground">
                      {t('nas.colIp')} (NASName)
                    </Label>
                    <div className="relative">
                      <Network className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="nasname" 
                        value={formData.nasname} 
                        onChange={e => setFormData({...formData, nasname: e.target.value})} 
                        placeholder="e.g. 192.168.1.1" 
                        required 
                        className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-[14px] font-semibold text-foreground">
                    {t('nas.colType')} (Vendor)
                  </Label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                      <SelectTrigger id="type" className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mikrotik">Mikrotik</SelectItem>
                      <SelectItem value="fortigate">Fortigate</SelectItem>
                      <SelectItem value="cisco">Cisco</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="secret" className="text-[14px] font-semibold text-foreground">
                    {t('nas.colSecret')} (RADIUS Secret)
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="secret" 
                      type="password"
                      value={formData.secret} 
                      onChange={e => setFormData({...formData, secret: e.target.value})} 
                      placeholder="Strong secret key" 
                      required 
                      className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                    />
                  </div>
                </div>

                {formData.type === 'mikrotik' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="apiUsername" className="text-[14px] font-semibold text-foreground">API Username</Label>
                      <Input 
                        id="apiUsername" 
                        value={formData.apiUsername} 
                        onChange={e => setFormData({...formData, apiUsername: e.target.value})} 
                        placeholder="Mikrotik user (e.g. api_user)" 
                        className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="apiPassword" className="text-[14px] font-semibold text-foreground">API Password</Label>
                      <Input 
                        id="apiPassword" 
                        type="password"
                        value={formData.apiPasswordEncrypted} 
                        onChange={e => setFormData({...formData, apiPasswordEncrypted: e.target.value})} 
                        placeholder="Mikrotik password" 
                        className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
