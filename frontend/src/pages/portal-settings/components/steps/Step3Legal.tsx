import { Check, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import type { PortalSettingsData } from "../../hooks/usePortalSettings"

interface Step3LegalProps {
  settings: PortalSettingsData
  setSettings: React.Dispatch<React.SetStateAction<PortalSettingsData>>
  selectedTenantId: string
  copied: boolean
  handleCopyLink: () => void
}

export function Step3Legal({
  settings,
  setSettings,
  selectedTenantId,
  copied,
  handleCopyLink
}: Step3LegalProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Step 3: Portal Settings & Legal</CardTitle>
        <CardDescription>Setup network registration links, active logins, and terms of service.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <Label>User Self-Registration Link</Label>
          <div className="flex gap-2 items-center">
            <Input
              readOnly
              value={`${window.location.origin}/register/${selectedTenantId}`}
              className="bg-background select-all font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0 h-10 w-10">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Distribute this URL to allow users to self-register accounts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Self-Registration Form</Label>
              <p className="text-xs text-muted-foreground">Allow users to register accounts.</p>
            </div>
            <Switch
              checked={settings.isRegisterEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, isRegisterEnabled: checked })}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label htmlFor="termsOfService">Terms of Service</Label>
          <Textarea
            id="termsOfService"
            value={settings.termsOfService}
            onChange={(e) => setSettings({ ...settings, termsOfService: e.target.value })}
            placeholder="Enter terms of service details..."
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="footerNote">Footer Note / IT Support Contacts</Label>
          <Input
            id="footerNote"
            value={settings.footerNote}
            onChange={(e) => setSettings({ ...settings, footerNote: e.target.value })}
            placeholder="e.g. Support Hotline: 075 343 212"
          />
        </div>

      </CardContent>
    </Card>
  )
}
