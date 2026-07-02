import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"

export type NasData = {
  id: number
  tenantId: string
  nasname: string
  shortname: string
  type: string
  secret: string
  apiUsername?: string
  apiPasswordEncrypted?: string
}

export function useNasData(user: any) {
  const [nasList, setNasList] = useState<NasData[]>([])
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)

  const fetchNas = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/nas")
      setNasList(response.data)
    } catch (error) {
      console.error("Failed to fetch NAS:", error)
      toast.error("Failed to load routers")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchTenants = useCallback(async (setFormDataCallback?: (id: string) => void) => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      try {
        const response = await api.get("/tenants")
        const tenantData = response.data
        setTenants(tenantData)
        if (tenantData.length === 1 && setFormDataCallback) {
          setFormDataCallback(tenantData[0].id)
        }
      } catch (error) {
        console.error("Failed to fetch tenants:", error)
      }
    }
  }, [user?.role])

  useEffect(() => {
    fetchNas()
    fetchTenants()
  }, [fetchNas, fetchTenants])

  const filteredNas = nasList.filter(nas => {
    const matchesSearch = nas.nasname.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          nas.shortname.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = selectedTenantFilter === "all" || nas.tenantId === selectedTenantFilter;
    return matchesSearch && matchesTenant;
  })

  return {
    nasList,
    filteredNas,
    tenants,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedTenantFilter,
    setSelectedTenantFilter,
    fetchNas,
    fetchTenants
  }
}
