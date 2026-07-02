import { Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { settingsSchema } from "../../hooks/useSettings"

interface GeneralModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  form: UseFormReturn<z.infer<typeof settingsSchema>>
  onSubmit: (data: any) => Promise<void>
  onInvalid: (errors: any) => void
  saving: boolean
}

export function GeneralModal({ isOpen, setIsOpen, form, onSubmit, onInvalid, saving }: GeneralModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-background border-none shadow-2xl sm:max-w-[500px] p-0 [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
        <DialogHeader className="bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7">
          <DialogTitle className="text-xl text-foreground font-bold flex items-center">
            <Settings className="mr-3 h-5 w-5 text-muted-foreground" /> 
            General Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Update the settings below and click save.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 sm:px-8 py-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>System Timezone</Label>
              <Input {...form.register("timezone")} placeholder="Asia/Bangkok" className="h-[44px] rounded-[8px]" />
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-[44px] rounded-[8px]">
            Cancel
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit, onInvalid)} disabled={saving} className="bg-primary shadow-md shadow-primary/20 font-semibold h-[44px] rounded-[8px]">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
