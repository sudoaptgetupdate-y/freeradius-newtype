import { Edit, Trash2, Building, Mail } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { useAuth } from "@/contexts/auth-context"
import type { AdminData, TenantData } from "../hooks/useAdminsData"

interface AdminsTableProps {
  paginatedData: AdminData[]
  tenants: TenantData[]
  currentPage: number
  setCurrentPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  totalPages: number
  totalItems: number
  handleOpenEdit: (admin: AdminData) => void
  handleDeleteAdmin: (id: string, email: string) => void
}

export function AdminsTable({
  paginatedData,
  tenants,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalPages,
  totalItems,
  handleOpenEdit,
  handleDeleteAdmin
}: AdminsTableProps) {
  const { t } = useTranslation()
  const { user, isImpersonating } = useAuth()

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'super_admin': return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'master_staff': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'tenant_admin': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'tenant_staff': return 'bg-green-500/10 text-green-600 border-green-500/20'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  return (
    <>
      <div className="rounded-md border overflow-auto max-h-[420px]">
        <Table className="min-w-[700px] sm:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Admin User</TableHead>
              <TableHead>Role & Status</TableHead>
              {user?.role === "super_admin" && !isImpersonating && (
                <TableHead>{t('admins.colTenant')}</TableHead>
              )}
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">{t('admins.colActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={user?.role === "super_admin" && !isImpersonating ? 5 : 4} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((admin) => (
                <TableRow key={admin.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold">{admin.firstName} {admin.lastName}</span>
                      <span className="text-xs text-muted-foreground flex items-center mt-1">
                        <Mail className="mr-1 h-3 w-3" /> {admin.email}
                        {admin.phone && <span className="ml-2">({admin.phone})</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant="outline" className={getRoleBadgeColor(admin.role)}>
                        {admin.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant={admin.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-4">
                        {admin.status.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  {user?.role === "super_admin" && !isImpersonating && (
                    <TableCell>
                      {admin.tenantId ? (
                        <span className="flex items-center text-sm">
                          <Building className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                          {tenants.find(t => t.id === admin.tenantId)?.name || "Unknown"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">System Wide</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground">
                    {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(admin)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                      onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                      disabled={admin.id === user?.id} // Cannot delete self
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
    </>
  )
}
