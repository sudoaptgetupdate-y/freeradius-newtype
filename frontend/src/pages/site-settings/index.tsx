import { Loader2, Palette, MessageSquare, Globe, Settings, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import PortalSettings from "@/pages/portal-settings/index"
import { useSiteSettings } from "./hooks/useSiteSettings"
import { ServiceCard } from "./components/ServiceCard"
import { TelegramModal } from "./components/modals/TelegramModal"
import { SocialLoginModal } from "./components/modals/SocialLoginModal"
import { RetentionModal } from "./components/modals/RetentionModal"

export default function SiteSettings() {
  const {
    user,
    isImpersonating,
    loading,
    saving,
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    isPortalOpen,
    setIsPortalOpen,
    isTelegramOpen,
    setIsTelegramOpen,
    isSocialOpen,
    setIsSocialOpen,
    isRetentionOpen,
    setIsRetentionOpen,
    testingTelegram,
    settings,
    draftSettings,
    setDraftSettings,
    handleTestTelegram,
    handleOpenTelegram,
    handleOpenSocial,
    handleOpenRetention,
    handleSaveModal
  } = useSiteSettings()

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isSocialConfigured = !!(settings.googleClientIdOverride || settings.lineChannelIdOverride)

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
      
      <TelegramModal 
        isOpen={isTelegramOpen}
        setIsOpen={setIsTelegramOpen}
        draftSettings={draftSettings}
        setDraftSettings={setDraftSettings}
        testingTelegram={testingTelegram}
        handleTestTelegram={handleTestTelegram}
        saving={saving}
        handleSaveModal={handleSaveModal}
      />

      <SocialLoginModal 
        isOpen={isSocialOpen}
        setIsOpen={setIsSocialOpen}
        draftSettings={draftSettings}
        setDraftSettings={setDraftSettings}
        saving={saving}
        handleSaveModal={handleSaveModal}
      />

      <RetentionModal 
        isOpen={isRetentionOpen}
        setIsOpen={setIsRetentionOpen}
        draftSettings={draftSettings}
        setDraftSettings={setDraftSettings}
        saving={saving}
        handleSaveModal={handleSaveModal}
      />

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
