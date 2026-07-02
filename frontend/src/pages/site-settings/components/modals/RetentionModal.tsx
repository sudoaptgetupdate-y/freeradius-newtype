import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useSiteSettings, type SiteSettingsData } from "../../hooks/useSiteSettings"

interface RetentionModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  draftSettings: SiteSettingsData
  setDraftSettings: React.Dispatch<React.SetStateAction<SiteSettingsData>>
  saving: boolean
  handleSaveModal: (modalType: 'telegram' | 'social' | 'retention') => void
}

export function RetentionModal({
  isOpen,
  setIsOpen,
  draftSettings,
  setDraftSettings,
  saving,
  handleSaveModal
}: RetentionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 sm:max-w-[500px]">
        <DialogHeader className="bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Data Retention Settings
          </DialogTitle>
          <DialogDescription>
            Configure how long soft-deleted users are kept in the trash bin before being permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 sm:px-8 py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="trashRetentionDays">Trash Retention Days</Label>
            <Input 
              id="trashRetentionDays"
              type="number" 
              min={1} 
              max={365}
              value={draftSettings.trashRetentionDays} 
              onChange={(e) => setDraftSettings({...draftSettings, trashRetentionDays: parseInt(e.target.value) || 30})}
            />
            <p className="text-xs text-muted-foreground">Number of days (1-365) users stay in Trash before auto-cleanup.</p>
          </div>
        </div>
        <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={() => handleSaveModal('retention')} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
