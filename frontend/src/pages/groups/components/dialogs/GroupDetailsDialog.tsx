import { format } from "date-fns"
import { Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Group } from "../../hooks/useGroupsData"

interface GroupDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedGroup: Group | null
}

export function GroupDetailsDialog({
  isOpen,
  onClose,
  selectedGroup
}: GroupDetailsDialogProps) {
  const dialogContentClass = "bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 p-0 sm:max-w-[700px]"
  const dialogHeaderClass = "border-b border-border px-5 sm:px-8 py-5 sm:py-7 space-y-1.5"
  const dialogBodyClass = "px-5 sm:px-8 py-6"
  const dialogFooterClass = "px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-foreground">Group Details: {selectedGroup?.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Overview and members of this group.
          </DialogDescription>
        </DialogHeader>
        <div className={dialogBodyClass}>
          <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-muted-foreground mb-1">Group Name</span>
                <span className="font-medium text-foreground">{selectedGroup?.name}</span>
              </div>
              <div>
                <span className="block text-muted-foreground mb-1">Inherited Profile</span>
                {selectedGroup?.defaultProfile ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {selectedGroup.defaultProfile}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">None</span>
                )}
              </div>
              <div>
                <span className="block text-muted-foreground mb-1">Total Members</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>{selectedGroup?.userCount} Users</span>
                </div>
              </div>
              <div>
                <span className="block text-muted-foreground mb-1">Created At</span>
                <span className="font-medium">{selectedGroup?.createdAt ? format(new Date(selectedGroup.createdAt), "PPp") : "-"}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-6">
            <span className="block text-sm text-muted-foreground">Description</span>
            <p className="text-sm text-foreground bg-muted/10 p-3 rounded-lg border border-border/50 min-h-[60px]">
              {selectedGroup?.description || <span className="italic text-muted-foreground">No description provided.</span>}
            </p>
          </div>
        </div>
        <DialogFooter className={`${dialogFooterClass} pt-0 border-none`}>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
