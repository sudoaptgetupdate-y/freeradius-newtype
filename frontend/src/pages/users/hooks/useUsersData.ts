import { useState, useCallback } from "react"
import api from "@/lib/api"
import type {  ProfileData, GroupData, TenantData  } from "@/types/user"

export function useUsersData(user: any) {
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [groups, setGroups] = useState<GroupData[]>([])
  const [tenants, setTenants] = useState<TenantData[]>([])

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await api.get("/profiles")
      setProfiles(response.data)
    } catch (error) {
      console.error("Failed to fetch profiles", error)
    }
  }, [])

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get("/groups")
      setGroups(response.data)
    } catch (error) {
      console.error("Failed to fetch groups", error)
    }
  }, [])

  const fetchTenants = useCallback(async (setDefaultTenant?: (id: string) => void) => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      try {
        const response = await api.get("/tenants")
        const tenantData = response.data
        setTenants(tenantData)
        if (tenantData.length === 1 && setDefaultTenant) {
          setDefaultTenant(tenantData[0].id)
        }
      } catch (error) {
        console.error("Failed to fetch tenants", error)
      }
    }
  }, [user?.role])

  return {
    profiles,
    groups,
    tenants,
    fetchProfiles,
    fetchGroups,
    fetchTenants
  }
}
