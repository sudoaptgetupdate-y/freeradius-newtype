import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ErrorBoundary } from "react-error-boundary"
import { useGroupsData, type Group } from "./hooks/useGroupsData"
import { useGroupMutations } from "./hooks/useGroupMutations"

import { GroupsFilterBar } from "./components/GroupsFilterBar"
import { GroupsTable } from "./components/GroupsTable"

import { CreateEditGroupDialog } from "./components/dialogs/CreateEditGroupDialog"
import { GroupDetailsDialog } from "./components/dialogs/GroupDetailsDialog"
import { TransferUsersDialog } from "./components/dialogs/TransferUsersDialog"
import { DeleteGroupDialog, BulkSuspendDialog, BulkEnableDialog, BulkDeleteDialog } from "./components/dialogs/GroupActionDialogs"

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 text-red-500">
      <h2 className="text-xl font-bold mb-2">Something went wrong in Groups Page:</h2>
      <pre className="text-sm bg-red-50 p-4 rounded">{error.message}</pre>
    </div>
  )
}

export function GroupsPage() {
  const { user, isImpersonating } = useAuth()
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isBulkSuspendOpen, setIsBulkSuspendOpen] = useState(false)
  const [isBulkEnableOpen, setIsBulkEnableOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [targetGroupId, setTargetGroupId] = useState<string>("")
  
  const [formData, setFormData] = useState({
    name: "",
    defaultProfile: "none",
    description: "",
    tenantId: "",
  })

  const {
    groups,
    filteredGroups,
    profiles,
    tenants,
    loading,
    search,
    setSearch,
    selectedTenantFilter,
    setSelectedTenantFilter,
    fetchGroups
  } = useGroupsData(user)

  const {
    saving,
    handleSave,
    handleDelete,
    handleBulkAction,
    handleTransfer
  } = useGroupMutations({
    user,
    isImpersonating,
    fetchGroups,
    setIsAddOpen,
    setIsEditOpen,
    setIsDeleteOpen,
    setIsBulkSuspendOpen,
    setIsBulkEnableOpen,
    setIsBulkDeleteOpen,
    setIsTransferOpen
  })

  const openEdit = (g: Group) => {
    setSelectedGroup(g)
    setFormData({
      name: g.name,
      defaultProfile: g.defaultProfile || "none",
      description: g.description || "",
      tenantId: g.tenantId || "",
    })
    setIsEditOpen(true)
  }

  const openDetails = (g: Group) => {
    setSelectedGroup(g)
    setIsDetailsOpen(true)
  }

  const openTransfer = (g: Group) => {
    setSelectedGroup(g)
    setTargetGroupId("")
    setIsTransferOpen(true)
  }

  const openDelete = (g: Group) => {
    setSelectedGroup(g)
    setIsDeleteOpen(true)
  }

  const openBulkAction = (g: Group, action: 'suspend' | 'enable' | 'delete') => {
    setSelectedGroup(g)
    if (action === 'suspend') setIsBulkSuspendOpen(true)
    else if (action === 'enable') setIsBulkEnableOpen(true)
    else setIsBulkDeleteOpen(true)
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
        <p className="text-muted-foreground mt-2">
          Manage user groups, assign default profiles, and perform bulk actions.
        </p>
      </div>

      <GroupsFilterBar
        user={user}
        isImpersonating={isImpersonating}
        search={search}
        setSearch={setSearch}
        selectedTenantFilter={selectedTenantFilter}
        setSelectedTenantFilter={setSelectedTenantFilter}
        tenants={tenants}
        setIsAddOpen={setIsAddOpen}
        setFormData={setFormData}
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <GroupsTable
          user={user}
          isImpersonating={isImpersonating}
          tenants={tenants}
          filteredGroups={filteredGroups}
          loading={loading}
          openDetails={openDetails}
          openEdit={openEdit}
          openTransfer={openTransfer}
          openBulkAction={openBulkAction}
          openDelete={openDelete}
        />
      </div>

      <CreateEditGroupDialog
        isOpen={isAddOpen}
        isEditOpen={isEditOpen}
        onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }}
        user={user}
        isImpersonating={isImpersonating}
        tenants={tenants}
        profiles={profiles}
        formData={formData}
        setFormData={setFormData}
        saving={saving}
        handleSave={(isEdit) => handleSave(isEdit, formData, selectedGroup)}
      />

      <GroupDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        selectedGroup={selectedGroup}
      />

      <TransferUsersDialog
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        selectedGroup={selectedGroup}
        groups={groups}
        targetGroupId={targetGroupId}
        setTargetGroupId={setTargetGroupId}
        saving={saving}
        handleTransfer={() => handleTransfer(selectedGroup, targetGroupId)}
      />

      <DeleteGroupDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        selectedGroup={selectedGroup}
        saving={saving}
        handleDelete={() => handleDelete(selectedGroup)}
      />

      <BulkSuspendDialog
        isOpen={isBulkSuspendOpen}
        onClose={() => setIsBulkSuspendOpen(false)}
        selectedGroup={selectedGroup}
        saving={saving}
        handleAction={() => handleBulkAction('suspend', selectedGroup)}
      />

      <BulkEnableDialog
        isOpen={isBulkEnableOpen}
        onClose={() => setIsBulkEnableOpen(false)}
        selectedGroup={selectedGroup}
        saving={saving}
        handleAction={() => handleBulkAction('enable', selectedGroup)}
      />

      <BulkDeleteDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedGroup={selectedGroup}
        saving={saving}
        handleAction={() => handleBulkAction('delete', selectedGroup)}
      />
    </div>
  )
}

export default function Groups() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <GroupsPage />
    </ErrorBoundary>
  )
}
