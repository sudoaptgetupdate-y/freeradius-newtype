import { useState } from "react"
import { toast } from "react-toastify"
import api from "@/lib/api"
import type { Group } from "./useGroupsData"

interface UseGroupMutationsProps {
  user: any
  isImpersonating: boolean
  fetchGroups: () => void
  setIsAddOpen: (v: boolean) => void
  setIsEditOpen: (v: boolean) => void
  setIsDeleteOpen: (v: boolean) => void
  setIsBulkSuspendOpen: (v: boolean) => void
  setIsBulkEnableOpen: (v: boolean) => void
  setIsBulkDeleteOpen: (v: boolean) => void
  setIsTransferOpen: (v: boolean) => void
}

export function useGroupMutations({
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
}: UseGroupMutationsProps) {
  const [saving, setSaving] = useState(false)

  const handleSave = async (isEdit: boolean, formData: any, selectedGroup: Group | null) => {
    if (!formData.name) {
      toast.error("Group name is required")
      return
    }

    if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && !formData.tenantId) {
      toast.error("Please select a Tenant before saving.")
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        name: formData.name,
        defaultProfile: formData.defaultProfile === "none" ? null : formData.defaultProfile,
        description: formData.description,
      }
      if (formData.tenantId) {
        payload.tenantId = formData.tenantId
      }

      if (isEdit && selectedGroup) {
        await api.put(`/groups/${selectedGroup.id}`, payload)
        toast.success("Group updated successfully")
        setIsEditOpen(false)
      } else {
        await api.post("/groups", payload)
        toast.success("Group created successfully")
        setIsAddOpen(false)
      }
      fetchGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (selectedGroup: Group | null) => {
    if (!selectedGroup) return
    setSaving(true)
    try {
      await api.delete(`/groups/${selectedGroup.id}`)
      toast.success("Group deleted successfully")
      setIsDeleteOpen(false)
      fetchGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete group")
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAction = async (action: 'suspend' | 'enable' | 'delete', selectedGroup: Group | null) => {
    if (!selectedGroup) return
    setSaving(true)
    try {
      const endpoint = action === 'suspend' ? 'bulk-disable' : action === 'enable' ? 'bulk-enable' : 'bulk-delete'
      const res = await api.post(`/groups/${selectedGroup.id}/${endpoint}`)
      toast.success(res.data.message || `Successfully processed bulk action`)
      if (action === 'suspend') {
        setIsBulkSuspendOpen(false)
      } else if (action === 'enable') {
        setIsBulkEnableOpen(false)
      } else {
        setIsBulkDeleteOpen(false)
      }
      fetchGroups() 
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to process bulk action`)
    } finally {
      setSaving(false)
    }
  }

  const handleTransfer = async (selectedGroup: Group | null, targetGroupId: string) => {
    if (!selectedGroup || !targetGroupId) return
    setSaving(true)
    try {
      const res = await api.post(`/groups/${selectedGroup.id}/bulk-transfer`, { targetGroupId })
      toast.success(res.data.message || `Successfully transferred users`)
      setIsTransferOpen(false)
      fetchGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to transfer users`)
    } finally {
      setSaving(false)
    }
  }

  return {
    saving,
    handleSave,
    handleDelete,
    handleBulkAction,
    handleTransfer
  }
}
