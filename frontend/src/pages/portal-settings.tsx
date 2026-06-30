import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "react-toastify"
import { Loader2, Save, Copy, Check } from "lucide-react"
import api from "@/lib/api"

export default function PortalSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const registerUrl = `${window.location.origin}/register/${user?.tenantId}`
    navigator.clipboard.writeText(registerUrl)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const [settings, setSettings] = useState({
    orgName: "",
    logoUrl: "",
    termsOfService: "",
    footerNote: "",
    isRegisterEnabled: true,
    isSocialLoginEnabled: true,
    themeColor: "#3b82f6",
  })

  useEffect(() => {
    fetchSettings()
  }, [user?.tenantId])

  const fetchSettings = async () => {
    if (!user?.tenantId) return
    try {
      const { data } = await api.get(`/portal/settings/${user.tenantId}`)
      setSettings({
        orgName: data.orgName || "",
        logoUrl: data.logoUrl || "",
        termsOfService: data.termsOfService || "",
        footerNote: data.footerNote || "",
        isRegisterEnabled: data.isRegisterEnabled ?? true,
        isSocialLoginEnabled: data.isSocialLoginEnabled ?? true,
        themeColor: data.themeColor || "#3b82f6",
      })
    } catch (error) {
      console.error("Failed to fetch portal settings:", error)
      toast.error("Failed to load portal settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/portal/settings', settings)
      toast.success("Portal settings updated successfully")
    } catch (error: any) {
      console.error("Failed to update portal settings:", error)
      toast.error(error.response?.data?.error || "Failed to update portal settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Portal Settings</h1>
        <p className="text-muted-foreground">Customize how the captive portal looks for your users.</p>
      </div>
      <div className="max-w-4xl space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Registration Link</CardTitle>
            <CardDescription>Share this URL with your users to allow them to register themselves on the network.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <Input
                readOnly
                value={`${window.location.origin}/register/${user?.tenantId}`}
                className="bg-background select-all font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding & Appearance</CardTitle>
            <CardDescription>Customize how the captive portal looks for your users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={settings.orgName}
                onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                placeholder="e.g. Acme Corp Wi-Fi"
              />
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
                <div className="mt-2 p-4 bg-muted/30 rounded-lg border border-border/50 inline-block">
                  <img src={settings.logoUrl} alt="Logo Preview" className="h-12 object-contain" onError={(e: any) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="themeColor">Theme Color (HEX)</Label>
              <div className="flex gap-3">
                <Input
                  id="themeColor"
                  value={settings.themeColor}
                  onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="w-32 uppercase"
                />
                <input
                  type="color"
                  value={settings.themeColor}
                  onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                  className="h-10 w-10 p-1 rounded cursor-pointer bg-background border border-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Methods</CardTitle>
            <CardDescription>Configure how users can log in or register.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Self-Registration Form</Label>
                <div className="text-sm text-muted-foreground">Allow users to register a new account via a form.</div>
              </div>
              <Switch
                checked={settings.isRegisterEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, isRegisterEnabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Social Login (Google & LINE)</Label>
                <div className="text-sm text-muted-foreground">Allow users to log in using their social accounts.</div>
              </div>
              <Switch
                checked={settings.isSocialLoginEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, isSocialLoginEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms & Footer</CardTitle>
            <CardDescription>Legal information and footer notes displayed on the portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="termsOfService">Terms of Service</Label>
              <Textarea
                id="termsOfService"
                value={settings.termsOfService}
                onChange={(e) => setSettings({ ...settings, termsOfService: e.target.value })}
                placeholder="Enter your terms of service here..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">This will be displayed in a scrollable box on the register page.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerNote">Footer Note</Label>
              <Input
                id="footerNote"
                value={settings.footerNote}
                onChange={(e) => setSettings({ ...settings, footerNote: e.target.value })}
                placeholder="e.g. Support: IT Helpdesk @ 1234"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border bg-muted/10 px-6 py-4">
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
