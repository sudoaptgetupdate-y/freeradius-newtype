import { useState } from "react"
import { Plus, Server } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import { ErrorBoundary } from "react-error-boundary"
import type { FallbackProps } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { usePagination } from "@/hooks/use-pagination"
import { DataTablePagination } from "@/components/data-table-pagination"

import { useNasData, type NasData } from "./hooks/useNasData"
import { useNasMutations } from "./hooks/useNasMutations"
import { NasFilterBar } from "./components/NasFilterBar"
import { NasTable } from "./components/NasTable"
import { CreateEditNasDialog } from "./components/dialogs/CreateEditNasDialog"

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-6 text-red-500">
      <h2 className="text-xl font-bold mb-2">Something went wrong in NAS Page:</h2>
      <pre className="text-sm bg-red-50 p-4 rounded">{error.message}</pre>
    </div>
  )
}

export function NasPage() {
  const { t } = useTranslation()
  const { user, isImpersonating } = useAuth()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nasname: "",
    shortname: "",
    type: "mikrotik",
    secret: "",
    tenantId: "",
    apiUsername: "",
    apiPasswordEncrypted: ""
  })

  const {
    filteredNas,
    tenants,
    searchQuery,
    setSearchQuery,
    selectedTenantFilter,
    setSelectedTenantFilter,
    fetchNas
  } = useNasData(user)

  const {
    saving,
    handleCreateNas,
    handleDeleteNas,
    handleTestApi
  } = useNasMutations({
    user,
    isImpersonating,
    fetchNas,
    setIsDialogOpen,
    setFormData,
    setEditingId
  })

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData,
    totalPages,
    totalItems
  } = usePagination(filteredNas)

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({ nasname: "", shortname: "", type: "mikrotik", secret: "", tenantId: "", apiUsername: "", apiPasswordEncrypted: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (nas: NasData) => {
    setEditingId(nas.id)
    setFormData({
      nasname: nas.nasname,
      shortname: nas.shortname,
      type: nas.type || "other",
      secret: nas.secret || "",
      tenantId: nas.tenantId || "",
      apiUsername: nas.apiUsername || "",
      apiPasswordEncrypted: nas.apiPasswordEncrypted || ""
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('nas.title')}</h2>
          <p className="text-muted-foreground">{t('nas.subtitle')}</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('nas.addNas')}
        </Button>
      </div>

      {isImpersonating && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold">
              <Server className="h-5 w-5 animate-pulse animate-duration-1000" />
              <span>Service Mode Tools (Mockup)</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              เครื่องมือช่างสำหรับแอดมินระดับสูงเพื่อวิเคราะห์และซ่อมแซมระบบเครือข่ายของไซต์นี้ (แสดงเฉพาะคุณขณะสวมสิทธิ์)
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-background border-amber-500/20 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 h-9 px-3 rounded-lg text-xs font-medium"
              onClick={() => toast.info("Mockup: กำลังส่งคำสั่งทดสอบเชื่อมต่อตรง (CoA Port Test)...")}
            >
              Test CoA Port
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-background border-amber-500/20 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 h-9 px-3 rounded-lg text-xs font-medium"
              onClick={() => toast.info("Mockup: บังคับซิงค์โครงสร้าง RADIUS สำเร็จ")}
            >
              Force Sync Config
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-background border-amber-500/20 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 h-9 px-3 rounded-lg text-xs font-medium"
              onClick={() => toast.info("Mockup: อนุมัติข้ามขีดจำกัดอุปกรณ์ (Quota Bypass) ชั่วคราวสำเร็จ")}
            >
              Bypass Limit
            </Button>
          </div>
        </div>
      )}

      <Card>
        <NasFilterBar 
          user={user}
          isImpersonating={isImpersonating}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTenantFilter={selectedTenantFilter}
          setSelectedTenantFilter={setSelectedTenantFilter}
          tenants={tenants}
        />
        <CardContent className="p-4 sm:p-6 pt-0 flex flex-col h-[540px]">
          <NasTable 
            user={user}
            isImpersonating={isImpersonating}
            tenants={tenants}
            paginatedData={paginatedData}
            handleOpenEdit={handleOpenEdit}
            handleDeleteNas={handleDeleteNas}
            handleTestApi={handleTestApi}
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

      <CreateEditNasDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        user={user}
        isImpersonating={isImpersonating}
        tenants={tenants}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        saving={saving}
        handleCreateNas={handleCreateNas}
      />
    </div>
  )
}

export default function Nas() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <NasPage />
    </ErrorBoundary>
  )
}
