import { Plus, Settings, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VoucherFilterBarProps {
  user: any
  isImpersonating: boolean
  tenants: {id: string, name: string}[]
  selectedTenantFilter: string
  setSelectedTenantFilter: (val: string) => void
  fetchBatches: () => void
  setIsSettingsDialogOpen: (val: boolean) => void
  handleOpenCreate: () => void
}

export function VoucherFilterBar({
  user,
  isImpersonating,
  tenants,
  selectedTenantFilter,
  setSelectedTenantFilter,
  fetchBatches,
  setIsSettingsDialogOpen,
  handleOpenCreate
}: VoucherFilterBarProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vouchers</h2>
          <p className="text-muted-foreground">Generate and manage printable internet vouchers.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)} className="w-full sm:w-auto">
            <Settings className="mr-2 h-4 w-4" />
            Template Settings
          </Button>
          <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Generate Vouchers
          </Button>
        </div>
      </div>

      <div className="flex flex-row justify-between items-center gap-4 pt-4 sm:pt-6">
        {user?.role === "super_admin" && !isImpersonating ? (
          <div className="w-full sm:w-64">
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
        ) : (
          <div />
        )}
        <Button variant="outline" size="sm" onClick={fetchBatches} className="shrink-0">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </>
  )
}
