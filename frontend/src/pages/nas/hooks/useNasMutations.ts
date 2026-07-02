import { useState } from "react"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import api from "@/lib/api"
import type { NasData } from "./useNasData"

const MySwal = withReactContent(Swal)

interface UseNasMutationsProps {
  user: any
  isImpersonating: boolean
  fetchNas: () => void
  setIsDialogOpen: (v: boolean) => void
  setFormData: (data: any) => void
  setEditingId: (id: number | null) => void
}

export function useNasMutations({
  user,
  isImpersonating,
  fetchNas,
  setIsDialogOpen,
  setFormData,
  setEditingId
}: UseNasMutationsProps) {
  const [saving, setSaving] = useState(false)

  const handleCreateNas = async (
    e: React.FormEvent, 
    formData: any, 
    editingId: number | null
  ) => {
    e.preventDefault()
    
    if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && !formData.tenantId) {
      toast.error("Please select a Tenant from the dropdown before saving.")
      return
    }

    setSaving(true)
    try {
      const payload: any = { ...formData }
      // In Impersonation Mode, tenantId might be an empty string, so we must omit it
      // so the backend doesn't throw a UUID validation error. The backend will use the Impersonated Token's tenantId.
      if (!payload.tenantId) {
        delete payload.tenantId
      }
      
      if (editingId) {
        await api.put(`/nas/${editingId}`, payload)
      } else {
        await api.post("/nas", payload)
      }
      
      setIsDialogOpen(false)
      setFormData({ nasname: "", shortname: "", type: "mikrotik", secret: "", tenantId: "", apiUsername: "", apiPasswordEncrypted: "" })
      setEditingId(null)
      toast.success(editingId ? "NAS updated successfully!" : "NAS created successfully!")
      fetchNas() // Refresh list
    } catch (error: any) {
      console.error(editingId ? "Failed to update NAS:" : "Failed to create NAS:", error)
      const errorMsgStr = error.response?.data?.message || error.response?.data?.error || (editingId ? "Failed to update NAS" : "Failed to create NAS")
      toast.error(typeof errorMsgStr === 'string' ? errorMsgStr : JSON.stringify(errorMsgStr))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNas = async (id: number) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: "Do you want to delete this router?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/nas/${id}`)
        toast.success("NAS deleted successfully!")
        fetchNas()
      } catch (error: any) {
        console.error("Failed to delete NAS:", error)
        toast.error(error.response?.data?.error || "Failed to delete NAS")
      }
    }
  }

  const handleTestApi = async (id: number) => {
    try {
      MySwal.fire({
        title: 'Testing Connection...',
        text: 'Please wait while we connect to the router API.',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading()
        }
      })
      const response = await api.get(`/nas/${id}/status`)
      const data = response.data.data
      let info = "Connection Successful!"
      if (data && data.uptime) {
        info = `Uptime: ${data.uptime} | CPU Load: ${data['cpu-load']}% | Free Mem: ${(data['free-memory'] / 1024 / 1024).toFixed(2)} MB`
      }
      MySwal.fire({
        title: 'Success!',
        text: info,
        icon: 'success'
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Connection failed"
      MySwal.fire({
        title: 'API Test Failed',
        text: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
        icon: 'error'
      })
    }
  }

  return {
    saving,
    handleCreateNas,
    handleDeleteNas,
    handleTestApi
  }
}
