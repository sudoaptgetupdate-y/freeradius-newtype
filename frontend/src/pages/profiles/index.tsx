import { useState } from "react"
import { Plus, Trash2, ShieldCheck, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { DataTablePagination } from "@/components/data-table-pagination"
import { ErrorBoundary } from "react-error-boundary"
import { useProfilesData, type ProfileData } from "./hooks/useProfilesData"
import { CreateEditProfileDialog } from "./components/dialogs/CreateEditProfileDialog"

function ProfilesContent() {
  const { user, isImpersonating } = useAuth()
  const {
    filteredProfiles,
    selectedTenantFilter,
    setSelectedTenantFilter,
    tenants,
    dictionary,
    fetchProfiles,
    handleDeleteProfile,
    pagination: {
      currentPage,
      setCurrentPage,
      pageSize,
      setPageSize,
      paginatedData,
      totalPages,
      totalItems
    }
  } = useProfilesData()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [profileToEdit, setProfileToEdit] = useState<ProfileData | null>(null)

  const handleOpenCreate = () => {
    setProfileToEdit(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (profile: ProfileData) => {
    setProfileToEdit(profile)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Internet Packages</h2>
          <p className="text-muted-foreground">Create and manage RADIUS profiles (speed limits, time quotas).</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </div>

      <Card>
        {user?.role === "super_admin" && !isImpersonating && (
          <div className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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
            </div>
          </div>
        )}
        <CardContent className="pt-0 sm:pt-6 p-4 sm:p-6 flex flex-col min-h-[540px]">
          <div className="rounded-md border overflow-auto max-h-[420px]">
            <Table className="min-w-[700px] sm:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  {user?.role === "super_admin" && !isImpersonating && (
                    <TableHead>Tenant / Site</TableHead>
                  )}
                  <TableHead>Speed (DL/UL)</TableHead>
                  <TableHead>Time Limit (Sec)</TableHead>
                  <TableHead>Shared Devices</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === "super_admin" && !isImpersonating ? 6 : 5} className="h-24 text-center text-muted-foreground">
                      No packages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((profile, index) => (
                    <TableRow key={`${profile.name}-${index}`} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                          {profile.name}
                        </div>
                      </TableCell>
                      {user?.role === "super_admin" && !isImpersonating && (
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-normal text-secondary-foreground">
                            {tenants.find(t => t.id === (profile as any).tenantId)?.name || 'Unknown'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        {profile.downloadSpeed && profile.uploadSpeed 
                          ? <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{profile.downloadSpeed} / {profile.uploadSpeed}</span>
                          : profile.vlanId 
                            ? <span className="font-mono bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded text-xs">VLAN: {profile.vlanId}</span>
                            : <span className="text-muted-foreground">Unlimited</span>}
                        {profile.advancedAttributes && profile.advancedAttributes.length > 0 && (
                          <span className="ml-2 font-mono bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded text-xs">+{profile.advancedAttributes.length} Attrs</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {profile.sessionTimeout ? `${profile.sessionTimeout}s` : <span className="text-muted-foreground">Unlimited</span>}
                      </TableCell>
                      <TableCell>
                        {profile.sharedUsers || 1}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(profile)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProfile(profile.name)}>
                          <Trash2 className="h-4 w-4" />
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
        </CardContent>
      </Card>

      <CreateEditProfileDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        profileToEdit={profileToEdit}
        tenants={tenants}
        dictionary={dictionary}
        onSuccess={fetchProfiles}
      />
    </div>
  )
}

export function ProfilesPage() {
  return (
    <ErrorBoundary fallback={<div className="p-4 text-red-500">Something went wrong in Profiles.</div>}>
      <ProfilesContent />
    </ErrorBoundary>
  )
}
