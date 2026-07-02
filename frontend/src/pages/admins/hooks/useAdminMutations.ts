import { useState } from "react"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export type AdminFormData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  password?: string
  status: string
  role: string
  tenantId: string
}

export function useAdminMutations(fetchAdmins: () => void) {
  const { user, isImpersonating } = useAuth()
  const MySwal = withReactContent(Swal)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<AdminFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    status: "active",
    role: "tenant_admin",
    tenantId: ""
  })

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validations
    if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && !formData.tenantId && (formData.role === "tenant_admin" || formData.role === "tenant_staff")) {
      toast.error("Please select a Tenant Site for this role.")
      return
    }

    if (!editingId && !formData.password) {
      toast.error("Password is required for new users.")
      return
    }

    setIsLoading(true)
    try {
      const payload: any = { ...formData }
      if (!payload.tenantId || payload.role === "super_admin" || payload.role === "master_staff") {
        delete payload.tenantId
      }
      if (!payload.password) {
        delete payload.password
      }
      
      if (editingId) {
        await api.put(`/admins/${editingId}`, payload)
      } else {
        await api.post("/admins", payload)
      }
      
      setIsDialogOpen(false)
      setFormData({ firstName: "", lastName: "", phone: "", email: "", password: "", status: "active", role: "tenant_admin", tenantId: "" })
      setEditingId(null)
      toast.success(editingId ? "User updated successfully!" : "User created successfully!")
      fetchAdmins()
    } catch (error: any) {
      console.error(editingId ? "Failed to update User:" : "Failed to create User:", error)
      const errorMsg = error.response?.data?.message || error.response?.data?.error || (editingId ? "Failed to update User" : "Failed to create User")
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({ firstName: "", lastName: "", phone: "", email: "", password: "", status: "active", role: "tenant_admin", tenantId: "" })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (admin: any) => {
    setEditingId(admin.id)
    setFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      phone: admin.phone || "",
      email: admin.email,
      password: "", // empty for update
      status: admin.status,
      role: admin.role,
      tenantId: admin.tenantId || ""
    })
    setIsDialogOpen(true)
  }

  const handleDeleteAdmin = async (id: string, email: string) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the user ${email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/admins/${id}`)
        toast.success("User deleted successfully!")
        fetchAdmins()
      } catch (error: any) {
        console.error("Failed to delete admin:", error)
        toast.error(error.response?.data?.error || "Failed to delete user")
      }
    }
  }

  return {
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
  }
}
