import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePortalSettings } from "./hooks/usePortalSettings"
import { PortalWizardStepper, PortalWizardActions } from "./components/PortalWizardStepper"
import { PortalLivePreview } from "./components/PortalLivePreview"
import { Step1Branding } from "./components/steps/Step1Branding"
import { Step2ThemeColors } from "./components/steps/Step2ThemeColors"
import { Step3Legal } from "./components/steps/Step3Legal"

export default function PortalSettings() {
  const {
    user,
    isImpersonating,
    loading,
    saving,
    copied,
    currentStep,
    setCurrentStep,
    previewTab,
    setPreviewTab,
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    settings,
    setSettings,
    handleSave,
    handleResetDefaults,
    handleCopyLink
  } = usePortalSettings()

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
          <PortalLivePreview
            settings={settings}
            selectedTenantId={selectedTenantId}
            previewTab={previewTab}
            setPreviewTab={setPreviewTab}
          />
        </div>
      </div>

      <PortalWizardStepper
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        saving={saving}
        handleSave={handleSave}
      />

      {/* Step Contents */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <Step1Branding settings={settings} setSettings={setSettings} />
        )}

        {currentStep === 2 && (
          <Step2ThemeColors 
            settings={settings} 
            setSettings={setSettings} 
            handleResetDefaults={handleResetDefaults} 
          />
        )}

        {currentStep === 3 && (
          <Step3Legal 
            settings={settings} 
            setSettings={setSettings}
            selectedTenantId={selectedTenantId}
            copied={copied}
            handleCopyLink={handleCopyLink}
          />
        )}
      </div>

      <PortalWizardActions
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        saving={saving}
        handleSave={handleSave}
      />

    </div>
  )
}
