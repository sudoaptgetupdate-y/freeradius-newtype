import { Server } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { settingsSchema } from "../../hooks/useSettings"

interface LogsModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  form: UseFormReturn<z.infer<typeof settingsSchema>>
  onSubmit: (data: any) => Promise<void>
  onInvalid: (errors: any) => void
  saving: boolean
}

export function LogsModal({ isOpen, setIsOpen, form, onSubmit, onInvalid, saving }: LogsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-background border-none shadow-2xl sm:max-w-[500px] p-0 [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
        <DialogHeader className="bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7">
          <DialogTitle className="text-xl text-foreground font-bold flex items-center">
            <Server className="mr-3 h-5 w-5 text-orange-500" /> 
            Logging Infrastructure
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Update the settings below and click save.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 sm:px-8 py-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-5">
            <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
              <Label className="font-semibold">Grafana Loki HTTP URL</Label>
              <Input {...form.register("lokiUrl")} placeholder="http://localhost:3100" className="h-[44px] rounded-[8px]" />
              <p className="text-xs text-muted-foreground mt-1">REST endpoint used for querying audit logs.</p>
            </div>
            <div className="space-y-2">
              <Label>Vector Receiver Port</Label>
              <Input type="number" {...form.register("vectorPort")} placeholder="514" className="h-[44px] rounded-[8px] w-1/2" />
              <p className="text-xs text-muted-foreground mt-1">UDP port mapped for RouterOS Syslog traffic.</p>
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
