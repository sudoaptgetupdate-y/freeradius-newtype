import { Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { settingsSchema } from "../../hooks/useSettings"

interface SocialLoginModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  form: UseFormReturn<z.infer<typeof settingsSchema>>
  onSubmit: (data: any) => Promise<void>
  onInvalid: (errors: any) => void
  saving: boolean
}

export function SocialLoginModal({ isOpen, setIsOpen, form, onSubmit, onInvalid, saving }: SocialLoginModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-background border-none shadow-2xl sm:max-w-[500px] p-0 [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
        <DialogHeader className="bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7">
          <DialogTitle className="text-xl text-foreground font-bold flex items-center">
            <Settings className="mr-3 h-5 w-5 text-pink-500" /> 
            Social Login Config
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Update the settings below and click save.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 sm:px-8 py-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-5">
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50">
              <h4 className="font-semibold text-[#4285F4] flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.55-5.17 3.55-8.65z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.25 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.3c-.25-.72-.38-1.5-.38-2.3s.13-1.58.38-2.3v-3.1H1.27A11.93 11.93 0 0 0 0 12c0 1.93.46 3.76 1.27 5.4l4-3.1z"/><path fill="#EA4335" d="M12 4.74c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.18 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4 3.1C6.22 6.85 8.87 4.74 12 4.74z"/></svg>
                Google OAuth
              </h4>
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input {...form.register("googleClientId")} placeholder="Enter Google Client ID" className="h-[44px] rounded-[8px]" />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input type="password" {...form.register("googleClientSecret")} placeholder="Enter Google Client Secret" className="h-[44px] rounded-[8px]" />
              </div>
            </div>

            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50">
              <h4 className="font-semibold text-[#06C755] flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#06C755" d="M12 0C5.37 0 0 4.48 0 10c0 4.94 4.29 9.07 10.08 9.86.39.08.92.26 1.06.6.12.31.08.79.04 1.1l-.17 1.05c-.05.31-.24 1.2 1.05.65 1.29-.54 6.96-4.1 9.5-7.03C23.16 14.07 24 12.13 24 10c0-5.52-5.37-10-12-10z"/></svg>
                LINE Login
              </h4>
              <div className="space-y-2">
                <Label>Channel ID</Label>
                <Input {...form.register("lineChannelId")} placeholder="Enter LINE Channel ID" className="h-[44px] rounded-[8px]" />
              </div>
              <div className="space-y-2">
                <Label>Channel Secret</Label>
                <Input type="password" {...form.register("lineChannelSecret")} placeholder="Enter LINE Channel Secret" className="h-[44px] rounded-[8px]" />
              </div>
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
