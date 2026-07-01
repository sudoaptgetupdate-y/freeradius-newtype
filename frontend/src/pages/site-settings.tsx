import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Palette, MessageSquare, Globe, CheckCircle2, XCircle, Settings, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import PortalSettings from "@/pages/portal-settings"
import api from "@/lib/api"

export default function SiteSettings() {
  const { user, isImpersonating } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")

  // State for modals
  const [isPortalOpen, setIsPortalOpen] = useState(false)
  const [isTelegramOpen, setIsTelegramOpen] = useState(false)
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const [isRetentionOpen, setIsRetentionOpen] = useState(false)
  const [testingTelegram, setTestingTelegram] = useState(false)

  const handleTestTelegram = async () => {
    if (!draftSettings.telegramChatId) {
      toast.error("Please enter a Group Chat ID first")
      return
    }
    setTestingTelegram(true)
    try {
      await api.post('/portal/settings/telegram/test', { chatId: draftSettings.telegramChatId })
      toast.success("Test message sent! Please check your Telegram group.")
    } catch (error: any) {
      console.error("Failed to send test message:", error)
      toast.error(error.response?.data?.error || "Failed to send test message")
    } finally {
      setTestingTelegram(false)
    }
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
    telegramEnabled: false,
    telegramChatId: "",
    googleClientIdOverride: "",
    googleClientSecretOverride: "",
    lineChannelIdOverride: "",
    lineChannelSecretOverride: "",
    trashRetentionDays: 30,
  })

  const [draftSettings, setDraftSettings] = useState(settings)

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
      const fetched = {
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
        telegramEnabled: data.telegramEnabled ?? false,
        telegramChatId: data.telegramChatId || "",
        googleClientIdOverride: data.googleClientIdOverride || "",
        googleClientSecretOverride: data.googleClientSecretOverride || "",
        lineChannelIdOverride: data.lineChannelIdOverride || "",
        lineChannelSecretOverride: data.lineChannelSecretOverride || "",
        trashRetentionDays: data.trashRetentionDays ?? 30,
      }
      setSettings(fetched)
      setDraftSettings(fetched)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTelegram = () => {
    setDraftSettings(settings)
    setIsTelegramOpen(true)
  }

  const handleOpenSocial = () => {
    setDraftSettings(settings)
    setIsSocialOpen(true)
  }

  const handleOpenRetention = () => {
    setDraftSettings(settings)
    setIsRetentionOpen(true)
  }

  const handleSaveModal = async (modalType: 'telegram' | 'social' | 'retention') => {
    setSaving(true)
    try {
      const payload: any = { ...settings, ...draftSettings }
      if (user?.role === "super_admin" && !isImpersonating) {
        payload.tenantId = selectedTenantId
      }
      await api.put('/portal/settings', payload)
      setSettings(payload)
      toast.success("Settings saved successfully")
      
      if (modalType === 'telegram') setIsTelegramOpen(false)
      if (modalType === 'social') setIsSocialOpen(false)
      if (modalType === 'retention') setIsRetentionOpen(false)
    } catch (error: any) {
      console.error("Failed to save settings:", error)
      toast.error(error.response?.data?.error || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const ServiceCard = ({ 
    title, description, icon: Icon, colorClass, status, isConfigured, onClick 
  }: { 
    title: string, description: string, icon: any, colorClass: string, status?: string, isConfigured?: boolean, onClick: () => void 
  }) => (
    <Card 
      onClick={onClick}
      className="cursor-pointer border-border/50 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 group bg-background/50 backdrop-blur-sm flex flex-col h-full"
    >
      <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full relative overflow-hidden flex-1">
        <div className={`absolute top-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${colorClass.replace("text-", "bg-")}`}></div>
        
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 ${colorClass.replace("text-", "bg-").replace("500", "500/10").replace("blue-500", "blue-500/10")} transition-transform group-hover:scale-110 duration-300`}>
          <Icon className={`h-8 w-8 ${colorClass}`} />
        </div>
        
        <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{description}</p>
        
        <div className="mt-auto flex items-center justify-center space-x-1.5 pt-2">
          {status ? (
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${status === "Enabled" || status === "Active" ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
              {status}
            </span>
          ) : (
            isConfigured ? (
              <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Configured
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-medium text-muted-foreground">
                <XCircle className="mr-1 h-3.5 w-3.5" /> Not Configured
              </span>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );

  const isSocialConfigured = !!(settings.googleClientIdOverride || settings.lineChannelIdOverride);

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-300 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Site Settings</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Click on a module tile below to configure integrations and operational settings for your portal.
            </p>
          </div>
        </div>
        
        {user?.role === "super_admin" && !isImpersonating && (
          <div className="w-56 bg-muted/30 p-2 rounded-lg border border-border/50">
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
      </div>

      {/* Grid matching Global Settings exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <ServiceCard
          title="Portal Designer"
          description="Customize the look and feel, branding, and terms of service of your guest login pages."
          icon={Palette}
          colorClass="text-purple-500"
          isConfigured={true}
          onClick={() => setIsPortalOpen(true)}
        />

        <ServiceCard
          title="Telegram Notify"
          description="Receive notifications for system events and use bot commands for quick management."
          icon={MessageSquare}
          colorClass="text-blue-500"
          status={settings.telegramEnabled ? "Active" : "Inactive"}
          onClick={handleOpenTelegram}
        />

        <ServiceCard
          title="Social Login API"
          description="Configure LINE and Google authentication overrides for your specific captive portal."
          icon={Globe}
          colorClass="text-orange-500"
          isConfigured={isSocialConfigured}
          onClick={handleOpenSocial}
        />

        <ServiceCard
          title="Data Retention"
          description="Configure the number of days to keep soft-deleted users in the trash before permanent deletion."
          icon={Trash2}
          colorClass="text-red-500"
          status={`${settings.trashRetentionDays} Days`}
          onClick={handleOpenRetention}
        />

      </div>

      {/* --- MODALS --- */}
      
      {/* Telegram Modal */}
      <Dialog open={isTelegramOpen} onOpenChange={setIsTelegramOpen}>
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
            <Button variant="ghost" onClick={() => setIsTelegramOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSaveModal('telegram')} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Social Login Modal */}
      <Dialog open={isSocialOpen} onOpenChange={setIsSocialOpen}>
        <DialogContent className="bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 sm:max-w-[600px]">
          <DialogHeader className="bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Globe className="w-5 h-5 text-orange-500" />
              Social Logins
            </DialogTitle>
            <DialogDescription>
              Provide custom OAuth credentials for your captive portal. Leave blank to use global settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-5 sm:px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Social Login</Label>
                <p className="text-sm text-muted-foreground">Show social buttons on captive portal.</p>
              </div>
              <Switch 
                checked={draftSettings.isSocialLoginEnabled}
                onCheckedChange={c => setDraftSettings({...draftSettings, isSocialLoginEnabled: c})}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#06C755" d="M12 0C5.37 0 0 4.48 0 10c0 4.94 4.29 9.07 10.08 9.86.39.08.92.26 1.06.6.12.31.08.79.04 1.1l-.17 1.05c-.05.31-.24 1.2 1.05.65 1.29-.54 6.96-4.1 9.5-7.03C23.16 14.07 24 12.13 24 10c0-5.52-5.37-10-12-10z"/></svg>
                LINE Login 
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel ID</Label>
                  <Input 
                    value={draftSettings.lineChannelIdOverride}
                    onChange={(e) => setDraftSettings({ ...draftSettings, lineChannelIdOverride: e.target.value })}
                    placeholder="Optional Override"
                    disabled={!draftSettings.isSocialLoginEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Channel Secret</Label>
                  <Input 
                    type="password"
                    value={draftSettings.lineChannelSecretOverride}
                    onChange={(e) => setDraftSettings({ ...draftSettings, lineChannelSecretOverride: e.target.value })}
                    placeholder="Optional Override"
                    disabled={!draftSettings.isSocialLoginEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.55-5.17 3.55-8.65z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.25 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.3c-.25-.72-.38-1.5-.38-2.3s.13-1.58.38-2.3v-3.1H1.27A11.93 11.93 0 0 0 0 12c0 1.93.46 3.76 1.27 5.4l4-3.1z"/><path fill="#EA4335" d="M12 4.74c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.18 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4 3.1C6.22 6.85 8.87 4.74 12 4.74z"/></svg>
                Google OAuth
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input 
                    value={draftSettings.googleClientIdOverride}
                    onChange={(e) => setDraftSettings({ ...draftSettings, googleClientIdOverride: e.target.value })}
                    placeholder="Optional Override"
                    disabled={!draftSettings.isSocialLoginEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <Input 
                    type="password"
                    value={draftSettings.googleClientSecretOverride}
                    onChange={(e) => setDraftSettings({ ...draftSettings, googleClientSecretOverride: e.target.value })}
                    placeholder="Optional Override"
                    disabled={!draftSettings.isSocialLoginEnabled}
                  />
                </div>
              </div>
            </div>

          </div>
          <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
            <Button variant="ghost" onClick={() => setIsSocialOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSaveModal('social')} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retention Modal */}
      <Dialog open={isRetentionOpen} onOpenChange={setIsRetentionOpen}>
        <DialogContent className="bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 sm:max-w-[500px]">
          <DialogHeader className="bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Data Retention Settings
            </DialogTitle>
            <DialogDescription>
              Configure how long soft-deleted users are kept in the trash bin before being permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 sm:px-8 py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="trashRetentionDays">Trash Retention Days</Label>
              <Input 
                id="trashRetentionDays"
                type="number" 
                min={1} 
                max={365}
                value={draftSettings.trashRetentionDays} 
                onChange={(e) => setDraftSettings({...draftSettings, trashRetentionDays: parseInt(e.target.value) || 30})}
              />
              <p className="text-xs text-muted-foreground">Number of days (1-365) users stay in Trash before auto-cleanup.</p>
            </div>
          </div>
          <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
            <Button variant="ghost" onClick={() => setIsRetentionOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSaveModal('retention')} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portal Designer Modal */}
      <Dialog open={isPortalOpen} onOpenChange={setIsPortalOpen}>
        <DialogContent className="bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 max-w-[95vw] lg:max-w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <PortalSettings />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
