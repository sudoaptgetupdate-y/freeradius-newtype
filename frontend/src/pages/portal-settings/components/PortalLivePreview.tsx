import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { PortalLayout } from "@/layouts/portal-layout"
import { LoginForm } from "@/components/portal/login-form"
import { RegisterForm } from "@/components/portal/register-form"
import type { PortalSettingsData } from "../hooks/usePortalSettings"

interface PortalLivePreviewProps {
  settings: PortalSettingsData
  selectedTenantId: string
  previewTab: "login" | "register"
  setPreviewTab: (tab: "login" | "register") => void
}

export function PortalLivePreview({
  settings,
  selectedTenantId,
  previewTab,
  setPreviewTab,
}: PortalLivePreviewProps) {
  return (
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
          
          <div className="mr-8">
            <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)} className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="login" className="text-xs">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-xs">Register</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </SheetHeader>

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
  )
}
