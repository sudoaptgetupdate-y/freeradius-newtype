import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ErrorBoundary } from "react-error-boundary"
import type { FallbackProps } from "react-error-boundary"
import { useAuth } from "@/contexts/auth-context"

import { useUsersData } from "./hooks/useUsersData"
import { useUsers } from "./hooks/useUsers"
import { useUserMutations } from "./hooks/useUserMutations"

import { UserFilterBar } from "./components/UserFilterBar"
import { UserTable } from "./components/UserTable"
import { CreateUserDialog } from "./components/dialogs/CreateUserDialog"
import { EditUserDialog } from "./components/dialogs/EditUserDialog"
import { UserDetailsDialog } from "./components/dialogs/UserDetailsDialog"
import { BulkImportDialog } from "./components/dialogs/BulkImportDialog"
import type { UserData } from "@/types/user"

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return (
    <div className="p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
      <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
      <pre className="text-sm bg-muted p-4 rounded-md mb-4 max-w-[800px] overflow-auto whitespace-pre-wrap text-left">
        {errorMessage}
      </pre>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  )
}

export function UsersPage() {
  const { t } = useTranslation()
  const { user, isImpersonating } = useAuth()

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [viewingUsername, setViewingUsername] = useState<string | null>(null)

  const { 
    profiles, 
    groups, 
    tenants, 
    fetchProfiles, 
    fetchGroups, 
    fetchTenants 
  } = useUsersData(user)

  const {
    users,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedGroupFilter,
    setSelectedGroupFilter,
    selectedTenantFilter,
    setSelectedTenantFilter,
    selectedUsers,
    setSelectedUsers,
    fetchUsers,
    toggleSelectAll,
    toggleSelectUser,
    pagination
  } = useUsers()

  const {
    handleDeleteUser,
    handleRestoreUser,
    handleBulkAction
  } = useUserMutations(
    user,
    isImpersonating,
    users, fetchUsers, statusFilter)

  // Initial fetch
  useEffect(() => {
    fetchUsers(statusFilter === "bin")
    fetchProfiles()
    fetchGroups()
    fetchTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter])

  // Reset selected users when status changes to avoid weird state bugs
  useEffect(() => {
    setSelectedUsers([])
  }, [statusFilter, setSelectedUsers])

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => fetchUsers(statusFilter === "bin")}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('users.title')}</h2>
            <p className="text-muted-foreground">{t('users.subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t('users.addUser')}
            </Button>
          </div>
        </div>

        <div className="w-full">
          <Card>
            <CardHeader className="pb-3 px-4 sm:px-6">
              <UserFilterBar 
                user={user}
                isImpersonating={isImpersonating}
                tenants={tenants}
                groups={groups}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedTenantFilter={selectedTenantFilter}
                setSelectedTenantFilter={setSelectedTenantFilter}
                selectedGroupFilter={selectedGroupFilter}
                setSelectedGroupFilter={setSelectedGroupFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                selectedUsers={selectedUsers}
                handleBulkAction={(action) => handleBulkAction(action, selectedUsers, setSelectedUsers, selectedTenantFilter)}
              />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 flex flex-col h-[600px]">
              <UserTable 
                paginatedData={pagination.paginatedData}
                user={user}
                isImpersonating={isImpersonating}
                tenants={tenants}
                statusFilter={statusFilter}
                selectedUsers={selectedUsers}
                toggleSelectAll={toggleSelectAll}
                toggleSelectUser={toggleSelectUser}
                handleOpenDetails={setViewingUsername}
                handleOpenEdit={setEditingUser}
                handleDeleteUser={handleDeleteUser}
                handleRestoreUser={handleRestoreUser}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                setCurrentPage={pagination.setCurrentPage}
                setPageSize={pagination.setPageSize}
              />
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <CreateUserDialog 
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => fetchUsers(statusFilter === "bin")}
          user={user}
          isImpersonating={isImpersonating}
          tenants={tenants}
          groups={groups}
          profiles={profiles}
        />

        <EditUserDialog 
          userObj={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => fetchUsers(statusFilter === "bin")}
          user={user}
          groups={groups}
        />

        <UserDetailsDialog 
          username={viewingUsername}
          onClose={() => setViewingUsername(null)}
          user={user}
          users={users}
        />

        <BulkImportDialog 
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          onSuccess={() => fetchUsers(statusFilter === "bin")}
          groups={groups}
          user={user}
          isImpersonating={isImpersonating}
          selectedTenantFilter={selectedTenantFilter}
          tenants={tenants}
        />
      </div>
    </ErrorBoundary>
  )
}
