import { Loader2, Tag, Network, Type, Key, Building } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateEditNasDialogProps {
  isOpen: boolean
  onClose: () => void
  user: any
  isImpersonating: boolean
  tenants: {id: string, name: string}[]
  editingId: number | null
  formData: any
  setFormData: (val: any) => void
  saving: boolean
  handleCreateNas: (e: React.FormEvent, formData: any, editingId: number | null) => void
}

export function CreateEditNasDialog({
  isOpen,
  onClose,
  user,
  isImpersonating,
  tenants,
  editingId,
  formData,
  setFormData,
  saving,
  handleCreateNas
}: CreateEditNasDialogProps) {
  const { t } = useTranslation()
  const dialogContentClass = "sm:max-w-[620px] md:max-w-[680px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]"
  const dialogHeaderClass = "px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background"
  const dialogFooterClass = "px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
            {editingId ? "Edit Router" : t('nas.addNas')}
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
            {editingId ? "Update the connection details for this router." : "Enter the connection details for the new router."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => handleCreateNas(e, formData, editingId)} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-4 px-5 sm:px-7 py-4 flex-1 overflow-y-auto">
            {(user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && (
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
                    {t('nas.colName')}
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
                    {t('nas.colIp')}
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
                  {t('nas.colType')}
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
                  {t('nas.colSecret')}
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
          <DialogFooter className={dialogFooterClass}>
            <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
