import { useState, useEffect } from "react"
import { Plus, Trash2, ShieldCheck, Loader2, Edit, Building, Tag, ArrowDown, ArrowUp, Clock, Info, Minus, Plus as PlusIcon } from "lucide-react"
// import { useTranslation } from "react-i18next"
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
import { usePagination } from "@/hooks/use-pagination"
import { DataTablePagination } from "@/components/data-table-pagination"

type ProfileData = {
  name: string
  downloadSpeed: string
  uploadSpeed: string
  sessionTimeout: number | null
  sharedUsers: number | null
  vlanId?: string
  fortiGroupName?: string
  advancedAttributes?: { attribute: string, op: string, value: string, type: 'check' | 'reply' }[]
}

export function ProfilesPage() {
  // const { t } = useTranslation()
  const { user, isImpersonating } = useAuth()
  const MySwal = withReactContent(Swal)
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all")
  
  const filteredProfiles = profiles.filter(profile => {
    const matchesTenant = selectedTenantFilter === "all" || (profile as any).tenantId === selectedTenantFilter;
    return matchesTenant;
  })

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData,
    totalPages,
    totalItems
  } = usePagination(filteredProfiles)
  const [tenants, setTenants] = useState<{id: string, name: string, primaryDeviceType?: string, defaultRegisterProfile?: string | null}[]>([])
  const [dictionary, setDictionary] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingProfileName, setEditingProfileName] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("mikrotik")
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    name: "",
    tenantId: "",
    downloadSpeed: "",
    uploadSpeed: "",
    sessionTimeout: "",
    sharedUsers: "",
    vlanId: "",
    fortiGroupName: "",
    advancedAttributes: [] as { attribute: string, op: string, value: string, type: 'check' | 'reply' }[]
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

  const fetchDictionary = async () => {
    try {
      const response = await api.get("/dictionary")
      setDictionary(response.data)
    } catch (error) {
      console.error("Failed to fetch dictionary:", error)
    }
  }

  useEffect(() => {
    fetchProfiles()
    fetchTenants()
    fetchDictionary()
  }, [user])

  // @ts-expect-error unused
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
      setFormData({ name: "", tenantId: "", downloadSpeed: "", uploadSpeed: "", sessionTimeout: "", sharedUsers: "", vlanId: "", fortiGroupName: "", advancedAttributes: [] })
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
    setFormData({ name: "", tenantId: "", downloadSpeed: "", uploadSpeed: "", sessionTimeout: "", sharedUsers: "", vlanId: "", fortiGroupName: "", advancedAttributes: [] })
    
    const defaultType = (user as any)?.primaryDeviceType || "mikrotik";
    setActiveTab(defaultType)
    setStep(1)
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
      sharedUsers: profile.sharedUsers ? profile.sharedUsers.toString() : "",
      vlanId: profile.vlanId || "",
      fortiGroupName: profile.fortiGroupName || "",
      advancedAttributes: profile.advancedAttributes || []
    })
    
    // Determine step 1 mode (activeTab) based on properties
    if (profile.fortiGroupName) {
      setActiveTab("fortigate")
    } else if (profile.vlanId) {
      setActiveTab("standard")
    } else if (profile.advancedAttributes && profile.advancedAttributes.length > 0 && !profile.downloadSpeed) {
      setActiveTab("advanced")
    } else {
      setActiveTab("mikrotik")
    }
    
    setStep(1)
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
      if (dataToSend.vlanId) payload.vlanId = dataToSend.vlanId
      if (dataToSend.fortiGroupName) payload.fortiGroupName = dataToSend.fortiGroupName
      if (dataToSend.advancedAttributes && dataToSend.advancedAttributes.length > 0) payload.advancedAttributes = dataToSend.advancedAttributes
      
      if (editingProfileName) {
        payload.oldName = editingProfileName
        await api.put("/profiles", payload)
      } else {
        await api.post("/profiles", payload)
      }
      
      setIsDialogOpen(false)
      setFormData({ name: "", tenantId: "", downloadSpeed: "", uploadSpeed: "", sessionTimeout: "", sharedUsers: "", vlanId: "", fortiGroupName: "", advancedAttributes: [] })
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
    let isDefault = false;
    if (user?.role === "super_admin" || user?.role === "admin") {
      const profile = profiles.find(p => p.name === name);
      if (profile && (profile as any).tenantId) {
        const tenant = tenants.find(t => t.id === (profile as any).tenantId);
        if (tenant && tenant.defaultRegisterProfile === name) {
          isDefault = true;
        }
      }
    } else {
      if ((user as any)?.defaultRegisterProfile === name) {
        isDefault = true;
      }
    }

    if (isDefault) {
      await MySwal.fire({
        title: 'Cannot Delete',
        text: `The profile "${name}" is currently set as the default registration profile. Please change the default profile in the tenant settings before deleting it.`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

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
        {user?.role === "super_admin" && !isImpersonating && (
          <div className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-full sm:w-64 flex items-center gap-2">
                <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue placeholder="All Tenants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {tenants.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        <CardContent className="pt-0 sm:pt-6 p-4 sm:p-6 flex flex-col h-[540px]">
          <div className="rounded-md border overflow-auto max-h-[420px]">
            <Table className="min-w-[700px] sm:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  {user?.role === "super_admin" && !isImpersonating && (
                    <TableHead>Tenant / Site</TableHead>
                  )}
                  <TableHead>Speed (DL/UL)</TableHead>
                  <TableHead>Time Limit (Sec)</TableHead>
                  <TableHead>Shared Devices</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === "super_admin" && !isImpersonating ? 6 : 5} className="h-24 text-center text-muted-foreground">
                      No packages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((profile) => (
                    <TableRow key={profile.name} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                          {profile.name}
                        </div>
                      </TableCell>
                      {user?.role === "super_admin" && !isImpersonating && (
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-normal text-secondary-foreground">
                            {tenants.find(t => t.id === (profile as any).tenantId)?.name || 'Unknown'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        {profile.downloadSpeed && profile.uploadSpeed 
                          ? <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{profile.downloadSpeed} / {profile.uploadSpeed}</span>
                          : profile.vlanId 
                            ? <span className="font-mono bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded text-xs">VLAN: {profile.vlanId}</span>
                            : <span className="text-muted-foreground">Unlimited</span>}
                        {profile.advancedAttributes && profile.advancedAttributes.length > 0 && (
                          <span className="ml-2 font-mono bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded text-xs">+{profile.advancedAttributes.length} Attrs</span>
                        )}
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
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 max-h-[90vh] flex flex-col">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
              {editingProfileName ? "Edit Internet Package" : "Add Internet Package"}
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              {editingProfileName ? "Update bandwidth and session rules for users." : "Set bandwidth and session rules for users."}
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 3) handleCreateProfileWrapper(e);
            }} 
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Step Indicator */}
            <div className="flex items-center justify-between px-8 py-3.5 bg-muted/30 border-b border-border text-[12px] text-muted-foreground select-none">
              <div className="flex items-center gap-2">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</span>
                <span className={step === 1 ? 'font-bold text-foreground' : 'font-medium'}>General Info</span>
              </div>
              <div className={`h-[1px] flex-1 mx-3 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
              <div className="flex items-center gap-2">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</span>
                <span className={step === 2 ? 'font-bold text-foreground' : 'font-medium'}>Limits</span>
              </div>
              <div className={`h-[1px] flex-1 mx-3 transition-colors ${step >= 3 ? 'bg-primary' : 'bg-border'}`} />
              <div className="flex items-center gap-2">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</span>
                <span className={step === 3 ? 'font-bold text-foreground' : 'font-medium'}>Configuration</span>
              </div>
            </div>

            <div className="px-5 sm:px-7 pb-4 pt-4 space-y-4 flex-1 overflow-y-auto">
              
              {/* STEP 1: General Info */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
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
                    <Label className="text-[14px] font-semibold text-foreground">Package Type</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab("mikrotik")}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${activeTab === "mikrotik" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/50"}`}
                      >
                        <span className="text-[18px] mb-1">📶</span>
                        <span className="text-[12px] font-semibold">MikroTik</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Bandwidth</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("fortigate")}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${activeTab === "fortigate" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/50"}`}
                      >
                        <span className="text-[18px] mb-1">🛡️</span>
                        <span className="text-[12px] font-semibold">FortiGate</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Traffic Shaper</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("standard")}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${activeTab === "standard" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/50"}`}
                      >
                        <span className="text-[18px] mb-1">🏷️</span>
                        <span className="text-[12px] font-semibold">Standard VLAN</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">802.1X VLAN</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("advanced")}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${activeTab === "advanced" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/50"}`}
                      >
                        <span className="text-[18px] mb-1">⚙️</span>
                        <span className="text-[12px] font-semibold">Advanced</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Custom Attributes</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Session & Simultaneous Limits */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
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
              )}

              {/* STEP 3: Mode-Specific Technical Config */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col overflow-hidden">
                  
                  {activeTab === "mikrotik" && (
                    <div className="space-y-2">
                      <Label className="text-[14px] font-semibold text-foreground">Bandwidth Limit</Label>
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
                  )}

                  {activeTab === "standard" && (
                    <div className="space-y-2">
                      <Label className="text-[14px] font-semibold text-foreground">VLAN Assignment</Label>
                      <div className="border border-border rounded-[8px] p-3 bg-background">
                        <Label htmlFor="vlanId" className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                          VLAN ID (Tunnel-Private-Group-Id)
                        </Label>
                        <div className="relative mt-2 flex items-center">
                          <Input 
                            id="vlanId" 
                            value={formData.vlanId} 
                            onChange={e => setFormData({...formData, vlanId: e.target.value})} 
                            placeholder="e.g. 100" 
                            className="h-9 border-none shadow-none rounded-none border-b border-border focus-visible:ring-0 px-0 text-[14px]"
                          />
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-2">
                          For Enterprise routers (Cisco, Fortigate, Aruba). This automatically sends standard RFC tunnel attributes.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "fortigate" && (
                    <div className="space-y-2">
                      <Label className="text-[14px] font-semibold text-foreground">FortiGate Traffic Shaper</Label>
                      <div className="border border-border rounded-[8px] p-3 bg-background">
                        <Label htmlFor="fortiGroupName" className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                          Group Name (Fortinet-Group-Name)
                        </Label>
                        <div className="relative mt-2 flex items-center">
                          <Input 
                            id="fortiGroupName" 
                            value={formData.fortiGroupName} 
                            onChange={e => setFormData({...formData, fortiGroupName: e.target.value})} 
                            placeholder="e.g. VIP-Group" 
                            className="h-9 border-none shadow-none rounded-none border-b border-border focus-visible:ring-0 px-0 text-[14px]"
                          />
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-3 rounded-md mt-4 text-[12px] flex gap-2 items-start">
                          <Info className="h-4 w-4 mt-0.5 shrink-0" />
                          <p>
                            To enforce speed limits on FortiGate, ensure you have created a User Group matching this exact name on your FortiGate firewall, and assigned a Traffic Shaper rule to it.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "advanced" && (
                    <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                      <Label className="text-[14px] font-semibold text-foreground">Advanced Custom Attributes</Label>
                      <div className="border border-border rounded-[8px] overflow-hidden flex-1 flex flex-col">
                        <div className="overflow-y-auto flex-1">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="h-9 py-1 px-3 text-[12px]">Attribute Name</TableHead>
                                <TableHead className="h-9 py-1 px-3 text-[12px] w-[70px]">Op</TableHead>
                                <TableHead className="h-9 py-1 px-3 text-[12px]">Value</TableHead>
                                <TableHead className="h-9 py-1 px-3 text-[12px] w-[90px]">Type</TableHead>
                                <TableHead className="h-9 py-1 px-3 text-[12px] w-[40px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formData.advancedAttributes.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-8">
                                    No custom attributes added. Click the button below to add one.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                formData.advancedAttributes.map((attr, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="p-1.5 px-3">
                                      <Input 
                                        list="dictionary-attributes"
                                        value={attr.attribute} 
                                        onChange={e => {
                                          const val = e.target.value;
                                          const newAttrs = [...formData.advancedAttributes];
                                          newAttrs[idx].attribute = val;
                                          
                                          // Auto-fill op and type if it matches dictionary
                                          const dictItem = dictionary.find(d => d.attribute === val);
                                          if (dictItem) {
                                            newAttrs[idx].op = dictItem.recommendedOp;
                                            newAttrs[idx].type = dictItem.recommendedType;
                                          }
                                          
                                          setFormData({...formData, advancedAttributes: newAttrs});
                                        }}
                                        className="h-7 text-[12px] focus-visible:ring-1 px-2"
                                        placeholder="e.g. Filter-Id"
                                      />
                                      <datalist id="dictionary-attributes">
                                        {dictionary.map((d, i) => (
                                          <option key={i} value={d.attribute}>{d.vendor}</option>
                                        ))}
                                      </datalist>
                                    </TableCell>
                                    <TableCell className="p-1.5 px-2">
                                      <Select 
                                        value={attr.op} 
                                        onValueChange={v => {
                                          const newAttrs = [...formData.advancedAttributes];
                                          newAttrs[idx].op = v;
                                          setFormData({...formData, advancedAttributes: newAttrs});
                                        }}
                                      >
                                        <SelectTrigger className="h-7 text-[12px] px-2">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="=">=</SelectItem>
                                          <SelectItem value=":=">:=</SelectItem>
                                          <SelectItem value="+=">+=</SelectItem>
                                          <SelectItem value="==">==</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-1.5 px-3">
                                      <Input 
                                        value={attr.value} 
                                        onChange={e => {
                                          const newAttrs = [...formData.advancedAttributes];
                                          newAttrs[idx].value = e.target.value;
                                          setFormData({...formData, advancedAttributes: newAttrs});
                                        }}
                                        className="h-7 text-[12px] focus-visible:ring-1 px-2"
                                        placeholder="Value"
                                      />
                                    </TableCell>
                                    <TableCell className="p-1.5 px-2">
                                      <Select 
                                        value={attr.type} 
                                        onValueChange={(v: 'check' | 'reply') => {
                                          const newAttrs = [...formData.advancedAttributes];
                                          newAttrs[idx].type = v;
                                          setFormData({...formData, advancedAttributes: newAttrs});
                                        }}
                                      >
                                        <SelectTrigger className="h-7 text-[12px] px-2">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="reply">Reply</SelectItem>
                                          <SelectItem value="check">Check</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-1.5 px-3">
                                      <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          const newAttrs = [...formData.advancedAttributes];
                                          newAttrs.splice(idx, 1);
                                          setFormData({...formData, advancedAttributes: newAttrs});
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="p-2 border-t border-border bg-muted/20">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[12px] w-full bg-background"
                            onClick={() => {
                              setFormData({
                                ...formData, 
                                advancedAttributes: [...formData.advancedAttributes, { attribute: '', op: ':=', value: '', type: 'reply' }]
                              });
                            }}
                          >
                            <PlusIcon className="mr-1 h-3 w-3" /> Add Custom Attribute
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
            
            {/* Step Controls (Footer) */}
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              {step === 1 && (
                <>
                  <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px] border-border text-foreground bg-transparent hover:bg-muted text-[14px] font-semibold" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold shadow-none" onClick={() => {
                    if (!formData.name) {
                      toast.error("Please enter a package name.");
                      return;
                    }
                    if ((user?.role === "super_admin" || user?.role === "admin") && !formData.tenantId) {
                      toast.error("Please select a tenant.");
                      return;
                    }
                    setStep(2);
                  }}>
                    Next
                  </Button>
                </>
              )}
              {step === 2 && (
                <>
                  <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px] border-border text-foreground bg-transparent hover:bg-muted text-[14px] font-semibold" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="button" className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold shadow-none" onClick={() => setStep(3)}>
                    Next
                  </Button>
                </>
              )}
              {step === 3 && (
                <>
                  <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px] border-border text-foreground bg-transparent hover:bg-muted text-[14px] font-semibold" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold shadow-none">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
