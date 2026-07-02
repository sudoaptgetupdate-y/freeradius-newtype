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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Group } from "../../hooks/useGroupsData"

interface TransferUsersDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedGroup: Group | null
  groups: Group[]
  targetGroupId: string
  setTargetGroupId: (val: string) => void
  saving: boolean
  handleTransfer: () => void
}

export function TransferUsersDialog({
  isOpen,
  onClose,
  selectedGroup,
  groups,
  targetGroupId,
  setTargetGroupId,
  saving,
  handleTransfer
}: TransferUsersDialogProps) {
  const dialogContentClass = "bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 p-0 sm:max-w-[500px]"
  const dialogHeaderClass = "border-b border-border px-5 sm:px-8 py-5 sm:py-7 space-y-1.5"
  const dialogBodyClass = "px-5 sm:px-8 py-6"
  const dialogFooterClass = "px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-foreground">Transfer Users</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Move all users from <strong>{selectedGroup?.name}</strong> to another group.
          </DialogDescription>
        </DialogHeader>
        <div className={dialogBodyClass + " space-y-4"}>
          <p className="text-sm">
            Users will be moved to the selected group and will inherit its Default Profile. Active sessions will be disconnected to apply the new profile.
          </p>
          <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
            <Label>Target Group</Label>
            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Destination Group" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter(g => g.id !== selectedGroup?.id)
                  .map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleTransfer} disabled={saving || !targetGroupId}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transfer Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
