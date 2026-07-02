import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PortalSettingsData } from "../../hooks/usePortalSettings"

interface Step1BrandingProps {
  settings: PortalSettingsData
  setSettings: React.Dispatch<React.SetStateAction<PortalSettingsData>>
}

export function Step1Branding({ settings, setSettings }: Step1BrandingProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Step 1: Branding & Identity</CardTitle>
        <CardDescription>Setup your organization names, logos, and portal headers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name</Label>
          <Textarea
            id="orgName"
            value={settings.orgName}
            onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
            placeholder="e.g. Acme Corp&#10;Wi-Fi"
            className="min-h-[70px]"
          />
          <p className="text-xs text-muted-foreground">Supports multi-line inputs. Press Enter to wrap lines on desktop and mobile.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            value={settings.logoUrl}
            onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
          {settings.logoUrl && (
            <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 inline-block w-full text-center">
              <img 
                src={settings.logoUrl} 
                alt="Logo Preview" 
                className="h-12 object-contain mx-auto" 
                onError={(e: any) => (e.currentTarget.style.display = 'none')} 
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Welcome Message / Description</Label>
          <Textarea
            id="welcomeMessage"
            value={settings.welcomeMessage}
            onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
            placeholder="e.g. เชื่อมต่อเครือข่าย WiFi องค์กรอย่างปลอดภัย..."
            className="min-h-[90px]"
          />
        </div>
      </CardContent>
    </Card>
  )
}
