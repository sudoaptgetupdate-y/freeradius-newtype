import { RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { PortalSettingsData } from "../../hooks/usePortalSettings"

interface Step2ThemeColorsProps {
  settings: PortalSettingsData
  setSettings: React.Dispatch<React.SetStateAction<PortalSettingsData>>
  handleResetDefaults: () => void
}

export function Step2ThemeColors({ settings, setSettings, handleResetDefaults }: Step2ThemeColorsProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Step 2: Theme Colors</CardTitle>
        <CardDescription>Customize the dynamic branding colors for your login and register panels.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="themeColor">Main Theme Color (Form Inputs & Buttons)</Label>
          <div className="flex gap-3">
            <Input
              id="themeColor"
              value={settings.themeColor}
              onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
              className="w-36 uppercase font-mono"
            />
            <input
              type="color"
              value={settings.themeColor}
              onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
              className="h-10 w-10 p-1 rounded cursor-pointer bg-background border border-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/50">
          <div className="space-y-2">
            <Label htmlFor="leftBgColor">Left Background</Label>
            <div className="flex gap-2">
              <Input
                id="leftBgColor"
                value={settings.leftBgColor}
                onChange={(e) => setSettings({ ...settings, leftBgColor: e.target.value })}
                className="uppercase font-mono"
              />
              <input
                type="color"
                value={settings.leftBgColor}
                onChange={(e) => setSettings({ ...settings, leftBgColor: e.target.value })}
                className="h-10 w-10 p-1 rounded cursor-pointer bg-background border border-input shrink-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leftTextColor">Left Text</Label>
            <div className="flex gap-2">
              <Input
                id="leftTextColor"
                value={settings.leftTextColor}
                onChange={(e) => setSettings({ ...settings, leftTextColor: e.target.value })}
                className="uppercase font-mono"
              />
              <input
                type="color"
                value={settings.leftTextColor}
                onChange={(e) => setSettings({ ...settings, leftTextColor: e.target.value })}
                className="h-10 w-10 p-1 rounded cursor-pointer bg-background border border-input shrink-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leftAccentColor">Left Accent</Label>
            <div className="flex gap-2">
              <Input
                id="leftAccentColor"
                value={settings.leftAccentColor}
                onChange={(e) => setSettings({ ...settings, leftAccentColor: e.target.value })}
                className="uppercase font-mono"
              />
              <input
                type="color"
                value={settings.leftAccentColor}
                onChange={(e) => setSettings({ ...settings, leftAccentColor: e.target.value })}
                className="h-10 w-10 p-1 rounded cursor-pointer bg-background border border-input shrink-0"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleResetDefaults} className="text-xs flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Security Shield defaults
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
