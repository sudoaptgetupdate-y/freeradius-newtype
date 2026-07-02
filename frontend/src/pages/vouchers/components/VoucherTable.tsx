import { Printer, Ticket } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/data-table-pagination"
import type { VoucherBatch } from "@/types/voucher"

interface VoucherTableProps {
  user: any
  isImpersonating: boolean
  tenants: {id: string, name: string}[]
  paginatedData: VoucherBatch[]
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  handlePrintBatch: (batchId: string) => void
}

export function VoucherTable({
  user,
  isImpersonating,
  tenants,
  paginatedData,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  setCurrentPage,
  setPageSize,
  handlePrintBatch
}: VoucherTableProps) {
  return (
    <div className="flex flex-col flex-1 h-[540px]">
      <div className="rounded-md border overflow-auto max-h-[420px]">
        <Table className="min-w-[700px] sm:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Created Date</TableHead>
              {user?.role === "super_admin" && !isImpersonating && (
                <TableHead>Tenant / Site</TableHead>
              )}
              <TableHead>Prefix</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Profile (Package)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={user?.role === "super_admin" && !isImpersonating ? 6 : 5} className="h-24 text-center text-muted-foreground">
                  No voucher batches found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((batch) => (
                <TableRow key={batch.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {new Date(batch.createdAt).toLocaleString()}
                  </TableCell>
                  {user?.role === "super_admin" && !isImpersonating && (
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-normal text-secondary-foreground">
                        {tenants.find(t => t.id === batch.tenantId)?.name || 'Unknown'}
                      </span>
                    </TableCell>
                  )}
                  <TableCell>
                    {batch.prefix ? <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{batch.prefix}</span> : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Ticket className="h-4 w-4 text-primary" />
                      {batch.amount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded">
                      {batch.groupname}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handlePrintBatch(batch.id)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
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
