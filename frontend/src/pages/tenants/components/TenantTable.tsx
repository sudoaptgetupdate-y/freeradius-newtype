import { Building2, Edit, LogIn, Power, PowerOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TenantData } from "../hooks/useTenantsData"

interface TenantTableProps {
  paginatedData: TenantData[]
  handleOpenEdit: (tenant: TenantData) => void
  handleDeleteTenant: (tenant: TenantData) => void
  handleImpersonate: (tenant: TenantData) => void
}

export function TenantTable({
  paginatedData,
  handleOpenEdit,
  handleDeleteTenant,
  handleImpersonate
}: TenantTableProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-border/50 overflow-auto bg-background/50 max-h-[420px]">
      <Table className="min-w-[700px] sm:min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">{t('tenants.colName')}</TableHead>
            <TableHead>{t('tenants.colCapacity')}</TableHead>
            <TableHead>{t('tenants.colStatus')}</TableHead>
            <TableHead className="text-right">{t('tenants.colActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No tenants found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((tenant) => (
              <TableRow key={tenant.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    {tenant.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    Users: <span className="font-mono">{tenant.maxUsers}</span> | NAS: <span className="font-mono">{tenant.maxNas}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {tenant.status === "active" ? (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                      {t('tenants.statusActive')}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      {t('tenants.statusSuspended')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleImpersonate(tenant)}
                    title={`Manage ${tenant.name}`}
                  >
                    <LogIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(tenant)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-8 w-8 ${tenant.status === 'suspended' ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-destructive hover:bg-destructive/10'}`}
                    onClick={() => handleDeleteTenant(tenant)}
                    title={tenant.status === 'suspended' ? 'Activate Tenant' : 'Suspend Tenant'}
                  >
                    {tenant.status === "suspended" ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
