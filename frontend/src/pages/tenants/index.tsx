import { useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ErrorBoundary } from "react-error-boundary"
import type { FallbackProps } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { usePagination } from "@/hooks/use-pagination"
import { DataTablePagination } from "@/components/data-table-pagination"

import { useTenantsData, type TenantData } from "./hooks/useTenantsData"
import { useTenantMutations } from "./hooks/useTenantMutations"
import { TenantFilterBar } from "./components/TenantFilterBar"
import { TenantTable } from "./components/TenantTable"
import { CreateEditTenantDialog } from "./components/dialogs/CreateEditTenantDialog"

function ErrorFallback({ error }: FallbackProps) {
  return (
    <div className="p-6 text-red-500">
      <h2 className="text-xl font-bold mb-2">Something went wrong in Tenants Page:</h2>
      <pre className="text-sm bg-red-50 p-4 rounded">{error.message}</pre>
    </div>
  )
}

export function TenantsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { startImpersonation } = useAuth()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null)
  const [originalDeviceType, setOriginalDeviceType] = useState<string | undefined>(undefined)

  const [formData, setFormData] = useState({
    name: "",
    maxUsers: 100,
    maxNas: 1,
    status: "active",
    primaryDeviceType: "mikrotik",
    defaultRegisterProfile: "",
    adminEmail: "",
    adminPassword: "",
    telegramChatId: "",
    telegramEnabled: false
  })

  const {
    filteredTenants,
    profiles,
    searchQuery,
    setSearchQuery,
    fetchTenants
  } = useTenantsData()

  const {
    isLoading,
    handleCreateTenant,
    handleDeleteTenant,
    handleImpersonate
  } = useTenantMutations({
    navigate,
    startImpersonation,
    fetchTenants,
    setIsDialogOpen,
    setFormData,
    setEditingTenantId
  })

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData,
    totalPages,
    totalItems
  } = usePagination(filteredTenants)

  const handleOpenCreate = () => {
    setEditingTenantId(null)
    setFormData({ name: "", maxUsers: 100, maxNas: 1, status: "active", primaryDeviceType: "mikrotik", defaultRegisterProfile: "none", adminEmail: "", adminPassword: "", telegramChatId: "", telegramEnabled: false })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (tenant: TenantData) => {
    setEditingTenantId(tenant.id)
    setOriginalDeviceType(tenant.primaryDeviceType)
    setFormData({
      name: tenant.name,
      maxUsers: tenant.maxUsers,
      maxNas: tenant.maxNas,
      status: tenant.status,
      primaryDeviceType: tenant.primaryDeviceType || "mikrotik",
      defaultRegisterProfile: tenant.defaultRegisterProfile || "none",
      adminEmail: "", // Not used in edit mode
      adminPassword: "", // Not used in edit mode
      telegramChatId: tenant.telegramChatId || "",
      telegramEnabled: tenant.telegramEnabled || false
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('tenants.title')}</h2>
          <p className="text-muted-foreground">{t('tenants.subtitle')}</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('tenants.addTenant')}
        </Button>
      </div>

      <Card className="flex-1 flex flex-col shadow-sm border-border/50">
        <TenantFilterBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <CardContent className="p-4 sm:p-6 pt-0 flex flex-col flex-1 h-[540px]">
          <TenantTable 
            paginatedData={paginatedData}
            handleOpenEdit={handleOpenEdit}
            handleDeleteTenant={handleDeleteTenant}
            handleImpersonate={handleImpersonate}
          />
          <DataTablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <CreateEditTenantDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingTenantId={editingTenantId}
        formData={formData}
        setFormData={setFormData}
        profiles={profiles}
        isLoading={isLoading}
        originalDeviceType={originalDeviceType}
        handleCreateTenant={handleCreateTenant}
      />
    </div>
  )
}

export default function Tenants() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <TenantsPage />
    </ErrorBoundary>
  )
}
