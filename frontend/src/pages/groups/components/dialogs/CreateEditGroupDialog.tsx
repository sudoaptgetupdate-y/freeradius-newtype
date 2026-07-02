import { Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Profile } from "../../hooks/useGroupsData"

interface CreateEditGroupDialogProps {
  isOpen: boolean
  isEditOpen: boolean
  onClose: () => void
  user: any
  isImpersonating: boolean
  tenants: {id: string, name: string}[]
  profiles: Profile[]
  formData: any
  setFormData: (val: any) => void
  saving: boolean
  handleSave: (isEdit: boolean) => void
}

export function CreateEditGroupDialog({
  isOpen,
  isEditOpen,
  onClose,
  user,
  isImpersonating,
  tenants,
  profiles,
  formData,
  setFormData,
  saving,
  handleSave
}: CreateEditGroupDialogProps) {
  const dialogContentClass = "bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 p-0 sm:max-w-[500px]"
  const dialogHeaderClass = "border-b border-border px-5 sm:px-8 py-5 sm:py-7 space-y-1.5"
  const dialogBodyClass = "px-5 sm:px-8 py-6"
  const dialogFooterClass = "px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto"

  return (
    <Dialog open={isOpen || isEditOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-foreground">{isEditOpen ? "Edit Group" : "Create Group"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditOpen ? "Update group details and default profile." : "Add a new user group."}
          </DialogDescription>
        </DialogHeader>
        
        <div className={dialogBodyClass + " space-y-4"}>
          {(user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && (
            <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50 mb-2">
              <Label>Tenant <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.tenantId} 
                onValueChange={(val) => setFormData({...formData, tenantId: val})}
                disabled={isEditOpen}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Groups are bound to a specific tenant.</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Group Name <span className="text-red-500">*</span></Label>
            <Input 
              placeholder="e.g. Grade 10" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
            <Label>Default Profile (Package)</Label>
            <Select value={formData.defaultProfile} onValueChange={(val) => setFormData({...formData, defaultProfile: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select Profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Default Profile</SelectItem>
                {profiles.map((p, index) => (
                  <SelectItem key={`${p.name}-${index}`} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Users added to this group will inherit this profile.</p>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="Optional description" 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>

        <DialogFooter className={dialogFooterClass}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => handleSave(isEditOpen)} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
