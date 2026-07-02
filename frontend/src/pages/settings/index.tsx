import { RefreshCw, Settings as SettingsIcon, AlertCircle, Database, MessageSquare, Server, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navigate } from "react-router-dom"
import { useSettings } from "./hooks/useSettings"
import { ServiceCard } from "./components/ServiceCard"
import { RedisModal } from "./components/modals/RedisModal"
import { TelegramModal } from "./components/modals/TelegramModal"
import { LogsModal } from "./components/modals/LogsModal"
import { SmtpModal } from "./components/modals/SmtpModal"
import { GeneralModal } from "./components/modals/GeneralModal"
import { SocialLoginModal } from "./components/modals/SocialLoginModal"

export default function SettingsPage() {
  const {
    user,
    loading,
    saving,
    activeDialog,
    setActiveDialog,
    form,
    fetchSettings,
    onSubmit,
    onInvalid,
    handleSyncWebhook
  } = useSettings()

  if (user?.role !== "super_admin") {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p>Loading System Configuration...</p>
        </div>
      </div>
    )
  }

  const currentValues = form.getValues()
  const telegramEnabled = currentValues.telegramEnabled
  const isRedisConfigured = !!currentValues.redisHost
  const isLokiConfigured = !!currentValues.lokiUrl
  const isSmtpConfigured = !!currentValues.smtpHost
  const isSocialConfigured = !!currentValues.googleClientId || !!currentValues.lineChannelId

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">System Control Panel</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Click on a module tile below to configure its settings.
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchSettings} 
          disabled={loading || saving}
          className="bg-background shadow-sm h-10 px-5 rounded-lg border-border/50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload System State
        </Button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600/90 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3 text-sm">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">Service Restart Required</span>
          Changes made to infrastructure modules (Redis, Loki, Vector) will require a manual restart of the backend service to re-establish connections.
        </div>
      </div>

      {/* Grid of Control Panel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ServiceCard 
          title="Redis Server" 
          description="Manage connection for BullMQ background workers and cache." 
          icon={Database} 
          colorClass="text-emerald-500" 
          isConfigured={isRedisConfigured}
          onClick={() => setActiveDialog("redis")} 
        />
        <ServiceCard 
          title="Telegram Bot" 
          description="Configure bot API token for server alerts and guest approvals." 
          icon={MessageSquare} 
          colorClass="text-blue-500" 
          status={telegramEnabled ? "Bot Enabled" : "Bot Disabled"}
          onClick={() => setActiveDialog("telegram")} 
        />
        <ServiceCard 
          title="Logging Engine" 
          description="Set up Grafana Loki URL and Vector Receiver ports." 
          icon={Server} 
          colorClass="text-orange-500" 
          isConfigured={isLokiConfigured}
          onClick={() => setActiveDialog("logs")} 
        />
        <ServiceCard 
          title="SMTP Settings" 
          description="Email delivery configuration for reports and password resets." 
          icon={Mail} 
          colorClass="text-violet-500" 
          isConfigured={isSmtpConfigured}
          onClick={() => setActiveDialog("smtp")} 
        />
        <ServiceCard 
          title="Social Login API" 
          description="Global OAuth credentials for Google and LINE." 
          icon={SettingsIcon} 
          colorClass="text-pink-500" 
          isConfigured={isSocialConfigured}
          onClick={() => setActiveDialog("social")} 
        />
      </div>
      
      {/* General Settings Button */}
      <div className="flex justify-center mt-8">
        <Button variant="ghost" onClick={() => setActiveDialog("general")} className="text-muted-foreground hover:text-foreground">
          <SettingsIcon className="mr-2 h-4 w-4" /> Edit General System Settings
        </Button>
      </div>

      {/* Modals */}
      <RedisModal 
        isOpen={activeDialog === "redis"} 
        setIsOpen={(open) => !open && setActiveDialog(null)} 
        form={form} 
        onSubmit={onSubmit} 
        onInvalid={onInvalid} 
        saving={saving} 
      />
      
      <TelegramModal 
        isOpen={activeDialog === "telegram"} 
        setIsOpen={(open) => !open && setActiveDialog(null)} 
        form={form} 
        onSubmit={onSubmit} 
        onInvalid={onInvalid} 
        saving={saving} 
        handleSyncWebhook={handleSyncWebhook}
      />
      
      <LogsModal 
        isOpen={activeDialog === "logs"} 
        setIsOpen={(open) => !open && setActiveDialog(null)} 
        form={form} 
        onSubmit={onSubmit} 
        onInvalid={onInvalid} 
        saving={saving} 
      />
      
      <SmtpModal 
        isOpen={activeDialog === "smtp"} 
        setIsOpen={(open) => !open && setActiveDialog(null)} 
        form={form} 
        onSubmit={onSubmit} 
        onInvalid={onInvalid} 
        saving={saving} 
      />
      
      <GeneralModal 
        isOpen={activeDialog === "general"} 
        setIsOpen={(open) => !open && setActiveDialog(null)} 
        form={form} 
        onSubmit={onSubmit} 
        onInvalid={onInvalid} 
        saving={saving} 
      />
      
      <SocialLoginModal 
        isOpen={activeDialog === "social"} 
        setIsOpen={(open) => !open && setActiveDialog(null)} 
        form={form} 
        onSubmit={onSubmit} 
        onInvalid={onInvalid} 
        saving={saving} 
      />
    </div>
  )
}
