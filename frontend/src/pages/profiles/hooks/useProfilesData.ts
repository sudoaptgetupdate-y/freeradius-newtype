import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { usePagination } from "@/hooks/use-pagination"

export type ProfileData = {
  name: string
  downloadSpeed: string
  uploadSpeed: string
  sessionTimeout: number | null
  sharedUsers: number | null
  vlanId?: string
  fortiGroupName?: string
  advancedAttributes?: { attribute: string, op: string, value: string, type: 'check' | 'reply' }[]
}

export function useProfilesData() {
  const { user } = useAuth()
  const MySwal = withReactContent(Swal)
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all")
  const [tenants, setTenants] = useState<{id: string, name: string, primaryDeviceType?: string, defaultRegisterProfile?: string | null}[]>([])
  const [dictionary, setDictionary] = useState<any[]>([])

  const filteredProfiles = profiles.filter(profile => {
    const matchesTenant = selectedTenantFilter === "all" || (profile as any).tenantId === selectedTenantFilter;
    return matchesTenant;
  })

  const pagination = usePagination(filteredProfiles)

  const fetchProfiles = async () => {
    try {
      const response = await api.get("/profiles")
      setProfiles(response.data)
    } catch (error) {
      console.error("Failed to fetch profiles:", error)
    }
  }

  const fetchTenants = async () => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      try {
        const response = await api.get("/tenants")
        setTenants(response.data)
      } catch (error) {
        console.error("Failed to fetch tenants:", error)
      }
    }
  }

  const fetchDictionary = async () => {
    try {
      const response = await api.get("/dictionary")
      setDictionary(response.data)
    } catch (error) {
      console.error("Failed to fetch dictionary:", error)
    }
  }

  useEffect(() => {
    fetchProfiles()
    fetchTenants()
    fetchDictionary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleDeleteProfile = async (name: string) => {
    let isDefault = false;
    if (user?.role === "super_admin" || user?.role === "admin") {
      const profile = profiles.find(p => p.name === name);
      if (profile && (profile as any).tenantId) {
        const tenant = tenants.find(t => t.id === (profile as any).tenantId);
        if (tenant && tenant.defaultRegisterProfile === name) {
          isDefault = true;
        }
      }
    } else {
      if ((user as any)?.defaultRegisterProfile === name) {
        isDefault = true;
      }
    }

    if (isDefault) {
      await MySwal.fire({
        title: 'Cannot Delete',
        text: `The profile "${name}" is currently set as the default registration profile. Please change the default profile in the tenant settings before deleting it.`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete profile ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        let tenantIdQuery = ""
        if (user?.role === "super_admin" || user?.role === "admin") {
          const profile = profiles.find(p => p.name === name)
          if (profile && (profile as any).tenantId) {
            tenantIdQuery = `&tenantId=${(profile as any).tenantId}`
          }
        }
        await api.delete(`/profiles?name=${encodeURIComponent(name)}${tenantIdQuery}`)
        toast.success("Profile deleted successfully!")
        fetchProfiles()
      } catch (error: any) {
        console.error("Failed to delete profile:", error)
        toast.error(error.response?.data?.error || "Failed to delete profile")
      }
    }
  }

  return {
    profiles,
    filteredProfiles,
    selectedTenantFilter,
    setSelectedTenantFilter,
    tenants,
    dictionary,
    fetchProfiles,
    handleDeleteProfile,
    pagination,
  }
}
