import { Loader2, Building, Tag, Hash } from "lucide-react"
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
import type { Profile } from "@/types/voucher"

interface GenerateVoucherDialogProps {
  isOpen: boolean
  onClose: () => void
  user: any
  isImpersonating?: boolean
  tenants: {id: string, name: string}[]
  availableProfiles: Profile[]
  formData: any
  setFormData: (data: any) => void
  isGenerating: boolean
  progress: number
  handleGenerate: (e: React.FormEvent) => void
}

export function GenerateVoucherDialog({
  isOpen,
  onClose,
  user,
  isImpersonating,
  tenants,
  availableProfiles,
  formData,
  setFormData,
  isGenerating,
  progress,
  handleGenerate
}: GenerateVoucherDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isGenerating && !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
          <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
            Generate Vouchers
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
            Create a batch of random codes for users to access the internet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleGenerate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-5 sm:px-8 py-6 flex-1 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
            
            {/* Highlighted Tenant Dropdown */}
            {(user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && (
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                <Label htmlFor="tenant" className="text-[14px] font-semibold text-foreground">Select Tenant</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val})} disabled={isGenerating}>
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
              <Label htmlFor="type" className="text-[14px] font-semibold text-foreground">Voucher Format</Label>
              <div className="relative">
                <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})} disabled={isGenerating}>
                  <SelectTrigger id="type" className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">Code Only (PIN)</SelectItem>
                    <SelectItem value="user_pass">Username & Password</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Length Controls */}
            {formData.type === "code" ? (
              <div className="space-y-1.5">
                <Label htmlFor="codeLength" className="text-[14px] font-semibold text-foreground">Code Length</Label>
                <Select value={formData.codeLength} onValueChange={(val) => setFormData({...formData, codeLength: val})} disabled={isGenerating}>
                  <SelectTrigger id="codeLength" className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((len) => (
                      <SelectItem key={len} value={len.toString()}>{len} Characters</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="usernameLength" className="text-[14px] font-semibold text-foreground">Username Length</Label>
                  <Select value={formData.codeLength} onValueChange={(val) => setFormData({...formData, codeLength: val})} disabled={isGenerating}>
                    <SelectTrigger id="usernameLength" className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((len) => (
                        <SelectItem key={len} value={len.toString()}>{len} Chars</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="passwordLength" className="text-[14px] font-semibold text-foreground">Password Length</Label>
                  <Select value={formData.passwordLength} onValueChange={(val) => setFormData({...formData, passwordLength: val})} disabled={isGenerating}>
                    <SelectTrigger id="passwordLength" className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((len) => (
                        <SelectItem key={len} value={len.toString()}>{len} Chars</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="profile" className="text-[14px] font-semibold text-foreground">Internet Package (Profile)</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={formData.groupname} onValueChange={(val) => setFormData({...formData, groupname: val})} disabled={isGenerating}>
                  <SelectTrigger id="profile" className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                    <SelectValue placeholder="Select a package for these vouchers" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfiles.map((p, index) => (
                      <SelectItem key={`${p.name}-${index}`} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-[14px] font-semibold text-foreground">Amount</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="amount" 
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                    required 
                    disabled={isGenerating}
                    className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prefix" className="text-[14px] font-semibold text-foreground">Prefix (Optional)</Label>
                <div className="relative">
                  <Input 
                    id="prefix" 
                    value={formData.prefix} 
                    onChange={e => setFormData({...formData, prefix: e.target.value})} 
                    placeholder="e.g. VIP-" 
                    maxLength={10}
                    disabled={isGenerating}
                    className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                  />
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/20 text-center">
                <p className="text-sm font-medium mb-2">Generating Vouchers... {progress}%</p>
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

          </div>
          
          <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
