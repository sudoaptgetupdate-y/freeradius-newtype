import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Loader2, User, Key, Building, Calendar, Layers } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"
import { formatToRadiusDate } from "../../utils/date"
import type {  TenantData, GroupData, ProfileData  } from "@/types/user"

interface CreateUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: any
  isImpersonating?: boolean
  tenants: TenantData[]
  groups: GroupData[]
  profiles: ProfileData[]
}

export function CreateUserDialog({
  isOpen,
  onClose,
  onSuccess,
  user,
  isImpersonating,
  tenants,
  groups,
  profiles
}: CreateUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [useMemberIdAsUsername, setUseMemberIdAsUsername] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    memberId: "",
    citizenId: "",
    email: "",
    phone: "",
    expiration: "",
    groupId: "",
    tenantId: ""
  })

  // Set default tenant if only one exists
  useEffect(() => {
    if (isOpen && tenants.length === 1 && !formData.tenantId) {
      setFormData(prev => ({...prev, tenantId: tenants[0].id}))
    }
  }, [isOpen, tenants, formData.tenantId])

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({ username: "", password: "", firstName: "", lastName: "", memberId: "", citizenId: "", email: "", phone: "", expiration: "", groupId: "", tenantId: "" })
      setUseMemberIdAsUsername(false)
    }
  }, [isOpen])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && !formData.tenantId) {
      toast.error("Please select a Tenant before saving.")
      return
    }

    setIsLoading(true)
    
    try {
      const payload: any = { 
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        memberId: formData.memberId,
      }
      if (formData.citizenId) payload.citizenId = formData.citizenId
      if (formData.email) payload.email = formData.email
      if (formData.phone) payload.phone = formData.phone
      if (formData.expiration) payload.expiration = formatToRadiusDate(formData.expiration)
      if (formData.groupId && formData.groupId !== "none") payload.groupId = formData.groupId
      if (formData.tenantId) payload.tenantId = formData.tenantId

      await api.post("/users", payload)
      toast.success("User created successfully!")
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Failed to create user:", error)
      toast.error(error.response?.data?.error || "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] md:max-w-[680px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
          <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
            Add User
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
            Create a new user and assign a package.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col gap-5 px-5 sm:px-7 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {(user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && (
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                <Label htmlFor="tenant" className="text-[14px] font-semibold text-foreground">Select Tenant</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val, groupId: ""})}>
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
            <div className="space-y-6">
              <div>
                <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-[13px] font-semibold text-foreground">First Name <span className="text-red-500">*</span></Label>
                    <Input id="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required placeholder="First name" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-[13px] font-semibold text-foreground">Last Name <span className="text-red-500">*</span></Label>
                    <Input id="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required placeholder="Last name" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="memberId" className="text-[13px] font-semibold text-foreground">Member ID <span className="text-red-500">*</span></Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="syncUsername" checked={useMemberIdAsUsername} onCheckedChange={(checked) => {
                          setUseMemberIdAsUsername(!!checked)
                          if (checked) setFormData(prev => ({...prev, username: prev.memberId}))
                        }} />
                        <label htmlFor="syncUsername" className="text-[12px] font-medium leading-none cursor-pointer text-muted-foreground">Use as Username</label>
                      </div>
                    </div>
                    <Input id="memberId" value={formData.memberId} onChange={e => {
                      const val = e.target.value
                      setFormData(prev => ({...prev, memberId: val, ...(useMemberIdAsUsername ? {username: val} : {})}))
                    }} required placeholder="E.g., ID card, student ID" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="citizenId" className="text-[13px] font-semibold text-foreground">Citizen ID</Label>
                    <Input id="citizenId" value={formData.citizenId} onChange={e => setFormData({...formData, citizenId: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[13px] font-semibold text-foreground">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[13px] font-semibold text-foreground">Phone</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Account Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-[13px] font-semibold text-foreground">Username <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="username" value={formData.username} disabled={useMemberIdAsUsername} onChange={e => setFormData({...formData, username: e.target.value})} required placeholder="Enter username" className={`pl-9 h-[40px] rounded-[8px] border-border text-[13px] ${useMemberIdAsUsername ? 'bg-muted/50 text-muted-foreground' : 'bg-background'}`} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[13px] font-semibold text-foreground">Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="Enter password" className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                  </div>
                  {/* Select Group & Expire Date side-by-side */}
                  <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                    <Label htmlFor="group" className="text-[13px] font-semibold text-foreground">Group <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select value={formData.groupId} onValueChange={(val) => setFormData({...formData, groupId: val})} required>
                        <SelectTrigger className="w-full pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background">
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.filter(g => !g.tenantId || g.tenantId === formData.tenantId).map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                    <Label htmlFor="expiration" className="text-[13px] font-semibold text-foreground">Expiration Date</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input 
                        id="expiration" 
                        type={formData.expiration ? "datetime-local" : "text"} 
                        placeholder="No Expire" 
                        value={formData.expiration} 
                        onFocus={(e) => (e.target.type = "datetime-local")}
                        onBlur={(e) => {
                          if (!e.target.value) e.target.type = "text";
                        }}
                        onChange={e => setFormData({...formData, expiration: e.target.value})} 
                        className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background w-full" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={onClose}>
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
  )
}
