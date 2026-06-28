import { useState, useEffect } from "react"
import { Plus, Trash2, ShieldCheck, Loader2, Edit, Building, Tag, ArrowDown, ArrowUp, Clock, Info, Minus, Plus as PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

type ProfileData = {
  name: string
  downloadSpeed: string
  uploadSpeed: string
  sessionTimeout: number | null
  sharedUsers: number | null
}

export function ProfilesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const MySwal = withReactContent(Swal)
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingProfileName, setEditingProfileName] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    tenantId: "",
    downloadSpeed: "",
    uploadSpeed: "",
    sessionTimeout: "",
    sharedUsers: ""
  })

  const fetchProfiles = async () => {
    try {
      const response = await api.get("/profiles")
      setProfiles(response.data)
    } catch (error) {
      console.error("Failed to fetch profiles:", error)
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
        console.error("Failed to fetch tenants:", error)
      }
    }
  }

  useEffect(() => {
    fetchProfiles()
    fetchTenants()
  }, [user])

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((user?.role === "super_admin" || user?.role === "admin") && !formData.tenantId) {
      toast.error("Please select a Tenant before saving.")
      return
    }

    setIsLoading(true)
    
    try {
      const payload: any = { name: formData.name }
      if (formData.tenantId) payload.tenantId = formData.tenantId
      if (formData.downloadSpeed) payload.downloadSpeed = formData.downloadSpeed
      if (formData.uploadSpeed) payload.uploadSpeed = formData.uploadSpeed
      if (formData.sessionTimeout) payload.sessionTimeout = parseInt(formData.sessionTimeout)
      if (formData.sharedUsers) payload.sharedUsers = parseInt(formData.sharedUsers)
      
      if (editingProfileName) {
        payload.oldName = editingProfileName
        await api.put("/profiles", payload)
      } else {
        await api.post("/profiles", payload)
      }
      
      setIsDialogOpen(false)
      setFormData({ name: "", tenantId: "", downloadSpeed: "", uploadSpeed: "", sessionTimeout: "", sharedUsers: "" })
      setEditingProfileName(null)
      toast.success(editingProfileName ? "Profile updated successfully!" : "Profile created successfully!")
      fetchProfiles()
    } catch (error: any) {
      console.error(editingProfileName ? "Failed to update profile:" : "Failed to create profile:", error)
      toast.error(error.response?.data?.error || (editingProfileName ? "Failed to update profile" : "Failed to create profile"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingProfileName(null)
    setFormData({ name: "", tenantId: "", downloadSpeed: "", uploadSpeed: "", sessionTimeout: "", sharedUsers: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (profile: ProfileData) => {
    setEditingProfileName(profile.name)
    setFormData({
      name: profile.name,
      tenantId: (profile as any).tenantId || "",
      downloadSpeed: profile.downloadSpeed ? profile.downloadSpeed.replace('M', '') : "",
      uploadSpeed: profile.uploadSpeed ? profile.uploadSpeed.replace('M', '') : "",
      sessionTimeout: profile.sessionTimeout ? profile.sessionTimeout.toString() : "",
      sharedUsers: profile.sharedUsers ? profile.sharedUsers.toString() : ""
    })
    setIsDialogOpen(true)
  }

  const handleCreateProfileWrapper = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Copy form data to manipulate for API
    const dataToSend = { ...formData };
    
    // Append 'M' to speeds if they are provided as numbers
    if (dataToSend.downloadSpeed && !dataToSend.downloadSpeed.endsWith('M')) {
      dataToSend.downloadSpeed = `${dataToSend.downloadSpeed}M`;
    }
    if (dataToSend.uploadSpeed && !dataToSend.uploadSpeed.endsWith('M')) {
      dataToSend.uploadSpeed = `${dataToSend.uploadSpeed}M`;
    }

    // Replace the default handler's formData dependency with our modified data
    // For simplicity, we just temporarily swap formData, call original, then swap back (or just rewrite the api call here)
    if ((user?.role === "super_admin" || user?.role === "admin") && !dataToSend.tenantId) {
      toast.error("Please select a Tenant before saving.")
      return
    }

    setIsLoading(true)
    
    try {
      const payload: any = { name: dataToSend.name }
      if (dataToSend.tenantId) payload.tenantId = dataToSend.tenantId
      if (dataToSend.downloadSpeed) payload.downloadSpeed = dataToSend.downloadSpeed
      if (dataToSend.uploadSpeed) payload.uploadSpeed = dataToSend.uploadSpeed
      if (dataToSend.sessionTimeout) payload.sessionTimeout = parseInt(dataToSend.sessionTimeout)
      if (dataToSend.sharedUsers) payload.sharedUsers = parseInt(dataToSend.sharedUsers)
      
      if (editingProfileName) {
        payload.oldName = editingProfileName
        await api.put("/profiles", payload)
      } else {
        await api.post("/profiles", payload)
      }
      
      setIsDialogOpen(false)
      setFormData({ name: "", tenantId: "", downloadSpeed: "", uploadSpeed: "", sessionTimeout: "", sharedUsers: "" })
      setEditingProfileName(null)
      toast.success(editingProfileName ? "Profile updated successfully!" : "Profile created successfully!")
      fetchProfiles()
    } catch (error: any) {
      console.error(editingProfileName ? "Failed to update profile:" : "Failed to create profile:", error)
      toast.error(error.response?.data?.error || (editingProfileName ? "Failed to update profile" : "Failed to create profile"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProfile = async (name: string) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete profile ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        // Find profile's tenantId if super admin
        let tenantIdQuery = ""
        if (user?.role === "super_admin" || user?.role === "admin") {
          const profile = profiles.find(p => p.name === name)
          if (profile && (profile as any).tenantId) {
            tenantIdQuery = `&tenantId=${(profile as any).tenantId}`
          }
        }
        await api.delete(`/profiles?name=${encodeURIComponent(name)}${tenantIdQuery}`)
        toast.success("Profile deleted successfully!")
        fetchProfiles()
      } catch (error: any) {
        console.error("Failed to delete profile:", error)
        toast.error(error.response?.data?.error || "Failed to delete profile")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Internet Packages</h2>
          <p className="text-muted-foreground">Create and manage RADIUS profiles (speed limits, time quotas).</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </div>

      <Card>
        <CardContent className="pt-0 sm:pt-6 p-4 sm:p-6">
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[700px] sm:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Speed (DL/UL)</TableHead>
                  <TableHead>Time Limit (Sec)</TableHead>
                  <TableHead>Shared Devices</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No packages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile) => (
                    <TableRow key={profile.name} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                            {profile.name}
                          </div>
                          {(user?.role === "super_admin" || user?.role === "admin") && (profile as any).tenantId && (
                            <span className="text-xs text-muted-foreground ml-6">Tenant: {(profile as any).tenantId}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile.downloadSpeed && profile.uploadSpeed 
                          ? <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{profile.downloadSpeed} / {profile.uploadSpeed}</span>
                          : <span className="text-muted-foreground">Unlimited</span>}
                      </TableCell>
                      <TableCell>
                        {profile.sessionTimeout ? `${profile.sessionTimeout}s` : <span className="text-muted-foreground">Unlimited</span>}
                      </TableCell>
                      <TableCell>
                        {profile.sharedUsers || 1}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(profile)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProfile(profile.name)}>
                          <Trash2 className="h-4 w-4" />
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
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-white [&>button]:hover:bg-white/20 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 bg-gradient-to-r from-slate-800 to-slate-900">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-white pr-6">
              {editingProfileName ? "Edit Internet Package" : "Add Internet Package"}
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              {editingProfileName ? "Update bandwidth and session rules for users." : "Set bandwidth and session rules for users."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProfileWrapper} className="flex flex-col h-full">
            <div className="px-5 sm:px-7 pb-4 space-y-4 flex-1 overflow-y-auto">
              {(user?.role === "super_admin" || user?.role === "admin") && (
                <div className="space-y-1.5">
                  <Label htmlFor="tenant" className="text-[14px] font-semibold text-foreground">Tenant</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val})}>
                      <SelectTrigger id="tenant" className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
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
              
              <div className="h-[1px] bg-border w-full" />

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[14px] font-semibold text-foreground">Package Name</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. 10M/10M, VIP-1Day" 
                    required 
                    className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                  />
                </div>
                <p className="text-[12px] text-muted-foreground">This will be used as the RADIUS profile name.</p>
              </div>
              
              <div className="h-[1px] bg-border w-full" />

              <div className="space-y-2">
                <Label className="text-[14px] font-semibold text-foreground">Bandwidth</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                  <div className="border border-border rounded-[8px] p-2.5 bg-background">
                    <Label htmlFor="downloadSpeed" className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      Download Speed
                      <ArrowDown className="h-4 w-4 text-blue-600" />
                    </Label>
                    <div className="relative mt-2 flex items-center">
                      <Input 
                        id="downloadSpeed" 
                        value={formData.downloadSpeed} 
                        onChange={e => setFormData({...formData, downloadSpeed: e.target.value})} 
                        placeholder="e.g. 10" 
                        className="pr-14 h-8 border-none shadow-none rounded-none border-b border-border focus-visible:ring-0 px-0 text-[14px]"
                      />
                      <span className="absolute right-0 text-[12px] font-medium bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">Mbps</span>
                    </div>
                  </div>
                  <div className="border border-border rounded-[8px] p-2.5 bg-background">
                    <Label htmlFor="uploadSpeed" className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      Upload Speed
                      <ArrowUp className="h-4 w-4 text-emerald-500" />
                    </Label>
                    <div className="relative mt-2 flex items-center">
                      <Input 
                        id="uploadSpeed" 
                        value={formData.uploadSpeed} 
                        onChange={e => setFormData({...formData, uploadSpeed: e.target.value})} 
                        placeholder="e.g. 10" 
                        className="pr-14 h-8 border-none shadow-none rounded-none border-b border-border focus-visible:ring-0 px-0 text-[14px]"
                      />
                      <span className="absolute right-0 text-[12px] font-medium bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">Mbps</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-border w-full" />

              <div className="space-y-2">
                <Label className="text-[14px] font-semibold text-foreground">Session Rules</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                  <div className="space-y-1.5">
                    <Label htmlFor="sessionTimeout" className="text-[12px] font-medium text-muted-foreground">
                      Time Limit (Seconds)
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select 
                        value={formData.sessionTimeout || "unlimited"} 
                        onValueChange={(val) => setFormData({...formData, sessionTimeout: val === "unlimited" ? "" : val})}
                      >
                        <SelectTrigger className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background text-foreground">
                          <SelectValue placeholder="Unlimited" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                          <SelectItem value="3600">1 Hour (3600s)</SelectItem>
                          <SelectItem value="86400">1 Day (86400s)</SelectItem>
                          <SelectItem value="2592000">30 Days (2592000s)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sharedUsers" className="text-[12px] font-medium text-muted-foreground">
                      Simultaneous Devices
                    </Label>
                    <div className="relative flex items-center h-[44px] border border-border rounded-[8px] bg-background overflow-hidden">
                      <button 
                        type="button" 
                        className="h-full px-3 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors border-r border-border"
                        onClick={() => {
                          const current = parseInt(formData.sharedUsers) || 1;
                          if (current > 1) setFormData({...formData, sharedUsers: (current - 1).toString()});
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <Input 
                        id="sharedUsers" 
                        type="number"
                        value={formData.sharedUsers || "1"} 
                        onChange={e => setFormData({...formData, sharedUsers: e.target.value})} 
                        className="h-full border-none shadow-none text-center text-[14px] font-semibold text-foreground focus-visible:ring-0 px-0"
                      />
                      <button 
                        type="button" 
                        className="h-full px-3 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors border-l border-border"
                        onClick={() => {
                          const current = parseInt(formData.sharedUsers) || 1;
                          setFormData({...formData, sharedUsers: (current + 1).toString()});
                        }}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-blue-50/70 dark:bg-blue-500/10 p-2.5 rounded-[8px] border border-blue-100 dark:border-blue-500/20 mt-1.5">
                  <div className="mt-0.5">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-blue-900 dark:text-blue-100">Simultaneous Devices</h4>
                    <p className="text-[12px] text-blue-700/80 dark:text-blue-200/70 mt-0.5">The number of devices that can use this package at the same time.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px] border-border text-foreground bg-transparent hover:bg-muted text-[14px] font-semibold" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold shadow-none">
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
