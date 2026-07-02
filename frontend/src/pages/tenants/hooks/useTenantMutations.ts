import { useState } from "react"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import api from "@/lib/api"
import type { TenantData } from "./useTenantsData"

const MySwal = withReactContent(Swal)

interface UseTenantMutationsProps {
  navigate: (path: string) => void
  startImpersonation: (token: string, user: any, tenantName: string) => void
  fetchTenants: () => void
  setIsDialogOpen: (v: boolean) => void
  setFormData: (data: any) => void
  setEditingTenantId: (id: string | null) => void
}

export function useTenantMutations({
  navigate,
  startImpersonation,
  fetchTenants,
  setIsDialogOpen,
  setFormData,
  setEditingTenantId
}: UseTenantMutationsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateTenant = async (
    e: React.FormEvent,
    formData: any,
    editingTenantId: string | null,
    originalDeviceType: string | undefined
  ) => {
    e.preventDefault()
    
    let migrateLegacyUsers = false;
    if (editingTenantId && formData.primaryDeviceType !== originalDeviceType) {
      const result = await MySwal.fire({
        title: 'Migrate Users?',
        text: 'You have changed the Primary Device Type. Do you want to migrate existing users from the old default profile to the new default profile?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, migrate them',
        cancelButtonText: 'No, just update'
      })
      if (result.isConfirmed) migrateLegacyUsers = true;
    }

    setIsLoading(true)
    try {
      if (editingTenantId) {
        const payload: any = { ...formData, migrateLegacyUsers }
        // Admin fields are not updated through this endpoint
        delete payload.adminEmail
        delete payload.adminPassword
        await api.put(`/tenants/${editingTenantId}`, payload)
      } else {
        await api.post("/tenants", formData)
      }
      setIsDialogOpen(false)
      setFormData({ name: "", maxUsers: 100, maxNas: 1, status: "active", primaryDeviceType: "mikrotik", defaultRegisterProfile: "", adminEmail: "", adminPassword: "", telegramChatId: "", telegramEnabled: false })
      setEditingTenantId(null)
      toast.success(editingTenantId ? "Tenant updated successfully!" : "Tenant created successfully!")
      fetchTenants()
    } catch (error: any) {
      console.error("Failed to create tenant:", error)
      toast.error(error.response?.data?.error || "Failed to create tenant")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTenant = async (tenant: TenantData) => {
    const isSuspended = tenant.status === "suspended";
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: isSuspended ? "Do you want to activate this tenant?" : "Do you want to suspend this tenant?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isSuspended ? '#10b981' : '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: isSuspended ? 'Yes, activate!' : 'Yes, suspend it!'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/tenants/${tenant.id}`)
        toast.success(isSuspended ? "Tenant activated successfully!" : "Tenant suspended successfully!")
        fetchTenants()
      } catch (error: any) {
        console.error("Failed to toggle tenant status:", error)
        toast.error(error.response?.data?.error || "Failed to change tenant status")
      }
    }
  }

  const handleImpersonate = async (tenant: TenantData) => {
    if (tenant.status === "suspended") {
      toast.error("Cannot impersonate a suspended tenant")
      return
    }
    try {
      const res = await api.post("/auth/impersonate", { tenantId: tenant.id })
      startImpersonation(res.data.token, res.data.user, res.data.tenantName)
      toast.success(`Now managing: ${tenant.name}`)
      navigate("/")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to impersonate tenant")
    }
  }

  return {
    isLoading,
    handleCreateTenant,
    handleDeleteTenant,
    handleImpersonate
  }
}
