import { useState } from "react"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import api from "@/lib/api"
import type {  UserData  } from "@/types/user"

const MySwal = withReactContent(Swal)

export function useUserMutations(
  user: any,
  isImpersonating: boolean,
  users: UserData[],
  fetchUsers: (isTrash?: boolean) => void,
  statusFilter: string
) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDeleteUser = async (username: string) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete user ${username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        let tenantIdQuery = ""
        if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating) {
          const targetUser = users.find(u => u.username === username)
          if (targetUser && (targetUser as any).tenantId) {
            tenantIdQuery = `?tenantId=${(targetUser as any).tenantId}`
          }
        }
        await api.delete(`/users/${username}${statusFilter === 'bin' ? '/permanent' : ''}${tenantIdQuery}`)
        toast.success(statusFilter === 'bin' ? "User permanently deleted!" : "User moved to trash!")
        fetchUsers(statusFilter === 'bin')
      } catch (error: any) {
        console.error("Failed to delete user:", error)
        toast.error(error.response?.data?.error || "Failed to delete user")
      }
    }
  }

  const handleRestoreUser = async (username: string) => {
    try {
      let tenantIdQuery = ""
      if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating) {
        const targetUser = users.find(u => u.username === username)
        if (targetUser && (targetUser as any).tenantId) {
          tenantIdQuery = `?tenantId=${(targetUser as any).tenantId}`
        }
      }
      await api.post(`/users/${username}/restore${tenantIdQuery}`)
      toast.success("User restored successfully!")
      fetchUsers(statusFilter === 'bin')
    } catch (error: any) {
      console.error("Failed to restore user:", error)
      toast.error(error.response?.data?.error || "Failed to restore user")
    }
  }

  const handleBulkAction = async (
    action: 'suspend' | 'enable' | 'delete' | 'transfer' | 'restore' | 'hard_delete', 
    selectedUsers: string[], 
    setSelectedUsers: (users: string[]) => void,
    selectedTenantFilter?: string
  ) => {
    if (selectedUsers.length === 0) return
    setIsLoading(true)
    try {
      if (action === 'restore' || action === 'hard_delete') {
        const promises = selectedUsers.map(username => {
          let tenantIdQuery = ""
          if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating) {
            const targetUser = users.find(u => u.username === username)
            if (targetUser && (targetUser as any).tenantId) {
              tenantIdQuery = `?tenantId=${(targetUser as any).tenantId}`
            }
          }
          if (action === 'restore') return api.post(`/users/${username}/restore${tenantIdQuery}`)
          return api.delete(`/users/${username}/permanent${tenantIdQuery}`)
        })
        await Promise.all(promises)
      } else {
        const endpoint = action === 'suspend' ? 'bulk-disable' : action === 'enable' ? 'bulk-enable' : action === 'transfer' ? 'bulk-transfer' : 'bulk-delete'
        const payload: any = { usernames: selectedUsers }
        
        let tenantIdQuery = ""
        if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating) {
          const targetTenant = selectedTenantFilter && selectedTenantFilter !== "all" 
            ? selectedTenantFilter 
            : users.find(u => u.username === selectedUsers[0])?.tenantId
          
          if (targetTenant) {
            tenantIdQuery = `?tenantId=${targetTenant}`
          }
        }
        
        await api.post(`/users/${endpoint}${tenantIdQuery}`, payload)
      }
      toast.success(`Successfully processed bulk action`)
      setSelectedUsers([])
      fetchUsers(statusFilter === 'bin')
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to process bulk action`)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    setIsLoading,
    handleDeleteUser,
    handleRestoreUser,
    handleBulkAction
  }
}
