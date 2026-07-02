import { format } from "date-fns"
import { Users, Eye, Edit2, ShieldOff, ArrowRightLeft, Trash2, MoreHorizontal, Loader2 } from "lucide-react"
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Group } from "../hooks/useGroupsData"

interface GroupsTableProps {
  user: any
  isImpersonating: boolean
  tenants: {id: string, name: string}[]
  filteredGroups: Group[]
  loading: boolean
  openDetails: (g: Group) => void
  openEdit: (g: Group) => void
  openTransfer: (g: Group) => void
  openBulkAction: (g: Group, action: 'suspend' | 'enable' | 'delete') => void
  openDelete: (g: Group) => void
}

export function GroupsTable({
  user,
  isImpersonating,
  tenants,
  filteredGroups,
  loading,
  openDetails,
  openEdit,
  openTransfer,
  openBulkAction,
  openDelete
}: GroupsTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Group Name</TableHead>
            {user?.role === "super_admin" && !isImpersonating && (
              <TableHead>Tenant</TableHead>
            )}
            <TableHead>Description</TableHead>
            <TableHead>Default Profile</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={user?.role === "super_admin" && !isImpersonating ? 7 : 6} className="h-24 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : filteredGroups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={user?.role === "super_admin" && !isImpersonating ? 7 : 6} className="h-24 text-center text-muted-foreground">
                No groups found.
              </TableCell>
            </TableRow>
          ) : (
            filteredGroups.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{g.name}</span>
                    {g.isSystem && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20" title="System Group (Cannot be deleted)">
                        SYSTEM
                      </span>
                    )}
                  </div>
                </TableCell>
                {user?.role === "super_admin" && !isImpersonating && (
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                      {tenants.find(t => t.id === g.tenantId)?.name || "Unknown"}
                    </span>
                  </TableCell>
                )}
                <TableCell>{g.description || "-"}</TableCell>
                <TableCell>
                  {g.defaultProfile ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                      {g.defaultProfile}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{g.userCount}</span>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(g.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDetails(g)} title="View Group Details">
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(g)} title="Edit Group">
                      <Edit2 className="h-4 w-4 text-blue-500" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openTransfer(g)} disabled={g.userCount === 0}>
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Transfer Users
                        </DropdownMenuItem>
                        
                        {g.userCount > 0 && (g.suspendedCount || 0) < g.userCount && (
                          <DropdownMenuItem className="text-orange-600 focus:text-orange-600" onClick={() => openBulkAction(g, 'suspend')}>
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Suspend All Users
                          </DropdownMenuItem>
                        )}
                        
                        {((g.suspendedCount && g.suspendedCount > 0) || (g.deletedCount && g.deletedCount > 0)) ? (
                          <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600" onClick={() => openBulkAction(g, 'enable')}>
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                            Reactivate All Users
                          </DropdownMenuItem>
                        ) : null}
                        
                        {g.userCount > 0 && (
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openBulkAction(g, 'delete')}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete All Users
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDelete(g)} disabled={g.userCount > 0 || g.isSystem}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
