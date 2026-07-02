import { useState, useCallback, useMemo } from "react"
import api from "@/lib/api"
import type {  UserData  } from "@/types/user"
import { usePagination } from "@/hooks/use-pagination"

export function useUsers() {
  const [users, setUsers] = useState<UserData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all")
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const fetchUsers = useCallback(async (isTrash: boolean = false) => {
    try {
      const response = await api.get(`/users${isTrash ? "?showDeleted=true" : ""}`)
      setUsers(response.data.users)
    } catch (error) {
      console.error("Failed to fetch users", error)
    }
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.mac.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = 
        statusFilter === "all" || 
        statusFilter === "bin" ||
        (statusFilter === "online" && user.isOnline) ||
        (statusFilter === "offline" && !user.isOnline) ||
        (statusFilter === "suspended" && user.isSuspended);
      const matchesTenant = selectedTenantFilter === "all" || user.tenantId === selectedTenantFilter;
      const matchesGroup = selectedGroupFilter === "all" || user.groupId === selectedGroupFilter;
      
      return matchesSearch && matchesStatus && matchesTenant && matchesGroup;
    })
  }, [users, searchQuery, statusFilter, selectedTenantFilter, selectedGroupFilter])

  const pagination = usePagination(filteredUsers)

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(pagination.paginatedData.map((u: UserData) => u.username))
    } else {
      setSelectedUsers([])
    }
  }

  const toggleSelectUser = (username: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, username])
    } else {
      setSelectedUsers(prev => prev.filter(u => u !== username))
    }
  }

  return {
    users,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedGroupFilter,
    setSelectedGroupFilter,
    selectedTenantFilter,
    setSelectedTenantFilter,
    selectedUsers,
    setSelectedUsers,
    fetchUsers,
    filteredUsers,
    toggleSelectAll,
    toggleSelectUser,
    pagination
  }
}
