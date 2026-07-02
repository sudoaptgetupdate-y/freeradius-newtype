import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { CardHeader } from "@/components/ui/card"

interface TenantFilterBarProps {
  searchQuery: string
  setSearchQuery: (v: string) => void
}

export function TenantFilterBar({
  searchQuery,
  setSearchQuery
}: TenantFilterBarProps) {
  const { t } = useTranslation()

  return (
    <CardHeader className="pb-3 px-4 sm:px-6">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder={t('tenants.search')}
          className="pl-9 bg-accent/30 border-transparent focus-visible:bg-background h-10 rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </CardHeader>
  )
}
