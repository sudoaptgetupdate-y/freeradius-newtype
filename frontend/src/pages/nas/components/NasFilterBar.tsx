import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardHeader } from "@/components/ui/card"

interface NasFilterBarProps {
  user: any
  isImpersonating: boolean
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedTenantFilter: string
  setSelectedTenantFilter: (v: string) => void
  tenants: {id: string, name: string}[]
}

export function NasFilterBar({
  user,
  isImpersonating,
  searchQuery,
  setSearchQuery,
  selectedTenantFilter,
  setSelectedTenantFilter,
  tenants
}: NasFilterBarProps) {
  const { t } = useTranslation()

  return (
    <CardHeader className="pb-3 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('nas.search')}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {user?.role === "super_admin" && !isImpersonating && (
          <div className="w-full sm:w-64 flex items-center gap-2">
            <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </CardHeader>
  )
}
