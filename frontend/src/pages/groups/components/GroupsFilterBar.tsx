import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GroupsFilterBarProps {
  user: any
  isImpersonating: boolean
  search: string
  setSearch: (val: string) => void
  selectedTenantFilter: string
  setSelectedTenantFilter: (val: string) => void
  tenants: {id: string, name: string}[]
  setIsAddOpen: (val: boolean) => void
  setFormData: (val: any) => void
}

export function GroupsFilterBar({
  user,
  isImpersonating,
  search,
  setSearch,
  selectedTenantFilter,
  setSelectedTenantFilter,
  tenants,
  setIsAddOpen,
  setFormData
}: GroupsFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            className="pl-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {user?.role === "super_admin" && !isImpersonating && (
          <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {tenants.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Button onClick={() => {
        setFormData({ name: "", defaultProfile: "none", description: "", tenantId: "" })
        setIsAddOpen(true)
      }}>
        <Plus className="mr-2 h-4 w-4" />
        Create Group
      </Button>
    </div>
  )
}
