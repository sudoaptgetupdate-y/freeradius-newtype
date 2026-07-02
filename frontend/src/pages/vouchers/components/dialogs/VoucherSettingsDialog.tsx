import { Loader2, Building, Image } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { VoucherSettings } from "@/types/voucher"

interface VoucherSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  user: any
  isImpersonating?: boolean
  tenants: {id: string, name: string}[]
  formData: any
  setFormData: (data: any) => void
  settings: VoucherSettings
  setSettings: (settings: VoucherSettings) => void
  isSavingSettings: boolean
  handleSaveSettings: (e: React.FormEvent) => void
}

export function VoucherSettingsDialog({
  isOpen,
  onClose,
  user,
  isImpersonating,
  tenants,
  formData,
  setFormData,
  settings,
  setSettings,
  isSavingSettings,
  handleSaveSettings
}: VoucherSettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
        <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
          <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
            Template Settings
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
            Customize voucher print template and defaults.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveSettings} className="flex flex-col h-full pt-4">
          <div className="px-5 sm:px-7 pb-4 space-y-4 flex-1 overflow-y-auto">
            
            {/* Highlighted Tenant Dropdown */}
            {(user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && (
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                <Label htmlFor="settings-tenant" className="text-[14px] font-semibold text-foreground">Select Tenant</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val})} disabled={isSavingSettings}>
                    <SelectTrigger id="settings-tenant" className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
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
              <Label htmlFor="defaultPrefix" className="text-[14px] font-semibold text-foreground">Default Prefix</Label>
              <Input 
                id="defaultPrefix" 
                value={settings.defaultPrefix || ""} 
                onChange={e => setSettings({...settings, defaultPrefix: e.target.value})} 
                placeholder="e.g. mkt_" 
                maxLength={10}
                className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logoUrl" className="text-[14px] font-semibold text-foreground">
                Logo URL (Optional)
                <span className="text-[11px] font-normal text-muted-foreground ml-2">(Must be a direct image link like .png or .jpg)</span>
              </Label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="logoUrl" 
                  value={settings.logoUrl || ""} 
                  onChange={e => setSettings({...settings, logoUrl: e.target.value})} 
                  placeholder="https://example.com/logo.png" 
                  className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="headerText" className="text-[14px] font-semibold text-foreground">Header Text</Label>
              <Input 
                id="headerText" 
                value={settings.headerText || ""} 
                onChange={e => setSettings({...settings, headerText: e.target.value})} 
                placeholder="WIFI INTERNET VOUCHER" 
                maxLength={100}
                className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ssidName" className="text-[14px] font-semibold text-foreground">SSID Name (Optional)</Label>
              <Input 
                id="ssidName" 
                value={settings.ssidName || ""} 
                onChange={e => setSettings({...settings, ssidName: e.target.value})} 
                placeholder="e.g. MyWiFi_Guest" 
                maxLength={100}
                className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="footerText" className="text-[14px] font-semibold text-foreground">Footer Text (Optional)</Label>
              <Input 
                id="footerText" 
                value={settings.footerText || ""} 
                onChange={e => setSettings({...settings, footerText: e.target.value})} 
                placeholder="e.g. For support, call 1234" 
                maxLength={255}
                className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
              />
            </div>
          </div>
          <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingSettings} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
              {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
