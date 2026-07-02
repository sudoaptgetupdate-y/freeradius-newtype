import { useState, useEffect, useCallback } from "react"
import { toast } from "react-toastify"
import api from "@/lib/api"

export interface Group {
  id: string
  name: string
  tenantId?: string
  defaultProfile: string | null
  description: string | null
  createdAt: string
  userCount: number
  suspendedCount?: number
  deletedCount?: number
  isSystem?: boolean
}

export interface Profile {
  id: number
  name: string
}

export function useGroupsData(user: any) {
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all")
  const [groups, setGroups] = useState<Group[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get("/groups")
      setGroups(res.data)
    } catch (error) {
      toast.error("Failed to load groups")
    }
  }, [])

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await api.get("/profiles")
      // Remove duplicates by groupname
      const uniqueProfiles = Array.from(new Map(res.data.map((p: any) => [p.name, p])).values()) as Profile[]
      setProfiles(uniqueProfiles)
    } catch (error) {
      toast.error("Failed to load profiles")
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
        toast.error("Failed to load tenants")
      }
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchGroups(), fetchProfiles(), fetchTenants()]).finally(() => setLoading(false))
  }, [user, fetchGroups, fetchProfiles, fetchTenants])

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesTenant = selectedTenantFilter === "all" || g.tenantId === selectedTenantFilter;
    return matchesSearch && matchesTenant;
  })

  return {
    groups,
    filteredGroups,
    profiles,
    tenants,
    loading,
    search,
    setSearch,
    selectedTenantFilter,
    setSelectedTenantFilter,
    fetchGroups,
    fetchTenants
  }
}
