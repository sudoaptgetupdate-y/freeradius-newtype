import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"

export type TenantData = {
  id: string
  name: string
  maxUsers: number
  maxNas: number
  status: string
  primaryDeviceType?: "mikrotik" | "fortigate" | "standard"
  defaultRegisterProfile?: string | null
  createdAt: string
  telegramChatId?: string
  telegramEnabled?: boolean
}

export function useTenantsData() {
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const fetchTenants = useCallback(async () => {
    try {
      const response = await api.get("/tenants")
      setTenants(response.data)
    } catch (error) {
      console.error("Failed to fetch tenants:", error)
    }
  }, [])

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await api.get("/profiles")
      setProfiles(res.data)
    } catch (error) {
      console.error("Failed to fetch profiles:", error)
    }
  }, [])

  useEffect(() => {
    fetchTenants()
    fetchProfiles()
  }, [fetchTenants, fetchProfiles])

  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return {
    tenants,
    filteredTenants,
    profiles,
    searchQuery,
    setSearchQuery,
    fetchTenants
  }
}
