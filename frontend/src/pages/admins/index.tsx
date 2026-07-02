import { Search, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAdminsData } from "./hooks/useAdminsData"
import { useAdminMutations } from "./hooks/useAdminMutations"
import { AdminsTable } from "./components/AdminsTable"
import { CreateEditAdminDialog } from "./components/dialogs/CreateEditAdminDialog"

export default function AdminsPage() {
  const { t } = useTranslation()
  const {
    tenants,
    searchQuery,
    setSearchQuery,
    pagination,
    fetchAdmins
  } = useAdminsData()

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems
  } = pagination

  const {
    isDialogOpen,
    setIsDialogOpen,
    isLoading,
    editingId,
    formData,
    setFormData,
    handleCreateAdmin,
    handleOpenCreate,
    handleOpenEdit,
    handleDeleteAdmin
  } = useAdminMutations(fetchAdmins)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('admins.title')}</h2>
          <p className="text-muted-foreground">{t('admins.subtitle')}</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('admins.addAdmin')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('admins.search')}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 flex flex-col h-[540px]">
          <AdminsTable 
            paginatedData={paginatedData}
            tenants={tenants}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            handleOpenEdit={handleOpenEdit}
            handleDeleteAdmin={handleDeleteAdmin}
          />
        </CardContent>
      </Card>

      <CreateEditAdminDialog 
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        isLoading={isLoading}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        handleCreateAdmin={handleCreateAdmin}
        tenants={tenants}
      />
    </div>
  )
}
