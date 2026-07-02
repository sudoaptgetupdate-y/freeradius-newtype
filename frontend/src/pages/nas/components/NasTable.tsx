import { Server, Edit, Trash2 } from "lucide-react"
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
import type { NasData } from "../hooks/useNasData"

interface NasTableProps {
  user: any
  isImpersonating: boolean
  tenants: {id: string, name: string}[]
  paginatedData: NasData[]
  handleOpenEdit: (nas: NasData) => void
  handleDeleteNas: (id: number) => void
  handleTestApi: (id: number) => void
}

export function NasTable({
  user,
  isImpersonating,
  tenants,
  paginatedData,
  handleOpenEdit,
  handleDeleteNas,
  handleTestApi
}: NasTableProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-md border overflow-auto max-h-[420px]">
      <Table className="min-w-[700px] sm:min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">{t('nas.colName')}</TableHead>
            {user?.role === "super_admin" && !isImpersonating && (
              <TableHead>Tenant / Site</TableHead>
            )}
            <TableHead>{t('nas.colIp')}</TableHead>
            <TableHead>{t('nas.colType')}</TableHead>
            <TableHead>{t('nas.colSecret')}</TableHead>
            <TableHead className="text-right">{t('nas.colActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={user?.role === "super_admin" && !isImpersonating ? 6 : 5} className="h-24 text-center text-muted-foreground">
                No router/NAS devices found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((nas) => (
              <TableRow key={nas.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                    {nas.shortname}
                  </div>
                </TableCell>
                {user?.role === "super_admin" && !isImpersonating && (
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {tenants.find(t => t.id === nas.tenantId)?.name || 'Unknown'}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <span className="font-mono">{nas.nasname}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {nas.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {nas.secret.replace(/./g, '*')}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(nas)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteNas(nas.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {nas.type === 'mikrotik' && (
                    <Button variant="outline" size="sm" className="h-8 ml-2" onClick={() => handleTestApi(nas.id)}>
                      Test API
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
