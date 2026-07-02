import { useTranslation } from "react-i18next"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {  TenantData, GroupData  } from "@/types/user"

interface UserFilterBarProps {
  user: any
  isImpersonating: boolean
  tenants: TenantData[]
  groups: GroupData[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedTenantFilter: string
  setSelectedTenantFilter: (id: string) => void
  selectedGroupFilter: string
  setSelectedGroupFilter: (id: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  selectedUsers: string[]
  handleBulkAction: (action: 'suspend' | 'enable' | 'delete' | 'transfer' | 'restore' | 'hard_delete') => void
}

export function UserFilterBar({
  user,
  isImpersonating,
  tenants,
  groups,
  searchQuery,
  setSearchQuery,
  selectedTenantFilter,
  setSelectedTenantFilter,
  selectedGroupFilter,
  setSelectedGroupFilter,
  statusFilter,
  setStatusFilter,
  selectedUsers,
  handleBulkAction
}: UserFilterBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
      
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/30 border border-border/50 rounded-lg">
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
    </div>
  )
}
