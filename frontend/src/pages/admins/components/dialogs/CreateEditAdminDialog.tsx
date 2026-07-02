import { Loader2, Mail, ShieldAlert, Building } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import type { AdminFormData } from "../../hooks/useAdminMutations"
import type { TenantData } from "../../hooks/useAdminsData"

interface CreateEditAdminDialogProps {
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  isLoading: boolean
  editingId: string | null
  formData: AdminFormData
  setFormData: React.Dispatch<React.SetStateAction<AdminFormData>>
  handleCreateAdmin: (e: React.FormEvent) => void
  tenants: TenantData[]
}

export function CreateEditAdminDialog({
  isDialogOpen,
  setIsDialogOpen,
  isLoading,
  editingId,
  formData,
  setFormData,
  handleCreateAdmin,
  tenants
}: CreateEditAdminDialogProps) {
  const { t } = useTranslation()
  const { user, isImpersonating } = useAuth()

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
        <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
          <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
            {editingId ? "Edit System User" : t('admins.addAdmin')}
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
            {editingId ? "Update user account information and roles." : "Create a new user account for the system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateAdmin} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-4 px-5 sm:px-7 py-4 flex-1 overflow-y-auto">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-[14px] font-semibold text-foreground">First Name</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName} 
                  onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  placeholder="John" 
                  required 
                  className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-[14px] font-semibold text-foreground">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={formData.lastName} 
                  onChange={e => setFormData({...formData, lastName: e.target.value})} 
                  placeholder="Doe" 
                  required 
                  className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Password {editingId && <span className="text-muted-foreground font-normal text-xs">(Keep current)</span>}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="phone" className="text-[14px] font-semibold text-foreground">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+1234567890" 
                  className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-[14px] font-semibold text-foreground">User Role</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                  <SelectTrigger id="role" className="w-full h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {user?.role === "super_admin" && !isImpersonating && (
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
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-[14px] font-semibold text-foreground">Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger id="status" className="w-full h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {user?.role === "super_admin" && !isImpersonating && (formData.role === "tenant_admin" || formData.role === "tenant_staff") && (
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
  )
}
