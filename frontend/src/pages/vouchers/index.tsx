import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePagination } from "@/hooks/use-pagination"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ErrorBoundary } from "react-error-boundary"
import type { FallbackProps } from "react-error-boundary"
import { Button } from "@/components/ui/button"

import { useVoucherData } from "./hooks/useVoucherData"
import { useVouchers } from "./hooks/useVouchers"
import { useVoucherMutations } from "./hooks/useVoucherMutations"

import { VoucherFilterBar } from "./components/VoucherFilterBar"
import { VoucherTable } from "./components/VoucherTable"
import { GenerateVoucherDialog } from "./components/dialogs/GenerateVoucherDialog"
import { VoucherSettingsDialog } from "./components/dialogs/VoucherSettingsDialog"

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
      <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
      <pre className="text-sm bg-muted p-4 rounded-md mb-4 max-w-[800px] overflow-auto whitespace-pre-wrap text-left">
        {error.message}
      </pre>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  )
}

function VouchersContent() {
  const { user, isImpersonating } = useAuth()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  
  const [formData, setFormData] = useState({
    tenantId: "",
    amount: "10",
    prefix: "",
    groupname: "",
    type: "code",
    codeLength: "6",
    passwordLength: "6"
  })

  // Data fetching hooks
  const { tenants, profiles, settings, fetchTenants, fetchProfiles, fetchSettings } = useVoucherData(user)
  
  const { batches, filteredBatches, selectedTenantFilter, setSelectedTenantFilter, fetchBatches } = useVouchers()

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData,
    totalPages,
    totalItems
  } = usePagination(filteredBatches)

  // Local settings state for the dialog
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleOpenCreate = () => {
    setFormData({ tenantId: "", amount: "10", prefix: settings.defaultPrefix || "", groupname: "", type: "code", codeLength: "6", passwordLength: "6" })
    setIsDialogOpen(true)
  }

  // Mutations hook
  const { handleGenerate, handleSaveSettings, handlePrintBatch, activeJobId } = useVoucherMutations({
    user,
    isImpersonating,
    batches,
    settings,
    fetchBatches,
    fetchSettings,
    setIsGenerating,
    setProgress,
    setIsDialogOpen,
    setIsSettingsDialogOpen,
    setIsSavingSettings
  })

  // Initial data load
  useEffect(() => {
    fetchBatches()
    fetchTenants((id) => setFormData(prev => ({...prev, tenantId: id})))
    fetchProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchBatches, fetchTenants, fetchProfiles])

  // Load settings based on user/tenant
  useEffect(() => {
    if (!user) return
    if (user.role !== "super_admin" && user.role !== "admin") {
      fetchSettings()
    } else if (formData.tenantId) {
      fetchSettings(formData.tenantId)
    }
  }, [user, formData.tenantId, fetchSettings])

  // Filter profiles based on selected tenant
  const availableProfiles = profiles.filter(p => 
    !formData.tenantId || (p as any).tenantId === formData.tenantId || !(p as any).tenantId
  )

  return (
    <div className="space-y-6">
      <VoucherFilterBar
        user={user}
        isImpersonating={isImpersonating}
        tenants={tenants}
        selectedTenantFilter={selectedTenantFilter}
        setSelectedTenantFilter={setSelectedTenantFilter}
        fetchBatches={fetchBatches}
        setIsSettingsDialogOpen={setIsSettingsDialogOpen}
        handleOpenCreate={handleOpenCreate}
      />

      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6 hidden" />
        <CardContent className="p-4 sm:p-6 flex flex-col h-[540px]">
          <VoucherTable
            user={user}
            isImpersonating={isImpersonating}
            tenants={tenants}
            paginatedData={paginatedData}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            handlePrintBatch={handlePrintBatch}
          />
        </CardContent>
      </Card>

      <GenerateVoucherDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        user={user}
        isImpersonating={isImpersonating}
        tenants={tenants}
        availableProfiles={availableProfiles}
        formData={formData}
        setFormData={setFormData}
        isGenerating={isGenerating}
        progress={progress}
        handleGenerate={(e) => {
          e.preventDefault()
          handleGenerate(formData)
        }}
      />

      <VoucherSettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        user={user}
        isImpersonating={isImpersonating}
        tenants={tenants}
        formData={formData}
        setFormData={setFormData}
        settings={localSettings}
        setSettings={setLocalSettings}
        isSavingSettings={isSavingSettings}
        handleSaveSettings={(e) => {
          e.preventDefault()
          handleSaveSettings(formData, localSettings)
        }}
      />
    </div>
  )
}

export function VouchersPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <VouchersContent />
    </ErrorBoundary>
  )
}
