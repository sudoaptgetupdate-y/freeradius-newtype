import { useState, useEffect } from "react"
import Papa from "papaparse"
import { Search, Filter, MoreHorizontal, Plus, Edit, Trash2, LogOut, Loader2, User, Key, Building, Eye, Calendar, Clock, Database, Laptop, Layers, Upload, Download, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { usePagination } from "@/hooks/use-pagination"
import { DataTablePagination } from "@/components/data-table-pagination"

const formatToRadiusDate = (dateTimeLocalStr: string): string => {
  if (!dateTimeLocalStr) return "";
  const d = new Date(dateTimeLocalStr);
  if (isNaN(d.getTime())) return "";
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const day = pad(d.getDate());
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  
  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
};

const parseFromRadiusDate = (radiusDateStr: string): string => {
  if (!radiusDateStr) return "";
  const d = new Date(radiusDateStr);
  if (isNaN(d.getTime())) return "";
  
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type UserData = {
  id: string
  username: string
  mac: string
  ip: string
  dataUsage: string
  status: string
  isOnline: boolean
  isSuspended?: boolean
  profileName: string
  groupName?: string
  groupId?: string
  tenantId?: string
}

type ProfileData = {
  name: string
  tenantId?: string
}

export function UsersPage() {
  const { t } = useTranslation()
  const { user, isImpersonating } = useAuth()
  const MySwal = withReactContent(Swal)
  const [users, setUsers] = useState<UserData[]>([])
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [groups, setGroups] = useState<{id: string, name: string, tenantId: string}[]>([])
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all")
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    memberId: "",
    citizenId: "",
    email: "",
    phone: "",
    expiration: "",
    groupId: "",
    tenantId: ""
  })
  const [useMemberIdAsUsername, setUseMemberIdAsUsername] = useState(false)
  
  const [editFormData, setEditFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    memberId: "",
    citizenId: "",
    email: "",
    phone: "",
    expiration: "",
    groupId: "",
    tenantId: ""
  })
  
  // Bulk Import State
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [bulkImportData, setBulkImportData] = useState<any[]>([])
  const [isBulkImporting, setIsBulkImporting] = useState(false)
  
  const getCsvValue = (row: any, key: string): string => {
    if (!row) return "";
    const cleanKey = key.toLowerCase().replace(/[*]/g, '').trim();
    const foundKey = Object.keys(row).find(k => {
      const ck = k.toLowerCase().replace(/[*]/g, '').replace(/\(optional\)/g, '').replace(/\(required\)/g, '').trim();
      return ck === cleanKey;
    });
    return foundKey ? String(row[foundKey] || "").trim() : "";
  };

  const downloadBulkTemplate = () => {
    const headers = "Username*,Password*,First Name*,Last Name*,Member ID*,Citizen ID (Optional),Email (Optional),Phone (Optional),Expiration Date (Optional),Group Name (Optional)\n";
    const example1 = "john_doe,pass1234,John,Doe,MBR001,1100999999999,john@example.com,0812345678,2027-12-31T23:59,Standard Group\n";
    const example2 = "jane_smith,secret99,Jane,Smith,MBR002,,,,,VIP Group\n";
    const csvContent = headers + example1 + example2;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_users_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setBulkImportData(results.data);
      },
      error: (error: any) => {
        toast.error("Failed to parse CSV file: " + error.message);
      }
    });
    // Reset file input
    e.target.value = "";
  };

  const handleBulkSubmit = async () => {
    if (bulkImportData.length === 0) return;
    setIsBulkImporting(true);
    
    // Validate that all specified groups exist in database
    const missingGroups: string[] = [];
    bulkImportData.forEach(row => {
      const groupName = getCsvValue(row, "Group Name");
      if (groupName && !groups.some(g => g.name.toLowerCase() === groupName.toLowerCase())) {
        missingGroups.push(groupName);
      }
    });

    if (missingGroups.length > 0) {
      const uniqueMissing = Array.from(new Set(missingGroups));
      toast.error(`Import failed: The following groups do not exist in the database: ${uniqueMissing.join(", ")}. Please create them first.`);
      setIsBulkImporting(false);
      return;
    }

    // Map group name to groupId
    const groupMap = new Map(groups.map(g => [g.name.toLowerCase(), g.id]));
    
    const mappedUsers = bulkImportData.map(row => {
      const username = getCsvValue(row, "Username");
      const password = getCsvValue(row, "Password");
      const groupName = getCsvValue(row, "Group Name");
      
      let groupId = undefined;
      if (groupName) {
         groupId = groupMap.get(groupName.toLowerCase()) || undefined;
      }
      
      const expirationDate = getCsvValue(row, "Expiration Date");
      
      return {
        username: username,
        password: password,
        firstName: getCsvValue(row, "First Name") || undefined,
        lastName: getCsvValue(row, "Last Name") || undefined,
        memberId: getCsvValue(row, "Member ID") || undefined,
        citizenId: getCsvValue(row, "Citizen ID") || undefined,
        email: getCsvValue(row, "Email") || undefined,
        phone: getCsvValue(row, "Phone") || undefined,
        expiration: expirationDate ? formatToRadiusDate(expirationDate) : undefined,
        groupId: groupId
      };
    }).filter(u => u.username && u.password); // basic validation

    if (mappedUsers.length === 0) {
      toast.error("No valid users found in CSV. Username and Password are required.");
      setIsBulkImporting(false);
      return;
    }

    try {
      const response = await api.post("/users/bulk-import", { users: mappedUsers });
      toast.success(response.data.message || `Successfully imported users`);
      setIsBulkImportOpen(false);
      setBulkImportData([]);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to bulk import users");
    } finally {
      setIsBulkImporting(false);
    }
  };

  // User Details Statelog State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [userDetails, setUserDetails] = useState<any>(null)

  const handleOpenDetails = async (username: string) => {
    setIsDetailsOpen(true)
    setIsDetailsLoading(true)
    setUserDetails(null)
    try {
      let tenantIdQuery = ""
      if (user?.role === "super_admin" || user?.role === "admin") {
        const targetUser = users.find(u => u.username === username)
        if (targetUser && (targetUser as any).tenantId) {
          tenantIdQuery = `?tenantId=${(targetUser as any).tenantId}`
        }
      }
      const response = await api.get(`/users/${username}/details${tenantIdQuery}`)
      setUserDetails(response.data)
    } catch (error) {
      console.error("Failed to fetch user details:", error)
      toast.error("Failed to load user details")
      setIsDetailsOpen(false)
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const formatBytes = (bytesStr: string) => {
    const bytes = Number(bytesStr || 0)
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${seconds % 60}s`
  }

  const fetchUsers = async (isTrash: boolean = false) => {
    try {
      const response = await api.get(`/users${isTrash ? "?showDeleted=true" : ""}`)
      setUsers(response.data.users)
    } catch (error) {
      console.error("Failed to fetch users", error)
    }
  }

  const fetchProfiles = async () => {
    try {
      const response = await api.get("/profiles")
      setProfiles(response.data)
    } catch (error) {
      console.error("Failed to fetch profiles", error)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await api.get("/groups")
      setGroups(response.data)
    } catch (error) {
      console.error("Failed to fetch groups", error)
    }
  }

  const fetchTenants = async () => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      try {
        const response = await api.get("/tenants")
        const tenantData = response.data
        setTenants(tenantData)
        if (tenantData.length === 1 && !formData.tenantId) {
          setFormData(prev => ({...prev, tenantId: tenantData[0].id}))
        }
      } catch (error) {
        console.error("Failed to fetch tenants", error)
      }
    }
  }

  useEffect(() => {
    fetchUsers(statusFilter === "bin")
    fetchProfiles()
    fetchGroups()
    fetchTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((user?.role === "super_admin" || user?.role === "admin") && !formData.tenantId) {
      toast.error("Please select a Tenant before saving.")
      return
    }

    setIsLoading(true)
    
    try {
      const payload: any = { 
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        memberId: formData.memberId,
      }
      if (formData.citizenId) payload.citizenId = formData.citizenId
      if (formData.email) payload.email = formData.email
      if (formData.phone) payload.phone = formData.phone
      if (formData.expiration) payload.expiration = formatToRadiusDate(formData.expiration)
      if (formData.groupId && formData.groupId !== "none") payload.groupId = formData.groupId
      if (formData.tenantId) payload.tenantId = formData.tenantId

      await api.post("/users", payload)
      setIsDialogOpen(false)
      setFormData({ username: "", password: "", firstName: "", lastName: "", memberId: "", citizenId: "", email: "", phone: "", expiration: "", groupId: "", tenantId: "" })
      setUseMemberIdAsUsername(false)
      toast.success("User created successfully!")
      fetchUsers()
    } catch (error: any) {
      console.error("Failed to create user:", error)
      toast.error(error.response?.data?.error || "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenEdit = async (userObj: UserData) => {
    setIsLoading(true)
    try {
      let tenantIdQuery = ""
      if (user?.role === "super_admin" || user?.role === "admin") {
        if (userObj.tenantId) {
          tenantIdQuery = `?tenantId=${userObj.tenantId}`
        }
      }
      const response = await api.get(`/users/${userObj.username}/details${tenantIdQuery}`)
      const details = response.data
      setEditFormData({
        username: userObj.username,
        password: "",
        firstName: details.personalInfo?.firstName || "",
        lastName: details.personalInfo?.lastName || "",
        memberId: details.personalInfo?.memberId || "",
        citizenId: details.personalInfo?.citizenId || "",
        email: details.personalInfo?.email || "",
        phone: details.personalInfo?.phone || "",
        expiration: details.personalInfo?.expiration ? parseFromRadiusDate(details.personalInfo.expiration) : "",
        groupId: userObj.groupId || "none",
        tenantId: userObj.tenantId || ""
      })

      setIsEditUserOpen(true)
    } catch (error) {
      toast.error("Failed to load user data for editing")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        memberId: editFormData.memberId,
        citizenId: editFormData.citizenId,
        email: editFormData.email,
        phone: editFormData.phone,
        expiration: editFormData.expiration ? formatToRadiusDate(editFormData.expiration) : "",
      }
      if (editFormData.password) payload.password = editFormData.password
      
      if (editFormData.groupId && editFormData.groupId !== "none") {
         payload.groupId = editFormData.groupId
      } else if (editFormData.groupId === "none") {
         payload.groupId = null
      }
      
      await api.put(`/users/${editFormData.username}`, payload)
      toast.success("User updated successfully!")
      setIsEditUserOpen(false)
      fetchUsers()
    } catch (error: any) {
      console.error("Failed to update user:", error)
      toast.error(error.response?.data?.error || "Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (username: string) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete user ${username}?`,
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
          const targetUser = users.find(u => u.username === username)
          if (targetUser && (targetUser as any).tenantId) {
            tenantIdQuery = `?tenantId=${(targetUser as any).tenantId}`
          }
        }
        await api.delete(`/users/${username}${statusFilter === 'bin' ? '/permanent' : ''}${tenantIdQuery}`)
        toast.success(statusFilter === 'bin' ? "User permanently deleted!" : "User moved to trash!")
        fetchUsers(statusFilter === 'bin')
      } catch (error: any) {
        console.error("Failed to delete user:", error)
        toast.error(error.response?.data?.error || "Failed to delete user")
      }
    }
  }

  const handleRestoreUser = async (username: string) => {
    try {
      let tenantIdQuery = ""
      if (user?.role === "super_admin" || user?.role === "admin") {
        const targetUser = users.find(u => u.username === username)
        if (targetUser && (targetUser as any).tenantId) {
          tenantIdQuery = `?tenantId=${(targetUser as any).tenantId}`
        }
      }
      await api.post(`/users/${username}/restore${tenantIdQuery}`)
      toast.success("User restored successfully!")
      fetchUsers(statusFilter === 'bin')
    } catch (error: any) {
      console.error("Failed to restore user:", error)
      toast.error(error.response?.data?.error || "Failed to restore user")
    }
  }

  const handleBulkAction = async (action: 'suspend' | 'enable' | 'delete' | 'transfer' | 'restore' | 'hard_delete') => {
    if (selectedUsers.length === 0) return
    setIsLoading(true)
    try {
      if (action === 'restore' || action === 'hard_delete') {
        // Run individually since no bulk endpoint exists for these yet
        const promises = selectedUsers.map(username => {
          let tenantIdQuery = ""
          if (user?.role === "super_admin" || user?.role === "admin") {
            const targetUser = users.find(u => u.username === username)
            if (targetUser && (targetUser as any).tenantId) {
              tenantIdQuery = `?tenantId=${(targetUser as any).tenantId}`
            }
          }
          if (action === 'restore') return api.post(`/users/${username}/restore${tenantIdQuery}`)
          return api.delete(`/users/${username}/permanent${tenantIdQuery}`)
        })
        await Promise.all(promises)
      } else {
        const endpoint = action === 'suspend' ? 'bulk-disable' : action === 'enable' ? 'bulk-enable' : action === 'transfer' ? 'bulk-transfer' : 'bulk-delete'
        const payload: any = { usernames: selectedUsers }
        await api.post(`/users/${endpoint}`, payload)
      }
      toast.success(`Successfully processed bulk action`)
      setSelectedUsers([])
      fetchUsers(statusFilter === 'bin')
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to process bulk action`)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedData.map(u => u.username))
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

  const filteredUsers = users.filter(user => {
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

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData,
    totalPages,
    totalItems
  } = usePagination(filteredUsers)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('users.title')}</h2>
          <p className="text-muted-foreground">{t('users.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('users.addUser')}
          </Button>
        </div>
      </div>

      <div className="w-full">
        <Card>
          <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('users.search')}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {user?.role === "super_admin" && !isImpersonating && (
                <>
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                  <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="All Tenants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups
                    .filter(g => selectedTenantFilter === "all" || g.tenantId === selectedTenantFilter)
                    .map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setSelectedUsers([]); }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('users.filterAll')}</SelectItem>
                  <SelectItem value="online">{t('users.filterOnline')}</SelectItem>
                  <SelectItem value="offline">{t('users.filterOffline')}</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="bin">Trash Bin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 flex flex-col h-[540px]">
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 border border-border/50 rounded-lg">
              <span className="text-sm font-medium mx-2">{selectedUsers.length} selected</span>
              {statusFilter !== 'bin' ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('suspend')}>Suspend</Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('enable')}>Reactivate</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>Delete</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('restore')}>Restore</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleBulkAction('hard_delete')}>Permanently Delete</Button>
                </>
              )}
            </div>
          )}
          <div className="rounded-md border overflow-auto max-h-[420px]">
            <Table className="min-w-[800px] sm:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={selectedUsers.length > 0 && selectedUsers.length === paginatedData.length}
                      onCheckedChange={(c) => toggleSelectAll(!!c)}
                    />
                  </TableHead>
                  <TableHead>{t('users.colUsername')}</TableHead>
                  {user?.role === "super_admin" && !isImpersonating && (
                    <TableHead>Tenant / Site</TableHead>
                  )}
                  <TableHead>Group</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead className="hidden md:table-cell">{t('users.colMac')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('users.colIp')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('users.colDataUsage')}</TableHead>
                  <TableHead>{t('users.colStatus')}</TableHead>
                  <TableHead className="text-right">{t('users.colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === "super_admin" && !isImpersonating ? 10 : 9} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Checkbox 
                          checked={selectedUsers.includes(u.username)}
                          onCheckedChange={(c) => toggleSelectUser(u.username, !!c)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <span
                          className={`font-semibold cursor-pointer hover:underline transition-colors ${
                            u.isOnline 
                              ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300" 
                              : "text-muted-foreground/80 hover:text-foreground"
                          }`}
                          onClick={() => handleOpenDetails(u.username)}
                        >
                          {u.username}
                        </span>
                      </TableCell>
                      {user?.role === "super_admin" && !isImpersonating && (
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {tenants.find(t => t.id === u.tenantId)?.name || 'Unknown'}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell><Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{u.groupName || "-"}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{u.profileName}</Badge></TableCell>
                      <TableCell className={`font-mono text-xs hidden md:table-cell ${u.isOnline ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>{u.mac}</TableCell>
                      <TableCell className={`font-mono text-xs hidden lg:table-cell ${u.isOnline ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>{u.ip}</TableCell>
                      <TableCell className={`hidden sm:table-cell ${u.isOnline ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground/60"}`}>{u.dataUsage}</TableCell>
                      <TableCell>
                        {u.isSuspended ? (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 px-2 py-0.5 font-medium inline-flex items-center gap-1.5 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                            Suspended
                          </Badge>
                        ) : u.isOnline ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5 font-medium inline-flex items-center gap-1.5 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t('users.statusOnline')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-muted px-2 py-0.5 font-medium inline-flex items-center gap-1.5 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                            {t('users.statusOffline')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {statusFilter !== 'bin' ? (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenDetails(u.username)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenEdit(u)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t('users.actionEdit')}
                                </DropdownMenuItem>
                                {u.isOnline && (
                                  <DropdownMenuItem className="text-orange-600 focus:text-orange-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t('users.actionDisconnect')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteUser(u.username)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('users.actionDelete')}
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => handleRestoreUser(u.username)}>
                                  <Layers className="mr-2 h-4 w-4" />
                                  Restore User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteUser(u.username)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Permanently Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[620px] md:max-w-[680px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
              Add User
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              Create a new user and assign a package.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col gap-5 px-5 sm:px-7 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {(user?.role === "super_admin" || user?.role === "admin") && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Label htmlFor="tenant" className="text-[14px] font-semibold text-foreground">Select Tenant</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val, groupId: ""})}>
                      <SelectTrigger id="tenant" className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-[13px] font-semibold text-foreground">First Name <span className="text-red-500">*</span></Label>
                      <Input id="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required placeholder="First name" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-[13px] font-semibold text-foreground">Last Name <span className="text-red-500">*</span></Label>
                      <Input id="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required placeholder="Last name" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="memberId" className="text-[13px] font-semibold text-foreground">Member ID <span className="text-red-500">*</span></Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="syncUsername" checked={useMemberIdAsUsername} onCheckedChange={(checked) => {
                            setUseMemberIdAsUsername(!!checked)
                            if (checked) setFormData(prev => ({...prev, username: prev.memberId}))
                          }} />
                          <label htmlFor="syncUsername" className="text-[12px] font-medium leading-none cursor-pointer text-muted-foreground">Use as Username</label>
                        </div>
                      </div>
                      <Input id="memberId" value={formData.memberId} onChange={e => {
                        const val = e.target.value
                        setFormData(prev => ({...prev, memberId: val, ...(useMemberIdAsUsername ? {username: val} : {})}))
                      }} required placeholder="E.g., ID card, student ID" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="citizenId" className="text-[13px] font-semibold text-foreground">Citizen ID</Label>
                      <Input id="citizenId" value={formData.citizenId} onChange={e => setFormData({...formData, citizenId: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[13px] font-semibold text-foreground">Email</Label>
                      <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-[13px] font-semibold text-foreground">Phone</Label>
                      <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Account Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-[13px] font-semibold text-foreground">Username <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="username" value={formData.username} disabled={useMemberIdAsUsername} onChange={e => setFormData({...formData, username: e.target.value})} required placeholder="Enter username" className={`pl-9 h-[40px] rounded-[8px] border-border text-[13px] ${useMemberIdAsUsername ? 'bg-muted/50 text-muted-foreground' : 'bg-background'}`} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-[13px] font-semibold text-foreground">Password <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="Enter password" className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                      </div>
                    </div>
                    {/* Select Group & Expire Date side-by-side */}
                    <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <Label htmlFor="group" className="text-[13px] font-semibold text-foreground">Group <span className="text-red-500">*</span></Label>
                      <div className="relative mt-1">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Select value={formData.groupId} onValueChange={(val) => setFormData({...formData, groupId: val})} required>
                          <SelectTrigger className="w-full pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background">
                            <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.filter(g => !g.tenantId || g.tenantId === formData.tenantId).map(g => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <Label htmlFor="expiration" className="text-[13px] font-semibold text-foreground">Expiration Date</Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="expiration" 
                          type={formData.expiration ? "datetime-local" : "text"} 
                          placeholder="No Expire" 
                          value={formData.expiration} 
                          onFocus={(e) => (e.target.type = "datetime-local")}
                          onBlur={(e) => {
                            if (!e.target.value) e.target.type = "text";
                          }}
                          onChange={e => setFormData({...formData, expiration: e.target.value})} 
                          className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background w-full" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || profiles.length === 0} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[620px] md:max-w-[680px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground">
              Edit User
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              Update password or reassign to a different group.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-5 sm:px-8 py-6 flex-1 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-firstName" className="text-[13px] font-semibold text-foreground">First Name <span className="text-red-500">*</span></Label>
                      <Input id="edit-firstName" value={editFormData.firstName} onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} required placeholder="First name" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-lastName" className="text-[13px] font-semibold text-foreground">Last Name <span className="text-red-500">*</span></Label>
                      <Input id="edit-lastName" value={editFormData.lastName} onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} required placeholder="Last name" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-memberId" className="text-[13px] font-semibold text-foreground">Member ID <span className="text-red-500">*</span></Label>
                      <Input id="edit-memberId" value={editFormData.memberId} onChange={e => setEditFormData({...editFormData, memberId: e.target.value})} required placeholder="E.g., student ID, employee ID" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-citizenId" className="text-[13px] font-semibold text-foreground">Citizen ID</Label>
                      <Input id="edit-citizenId" value={editFormData.citizenId} onChange={e => setEditFormData({...editFormData, citizenId: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-email" className="text-[13px] font-semibold text-foreground">Email</Label>
                      <Input id="edit-email" type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-phone" className="text-[13px] font-semibold text-foreground">Phone</Label>
                      <Input id="edit-phone" type="tel" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Account Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-foreground">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={editFormData.username} disabled className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-password" className="text-[13px] font-semibold text-foreground">New Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="edit-password" type="password" value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} placeholder="Leave blank to keep current" className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                      </div>
                    </div>
                    {/* Select Group & Expire Date side-by-side */}
                    <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <Label htmlFor="edit-group" className="text-[13px] font-semibold text-foreground">Group</Label>
                      <div className="relative mt-1">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Select value={editFormData.groupId} onValueChange={(val) => setEditFormData({...editFormData, groupId: val})}>
                          <SelectTrigger className="w-full pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background">
                            <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Group</SelectItem>
                            {groups.filter(g => !g.tenantId || g.tenantId === editFormData.tenantId).map(g => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">Changing group updates Profile automatically.</p>
                    </div>

                    <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <Label htmlFor="edit-expiration" className="text-[13px] font-semibold text-foreground">Expiration Date</Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="edit-expiration" 
                          type={editFormData.expiration ? "datetime-local" : "text"} 
                          placeholder="No Expire" 
                          value={editFormData.expiration} 
                          onFocus={(e) => (e.target.type = "datetime-local")}
                          onBlur={(e) => {
                            if (!e.target.value) e.target.type = "text";
                          }}
                          onChange={e => setEditFormData({...editFormData, expiration: e.target.value})} 
                          className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background w-full" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsEditUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
              User Details: {userDetails?.username || "Loading..."}
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              Deep insights and session history for this user.
            </DialogDescription>
          </DialogHeader>

          {isDetailsLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userDetails ? (
            <div className="px-5 sm:px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Summary Badges */}
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="text-sm px-3 py-1 bg-primary/5 text-primary border-primary/20">
                  <Layers className="h-3.5 w-3.5 mr-1.5 inline" />
                  Group: {userDetails.groupName || "None"}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Profile: {userDetails.profileName}
                </Badge>
                {userDetails.activeSession ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-sm px-3 py-1">
                    Online
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm px-3 py-1 text-muted-foreground">
                    Offline
                  </Badge>
                )}
              </div>

              {/* Personal Information */}
              <div className="bg-muted/10 border border-border/50 p-4 rounded-xl space-y-3">
                <h4 className="font-semibold text-foreground text-sm flex items-center">
                  <User className="mr-2 h-4 w-4 text-primary" /> Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                  <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">First Name</span> <span className="font-medium">{userDetails.personalInfo?.firstName || "-"}</span></div>
                  <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Last Name</span> <span className="font-medium">{userDetails.personalInfo?.lastName || "-"}</span></div>
                  <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Member ID</span> <span className="font-mono">{userDetails.personalInfo?.memberId || "-"}</span></div>
                  <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Citizen ID</span> <span className="font-mono">{userDetails.personalInfo?.citizenId || "-"}</span></div>
                  <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Email</span> <span>{userDetails.personalInfo?.email || "-"}</span></div>
                  <div><span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Phone</span> <span>{userDetails.personalInfo?.phone || "-"}</span></div>
                </div>
                {userDetails.personalInfo?.expiration && (
                  <div className="pt-3 mt-3 border-t border-border/50">
                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Account Expiration</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md inline-flex items-center mt-0.5">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      {userDetails.personalInfo.expiration}
                    </span>
                  </div>
                )}
              </div>

              {/* Active Session Info (If online) */}
              {userDetails.activeSession && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                  <h4 className="font-semibold text-emerald-700 text-sm flex items-center">
                    <Laptop className="mr-2 h-4 w-4" /> Active Connection Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-emerald-800">
                    <div>IP Address: <span className="font-mono">{userDetails.activeSession.framedipaddress || "-"}</span></div>
                    <div>MAC Address: <span className="font-mono">{userDetails.activeSession.callingstationid || "-"}</span></div>
                    <div>Started: <span className="font-mono">{new Date(userDetails.activeSession.acctstarttime).toLocaleString()}</span></div>
                    <div>NAS IP: <span className="font-mono">{userDetails.activeSession.nasipaddress}</span></div>
                  </div>
                </div>
              )}

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center space-x-3 bg-muted/20 border-border/50 shadow-none">
                  <Database className="h-8 w-8 text-primary/85" />
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total Data</p>
                    <p className="text-sm font-bold mt-0.5">{formatBytes(userDetails.stats.totalBytes)}</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center space-x-3 bg-muted/20 border-border/50 shadow-none">
                  <Clock className="h-8 w-8 text-primary/85" />
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Online Time</p>
                    <p className="text-sm font-bold mt-0.5">{formatDuration(userDetails.stats.totalDuration)}</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center space-x-3 bg-muted/20 border-border/50 shadow-none">
                  <Calendar className="h-8 w-8 text-primary/85" />
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Last Login</p>
                    <p className="text-sm font-bold mt-0.5">
                      {userDetails.stats.lastLogin ? new Date(userDetails.stats.lastLogin).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Used Devices (MAC addresses) */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Used MAC Addresses ({userDetails.macs.length})</h4>
                {userDetails.macs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No devices recorded.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {userDetails.macs.map((mac: string) => (
                      <Badge key={mac} variant="secondary" className="font-mono text-xs px-2.5 py-0.5">
                        {mac}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Sessions Table */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recent Login History (Last 5 Sessions)</h4>
                <div className="rounded-md border overflow-x-auto">
                  <Table className="min-w-[500px] text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>MAC Address</TableHead>
                        <TableHead>Termination Cause</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails.recentSessions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                            No history found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        userDetails.recentSessions.map((sess: any) => (
                          <TableRow key={sess.radacctid}>
                            <TableCell className="font-mono">{new Date(sess.acctstarttime).toLocaleString()}</TableCell>
                            <TableCell>{formatDuration(sess.acctsessiontime)}</TableCell>
                            <TableCell className="font-mono">{sess.framedipaddress || "-"}</TableCell>
                            <TableCell className="font-mono">{sess.callingstationid || "-"}</TableCell>
                            <TableCell className="text-muted-foreground">{sess.acctterminatecause || "Active"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No data.
            </div>
          )}
          <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Users Dialog */}
      <Dialog open={isBulkImportOpen} onOpenChange={(open) => {
        setIsBulkImportOpen(open);
        if (!open) setBulkImportData([]);
      }}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground">
              Bulk Import Users
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              Upload a CSV file to bulk create users. Download the template for the correct format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-5 sm:px-8 py-6 flex-1 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              
              {!bulkImportData.length ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-10 bg-muted/20">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                    Drag and drop your file here, or click to browse. Ensure your CSV matches the template format. Date format (Expiration Date) is YYYY-MM-DDTHH:mm.
                  </p>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={downloadBulkTemplate}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                    <div className="relative">
                      <Input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleBulkFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Button className="pointer-events-none">
                        <Upload className="mr-2 h-4 w-4" />
                        Browse File
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Preview Data ({bulkImportData.length} rows)</h3>
                    <Button variant="outline" size="sm" onClick={() => setBulkImportData([])}>
                      Clear Data
                    </Button>
                  </div>
                  <div className="rounded-md border overflow-hidden">
                    <Table className="min-w-[600px]">
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[50px]">Status</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Password</TableHead>
                          <TableHead>First Name</TableHead>
                          <TableHead>Group Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkImportData.slice(0, 50).map((row, i) => {
                          const username = getCsvValue(row, "Username");
                          const password = getCsvValue(row, "Password");
                          const firstName = getCsvValue(row, "First Name");
                          const groupName = getCsvValue(row, "Group Name");
                          const groupExists = groupName ? groups.some(g => g.name.toLowerCase() === groupName.toLowerCase()) : true;
                          const isValid = username && password && groupExists;
                          return (
                            <TableRow key={i}>
                              <TableCell>
                                {isValid ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                              </TableCell>
                              <TableCell className="font-medium">{username || <span className="text-red-500 italic">Missing</span>}</TableCell>
                              <TableCell>{password ? "********" : <span className="text-red-500 italic">Missing</span>}</TableCell>
                              <TableCell>{firstName || "-"}</TableCell>
                              <TableCell>
                                {groupName ? (
                                  <span className={groupExists ? "text-foreground" : "text-red-500 font-semibold"}>
                                    {groupName} {!groupExists && <span className="text-[11px] text-red-500 font-normal ml-1">(Not Found)</span>}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {bulkImportData.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Showing first 50 rows. Total {bulkImportData.length} rows will be imported.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsBulkImportOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkSubmit} 
                disabled={isBulkImporting || bulkImportData.length === 0} 
                className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20"
              >
                {isBulkImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {bulkImportData.length} Users
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
