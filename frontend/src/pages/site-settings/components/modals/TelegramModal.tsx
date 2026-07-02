import { Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useSiteSettings, type SiteSettingsData } from "../../hooks/useSiteSettings"

interface TelegramModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  draftSettings: SiteSettingsData
  setDraftSettings: React.Dispatch<React.SetStateAction<SiteSettingsData>>
  testingTelegram: boolean
  handleTestTelegram: () => void
  saving: boolean
  handleSaveModal: (modalType: 'telegram' | 'social' | 'retention') => void
}

export function TelegramModal({
  isOpen,
  setIsOpen,
  draftSettings,
  setDraftSettings,
  testingTelegram,
  handleTestTelegram,
  saving,
  handleSaveModal
}: TelegramModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 sm:max-w-[500px]">
        <DialogHeader className="bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7">
          <DialogTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Telegram Alerts
          </DialogTitle>
          <DialogDescription>
            Configure the bot to send alerts to your specific group.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 sm:px-8 py-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Alerts</Label>
              <p className="text-sm text-muted-foreground">Turn on to activate integration.</p>
            </div>
            <Switch 
              checked={draftSettings.telegramEnabled}
              onCheckedChange={c => setDraftSettings({...draftSettings, telegramEnabled: c})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegramChatId">Group Chat ID</Label>
            <div className="flex gap-2">
              <Input 
                id="telegramChatId" 
                value={draftSettings.telegramChatId} 
                onChange={(e) => setDraftSettings({...draftSettings, telegramChatId: e.target.value})}
                placeholder="e.g. -100123456789"
                disabled={!draftSettings.telegramEnabled}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestTelegram} 
                disabled={testingTelegram || !draftSettings.telegramEnabled || !draftSettings.telegramChatId}
              >
                {testingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Add the bot to your group and enter the chat ID here.</p>
          </div>
        </div>
        <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={() => handleSaveModal('telegram')} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
