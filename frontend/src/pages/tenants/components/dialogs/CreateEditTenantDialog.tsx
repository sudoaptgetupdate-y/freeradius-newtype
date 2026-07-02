import { Building2, Loader2, Mail, Key, Users, Power, Server, MessageSquare } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateEditTenantDialogProps {
  isOpen: boolean
  onClose: () => void
  editingTenantId: string | null
  formData: any
  setFormData: (val: any) => void
  profiles: any[]
  isLoading: boolean
  originalDeviceType: string | undefined
  handleCreateTenant: (e: React.FormEvent, formData: any, editingTenantId: string | null, originalDeviceType: string | undefined) => void
}

export function CreateEditTenantDialog({
  isOpen,
  onClose,
  editingTenantId,
  formData,
  setFormData,
  profiles,
  isLoading,
  originalDeviceType,
  handleCreateTenant
}: CreateEditTenantDialogProps) {
  const { t } = useTranslation()

  const dialogContentClass = "sm:max-w-[650px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]"
  const dialogHeaderClass = "px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background"
  const dialogFooterClass = "px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
            {editingTenantId ? "Edit Tenant" : t('tenants.addTenant')}
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
            {editingTenantId ? "Update tenant site limits and status." : "Create a new tenant site and set their limits. An admin account will be generated."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => handleCreateTenant(e, formData, editingTenantId, originalDeviceType)} className="flex flex-col flex-1 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 sm:px-8 py-6 flex-1 overflow-y-auto">
            
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name" className="text-[14px] font-semibold text-foreground">{t('tenants.colName')}</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Branch A Hotel" 
                  required 
                  className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxUsers" className="text-[14px] font-semibold text-foreground">
                Max Users
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="maxUsers" 
                  type="number"
                  min="1"
                  value={formData.maxUsers} 
                  onChange={e => setFormData({...formData, maxUsers: parseInt(e.target.value) || 100})} 
                  required 
                  className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxNas" className="text-[14px] font-semibold text-foreground">
                Max NAS
              </Label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="maxNas" 
                  type="number"
                  min="1"
                  value={formData.maxNas} 
                  onChange={e => setFormData({...formData, maxNas: parseInt(e.target.value) || 1})} 
                  required 
                  className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[14px] font-semibold text-foreground">
                Primary Device Type
              </Label>
              <Select value={formData.primaryDeviceType} onValueChange={(val: any) => setFormData({...formData, primaryDeviceType: val})}>
                <SelectTrigger className="w-full h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                  <SelectValue placeholder="Select Device Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mikrotik">MikroTik</SelectItem>
                  <SelectItem value="fortigate">FortiGate</SelectItem>
                  <SelectItem value="standard">Standard VLAN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingTenantId && (
              <div className="space-y-1.5">
                <Label className="text-[14px] font-semibold text-foreground">
                  Default Register Profile
                </Label>
                <Select value={formData.defaultRegisterProfile} onValueChange={(val) => setFormData({...formData, defaultRegisterProfile: val})}>
                  <SelectTrigger className="w-full h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                    <SelectValue placeholder="Select Profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Select Profile --</SelectItem>
                    {profiles.filter(p => p.tenantId === editingTenantId).map((p: any, index: number) => (
                      <SelectItem key={`${p.name}-${index}`} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editingTenantId && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="status" className="text-[14px] font-semibold text-foreground">
                  Status
                </Label>
                <div className="relative">
                  <Power className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                    <SelectTrigger id="status" className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="space-y-4 pt-4 border-t border-border mt-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[14px] font-semibold text-foreground">Telegram Notifications</Label>
                  <p className="text-[12px] text-muted-foreground">Enable bot commands and alerts for this tenant.</p>
                </div>
                <Switch 
                  checked={formData.telegramEnabled} 
                  onCheckedChange={c => setFormData({...formData, telegramEnabled: c})} 
                />
              </div>
              {formData.telegramEnabled && (
                <div className="space-y-1.5 mt-2">
                  <Label htmlFor="telegramChatId" className="text-[14px] font-semibold text-foreground">
                    Telegram Group Chat ID
                  </Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="telegramChatId" 
                      value={formData.telegramChatId} 
                      onChange={e => setFormData({...formData, telegramChatId: e.target.value})} 
                      placeholder="-100123456789" 
                      className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                    />
                  </div>
                </div>
              )}
            </div>

            {!editingTenantId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border mt-2 sm:col-span-2">
                <div className="space-y-1.5">
                  <Label htmlFor="adminEmail" className="text-[14px] font-semibold text-foreground">
                    Admin Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="adminEmail" 
                      type="email"
                      value={formData.adminEmail} 
                      onChange={e => setFormData({...formData, adminEmail: e.target.value})} 
                      placeholder="admin@tenant.com" 
                      required 
                      className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adminPassword" className="text-[14px] font-semibold text-foreground">
                    Temporary Password
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="adminPassword" 
                      type="text"
                      value={formData.adminPassword} 
                      onChange={e => setFormData({...formData, adminPassword: e.target.value})} 
                      placeholder="password123" 
                      required 
                      className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className={dialogFooterClass}>
            <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTenantId ? "Update Tenant" : "Save Tenant & Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
