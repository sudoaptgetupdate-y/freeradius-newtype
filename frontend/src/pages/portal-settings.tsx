import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "react-toastify"
import { Loader2, Save, Copy, Check, Eye, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import api from "@/lib/api"
import { PortalLayout } from "@/layouts/portal-layout"
import { LoginForm } from "@/components/portal/login-form"
import { RegisterForm } from "@/components/portal/register-form"

export default function PortalSettings() {
  const { user, isImpersonating } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [previewTab, setPreviewTab] = useState<"login" | "register">("login")



  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")

  const handleCopyLink = () => {
    const registerUrl = `${window.location.origin}/register/${selectedTenantId}`
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
    themeColor: "#0A2540",
    welcomeMessage: "",
    leftBgColor: "#071D33",
    leftTextColor: "#FFFFFF",
    leftAccentColor: "#F59E0B",
    googleClientIdOverride: "",
    googleClientSecretOverride: "",
    lineChannelIdOverride: "",
    lineChannelSecretOverride: "",
    telegramEnabled: false,
    telegramChatId: "",
  })

  useEffect(() => {
    if (user?.role === "super_admin" && !isImpersonating) {
      api.get("/tenants").then(res => {
        setTenants(res.data)
        if (res.data.length > 0) {
          setSelectedTenantId(res.data[0].id)
        } else {
          setLoading(false)
        }
      }).catch(err => {
        console.error(err)
        setLoading(false)
      })
    } else if (user?.tenantId) {
      setSelectedTenantId(user.tenantId)
    } else {
      setLoading(false)
    }
  }, [user, isImpersonating])

  useEffect(() => {
    if (selectedTenantId) {
      fetchSettings(selectedTenantId)
    }
  }, [selectedTenantId])

  const fetchSettings = async (targetTenantId: string) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/portal/settings/admin/${targetTenantId}`)
      setSettings({
        orgName: data.orgName || "",
        logoUrl: data.logoUrl || "",
        termsOfService: data.termsOfService || "",
        footerNote: data.footerNote || "",
        isRegisterEnabled: data.isRegisterEnabled ?? true,
        isSocialLoginEnabled: data.isSocialLoginEnabled ?? true,
        themeColor: data.themeColor || "#0A2540",
        welcomeMessage: data.welcomeMessage || "",
        leftBgColor: data.leftBgColor || "#071D33",
        leftTextColor: data.leftTextColor || "#FFFFFF",
        leftAccentColor: data.leftAccentColor || "#F59E0B",
        googleClientIdOverride: data.googleClientIdOverride || "",
        googleClientSecretOverride: data.googleClientSecretOverride || "",
        lineChannelIdOverride: data.lineChannelIdOverride || "",
        lineChannelSecretOverride: data.lineChannelSecretOverride || "",
        telegramEnabled: data.telegramEnabled ?? false,
        telegramChatId: data.telegramChatId || "",
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
      const payload: any = { ...settings }
      if (user?.role === "super_admin" && !isImpersonating) {
        payload.tenantId = selectedTenantId
      }
      await api.put('/portal/settings', payload)
      toast.success("Portal settings updated successfully")
    } catch (error: any) {
      console.error("Failed to update portal settings:", error)
      toast.error(error.response?.data?.error || "Failed to update portal settings")
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = () => {
    setSettings(prev => ({
      ...prev,
      themeColor: "#0A2540",
      leftBgColor: "#071D33",
      leftTextColor: "#FFFFFF",
      leftAccentColor: "#F59E0B",
    }))
    toast.info("Theme colors reset to Security Shield defaults. Remember to click Save Settings.")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portal Settings</h1>
          <p className="text-muted-foreground">Configure your captive portal look and feel step-by-step.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tenant Selector for Super Admin */}
          {user?.role === "super_admin" && !isImpersonating && (
            <div className="w-56">
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="Select Tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Live Preview Trigger (Slide-over Sheet) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <Eye className="w-4 h-4 animate-pulse" />
                Live Preview
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[1000px] w-full md:w-[85vw] p-0 flex flex-col bg-muted/40 border-l border-border">
              <SheetHeader className="p-6 border-b bg-background flex flex-row items-center justify-between shrink-0">
                <div>
                  <SheetTitle className="text-lg">Portal Preview</SheetTitle>
                  <SheetDescription>Verify how your captive portal looks with the unsaved changes.</SheetDescription>
                </div>
                
                {/* Switcher in Sheet */}
                <div className="mr-8">
                  <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)} className="w-[180px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="login" className="text-xs">Login</TabsTrigger>
                      <TabsTrigger value="register" className="text-xs">Register</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </SheetHeader>

              {/* The Live Interactive Preview Canvas */}
              <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
                <div className="w-full max-w-[900px] shadow-2xl rounded-2xl overflow-hidden pointer-events-none ring-1 ring-border/50">
                  <PortalLayout settings={settings} activeTab={previewTab} onTabChange={() => {}}>
                    {previewTab === "login" ? (
                      <LoginForm 
                        tenantId={selectedTenantId} 
                        settings={settings} 
                        onRegisterClick={() => {}} 
                      />
                    ) : (
                      <RegisterForm 
                        tenantId={selectedTenantId} 
                        settings={settings} 
                        onLoginClick={() => {}} 
                      />
                    )}
                  </PortalLayout>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Wizard Progress Stepper Indicator */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Step 1 */}
          <button 
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex flex-col items-center focus:outline-none"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ${
              currentStep >= 1 ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground border-border'
            }`}>
              1
            </div>
            <span className={`text-xs font-medium mt-1.5 transition-colors ${currentStep === 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>Branding</span>
          </button>
          
          <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentStep >= 2 ? 'bg-primary' : 'bg-border'}`} />
          
          {/* Step 2 */}
          <button 
            type="button"
            onClick={() => setCurrentStep(2)}
            className="flex flex-col items-center focus:outline-none"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ${
              currentStep >= 2 ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground border-border'
            }`}>
              2
            </div>
            <span className={`text-xs font-medium mt-1.5 transition-colors ${currentStep === 2 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>Theme Colors</span>
          </button>
          
          <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentStep >= 3 ? 'bg-primary' : 'bg-border'}`} />
          
          {/* Step 3 */}
          <button 
            type="button"
            onClick={() => setCurrentStep(3)}
            className="flex flex-col items-center focus:outline-none"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ${
              currentStep >= 3 ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground border-border'
            }`}>
              3
            </div>
            <span className={`text-xs font-medium mt-1.5 transition-colors ${currentStep === 3 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>Settings & Legal</span>
          </button>
        </div>
      </div>

      {/* Step Contents */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
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
        )}

        {currentStep === 2 && (
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
        )}

        {currentStep === 3 && (
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
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-sm mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex gap-2">
          {currentStep < 3 ? (
            <Button 
              onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
              className="flex items-center gap-1.5"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          )}
        </div>
      </div>

    </div>
  )
}
