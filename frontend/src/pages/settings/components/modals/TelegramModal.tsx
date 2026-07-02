import { MessageSquare, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { settingsSchema } from "../../hooks/useSettings"

interface TelegramModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  form: UseFormReturn<z.infer<typeof settingsSchema>>
  onSubmit: (data: any) => Promise<void>
  onInvalid: (errors: any) => void
  saving: boolean
  handleSyncWebhook: () => Promise<void>
}

export function TelegramModal({ isOpen, setIsOpen, form, onSubmit, onInvalid, saving, handleSyncWebhook }: TelegramModalProps) {
  const telegramEnabled = form.watch("telegramEnabled")

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-background border-none shadow-2xl sm:max-w-[500px] p-0 [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
        <DialogHeader className="bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7">
          <DialogTitle className="text-xl text-foreground font-bold flex items-center">
            <MessageSquare className="mr-3 h-5 w-5 text-blue-500" /> 
            Telegram Integration
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Update the settings below and click save.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 sm:px-8 py-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-border/50 mb-2">
              <div>
                <Label className="text-base font-semibold">Enable Telegram Bot</Label>
                <p className="text-xs text-muted-foreground mt-1">Turn on bot functions globally</p>
              </div>
              <Switch checked={!!telegramEnabled} onCheckedChange={(c) => form.setValue("telegramEnabled", c)} />
            </div>
            
            <div className={`space-y-5 transition-opacity ${!telegramEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                <Label>HTTP API Token</Label>
                <Input {...form.register("telegramToken")} placeholder="123456789:ABCDEF..." className="font-mono h-[44px] rounded-[8px]" />
              </div>
              <div className="space-y-2">
                <Label>Bot Username</Label>
                <Input {...form.register("telegramBotId")} placeholder="@SysAdminBot" className="h-[44px] rounded-[8px]" />
              </div>
              <div className="space-y-2">
                <Label>Master Chat ID</Label>
                <Input {...form.register("telegramChatId")} placeholder="-100123456789" className="h-[44px] rounded-[8px]" />
                <p className="text-xs text-muted-foreground">For server alerts and administrative notifications.</p>
              </div>
              <div className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSyncWebhook}
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Sync Webhook URL with Telegram
                </Button>
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
