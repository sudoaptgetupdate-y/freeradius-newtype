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
import type { Group } from "../../hooks/useGroupsData"

const dialogContentClass = "bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 p-0 sm:max-w-[500px]"
const dialogHeaderClass = "border-b border-border px-5 sm:px-8 py-5 sm:py-7 space-y-1.5"
const dialogBodyClass = "px-5 sm:px-8 py-6"
const dialogFooterClass = "px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto"

interface BaseDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedGroup: Group | null
  saving: boolean
}

export function DeleteGroupDialog({ isOpen, onClose, selectedGroup, saving, handleDelete }: BaseDialogProps & { handleDelete: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-foreground">Delete Group</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to delete the group <strong>{selectedGroup?.name}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className={dialogBodyClass}>
          <p className="text-sm">This action cannot be undone. Only groups with 0 users can be deleted.</p>
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function BulkSuspendDialog({ isOpen, onClose, selectedGroup, saving, handleAction }: BaseDialogProps & { handleAction: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-foreground">Suspend All Users</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Suspend all <strong>{selectedGroup?.userCount}</strong> users in <strong>{selectedGroup?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className={dialogBodyClass}>
          <p className="text-sm">
            This will block authentication for all users in this group immediately and disconnect active sessions.
          </p>
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleAction} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Suspend Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function BulkEnableDialog({ isOpen, onClose, selectedGroup, saving, handleAction }: BaseDialogProps & { handleAction: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-foreground">Reactivate All Users</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Reactivate all suspended users in <strong>{selectedGroup?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className={dialogBodyClass}>
          <p className="text-sm">
            This will remove the suspended restriction for all users in this group, allowing them to authenticate again.
          </p>
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleAction} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reactivate Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function BulkDeleteDialog({ isOpen, onClose, selectedGroup, saving, handleAction }: BaseDialogProps & { handleAction: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className="text-foreground">Delete All Users</DialogTitle>
          <DialogDescription className="text-red-500 font-medium">
            CRITICAL WARNING: Bulk Deletion
          </DialogDescription>
        </DialogHeader>
        <div className={dialogBodyClass}>
          <p className="text-sm">
            You are about to delete <strong>{selectedGroup?.userCount}</strong> users from <strong>{selectedGroup?.name}</strong>.
            They will be disconnected immediately and permanently lose access.
          </p>
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleAction} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete All Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
