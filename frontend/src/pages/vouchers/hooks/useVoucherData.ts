import { useState, useCallback } from "react"
import api from "@/lib/api"
import type { Profile, VoucherSettings } from "@/types/voucher"

export function useVoucherData(user: any) {
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [settings, setSettings] = useState<VoucherSettings>({
    defaultPrefix: "",
    logoUrl: "",
    headerText: "",
    ssidName: "",
    footerText: ""
  })

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
        console.error("Failed to fetch tenants:", error)
      }
    }
  }, [user?.role])

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await api.get("/profiles")
      setProfiles(response.data)
    } catch (error) {
      console.error("Failed to fetch profiles:", error)
    }
  }, [])

  const fetchSettings = useCallback(async (tenantIdToFetch?: string) => {
    try {
      const url = tenantIdToFetch ? `/vouchers/settings?tenantId=${tenantIdToFetch}` : "/vouchers/settings"
      const response = await api.get(url)
      setSettings({
        tenantId: response.data.tenantId || "",
        defaultPrefix: response.data.defaultPrefix || "",
        logoUrl: response.data.logoUrl || "",
        headerText: response.data.headerText || "",
        ssidName: response.data.ssidName || "",
        footerText: response.data.footerText || "",
        createdAt: response.data.createdAt || "",
        updatedAt: response.data.updatedAt || "",
      })
    } catch (error) {
      console.error("Failed to fetch voucher settings:", error)
    }
  }, [])

  return {
    tenants,
    profiles,
    settings,
    fetchTenants,
    fetchProfiles,
    fetchSettings
  }
}
