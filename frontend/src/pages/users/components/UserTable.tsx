import { useTranslation } from "react-i18next"
import { Eye, Edit, LogOut, Trash2, Layers, MoreHorizontal } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTablePagination } from "@/components/data-table-pagination"
import type {  UserData, TenantData  } from "@/types/user"

interface UserTableProps {
  paginatedData: UserData[]
  user: any
  isImpersonating: boolean
  tenants: TenantData[]
  statusFilter: string
  selectedUsers: string[]
  toggleSelectAll: (checked: boolean) => void
  toggleSelectUser: (username: string, checked: boolean) => void
  handleOpenDetails: (username: string) => void
  handleOpenEdit: (user: UserData) => void
  handleDeleteUser: (username: string) => void
  handleRestoreUser: (username: string) => void
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
}

export function UserTable({
  paginatedData,
  user,
  isImpersonating,
  tenants,
  statusFilter,
  selectedUsers,
  toggleSelectAll,
  toggleSelectUser,
  handleOpenDetails,
  handleOpenEdit,
  handleDeleteUser,
  handleRestoreUser,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  setCurrentPage,
  setPageSize
}: UserTableProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full min-h-[500px]">
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
      <div className="mt-auto pt-4">
        <DataTablePagination 
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  )
}
