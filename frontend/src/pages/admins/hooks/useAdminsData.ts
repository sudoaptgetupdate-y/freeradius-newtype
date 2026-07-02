import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { usePagination } from "@/hooks/use-pagination"

export type AdminData = {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  email: string
  status: string
  role: string
  tenantId: string | null
  lastLoginAt: string | null
  createdAt: string
}

export type TenantData = {
  id: string
  name: string
}

export function useAdminsData() {
  const { user } = useAuth()
  
  const [adminsList, setAdminsList] = useState<AdminData[]>([])
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await api.get("/admins")
      setAdminsList(response.data)
    } catch (error) {
      console.error("Failed to fetch admins:", error)
    }
  }, [])

  const fetchTenants = useCallback(async () => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      try {
        const response = await api.get("/tenants")
        setTenants(response.data)
      } catch (error) {
        console.error("Failed to fetch tenants:", error)
      }
    }
  }, [user])

  useEffect(() => {
    fetchAdmins()
    fetchTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchAdmins, fetchTenants])

  const filteredAdmins = adminsList.filter(admin => 
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    admin.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pagination = usePagination(filteredAdmins)

  return {
    adminsList,
    tenants,
    searchQuery,
    setSearchQuery,
    filteredAdmins,
    pagination,
    fetchAdmins
  }
}
