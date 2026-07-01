import { useState, useEffect } from "react"
import { Users, Plus, Edit2, Trash2, ShieldOff, Search, Loader2, Eye, ArrowRightLeft, MoreHorizontal } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { toast } from "react-toastify"
import { format } from "date-fns"

interface Group {
  id: string
  name: string
  defaultProfile: string | null
  description: string | null
  createdAt: string
  userCount: number
  suspendedCount?: number
  deletedCount?: number
}

interface Profile {
  id: number
  name: string
}



export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isBulkSuspendOpen, setIsBulkSuspendOpen] = useState(false)
  const [isBulkEnableOpen, setIsBulkEnableOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [targetGroupId, setTargetGroupId] = useState<string>("")
  
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    defaultProfile: "none",
    description: "",
  })
  const [saving, setSaving] = useState(false)

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups")
      setGroups(res.data)
    } catch (error) {
      toast.error("Failed to load groups")
    }
  }

  const fetchProfiles = async () => {
    try {
      const res = await api.get("/profiles")
      // Remove duplicates by groupname
      const uniqueProfiles = Array.from(new Map(res.data.map((p: any) => [p.name, p])).values()) as Profile[]
      setProfiles(uniqueProfiles)
    } catch (error) {
      toast.error("Failed to load profiles")
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchGroups(), fetchProfiles()]).finally(() => setLoading(false))
  }, [])

  const handleSave = async (isEdit: boolean) => {
    if (!formData.name) {
      toast.error("Group name is required")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        defaultProfile: formData.defaultProfile === "none" ? null : formData.defaultProfile,
        description: formData.description,
      }

      if (isEdit && selectedGroup) {
        await api.put(`/groups/${selectedGroup.id}`, payload)
        toast.success("Group updated successfully")
        setIsEditOpen(false)
      } else {
        await api.post("/groups", payload)
        toast.success("Group created successfully")
        setIsAddOpen(false)
      }
      fetchGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedGroup) return
    setSaving(true)
    try {
      await api.delete(`/groups/${selectedGroup.id}`)
      toast.success("Group deleted successfully")
      setIsDeleteOpen(false)
      fetchGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete group")
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAction = async (action: 'suspend' | 'enable' | 'delete') => {
    if (!selectedGroup) return
    setSaving(true)
    try {
      const endpoint = action === 'suspend' ? 'bulk-disable' : action === 'enable' ? 'bulk-enable' : 'bulk-delete'
      const res = await api.post(`/groups/${selectedGroup.id}/${endpoint}`)
      toast.success(res.data.message || `Successfully processed bulk action`)
      if (action === 'suspend') {
        setIsBulkSuspendOpen(false)
      } else if (action === 'enable') {
        setIsBulkEnableOpen(false)
      } else {
        setIsBulkDeleteOpen(false)
      }
      fetchGroups() // Refresh counts if needed
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to process bulk action`)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (g: Group) => {
    setSelectedGroup(g)
    setFormData({
      name: g.name,
      defaultProfile: g.defaultProfile || "none",
      description: g.description || "",
    })
    setIsEditOpen(true)
  }

  const openDetails = (g: Group) => {
    setSelectedGroup(g)
    setIsDetailsOpen(true)
  }



  const openTransfer = (g: Group) => {
    setSelectedGroup(g)
    setTargetGroupId("")
    setIsTransferOpen(true)
  }

  const handleTransfer = async () => {
    if (!selectedGroup || !targetGroupId) return
    setSaving(true)
    try {
      const res = await api.post(`/groups/${selectedGroup.id}/bulk-transfer`, { targetGroupId })
      toast.success(res.data.message || `Successfully transferred users`)
      setIsTransferOpen(false)
      fetchGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to transfer users`)
    } finally {
      setSaving(false)
    }
  }

  const openDelete = (g: Group) => {
    setSelectedGroup(g)
    setIsDeleteOpen(true)
  }

  const openBulkAction = (g: Group, action: 'suspend' | 'enable' | 'delete') => {
    setSelectedGroup(g)
    if (action === 'suspend') setIsBulkSuspendOpen(true)
    else if (action === 'enable') setIsBulkEnableOpen(true)
    else setIsBulkDeleteOpen(true)
  }

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  // Dialog Classes based on standard
  const dialogContentClass = "bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 p-0 sm:max-w-[500px]"
  const dialogHeaderClass = "border-b border-border px-5 sm:px-8 py-5 sm:py-7 space-y-1.5"
  const dialogBodyClass = "px-5 sm:px-8 py-6"
  const dialogFooterClass = "px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
        <p className="text-muted-foreground mt-2">
          Manage user groups, assign default profiles, and perform bulk actions.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            className="pl-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => {
          setFormData({ name: "", defaultProfile: "none", description: "" })
          setIsAddOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
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
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No groups found.
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
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
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDelete(g)} disabled={g.userCount > 0}>
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

      {/* Add / Edit Dialog */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false)
          setIsEditOpen(false)
        }
      }}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="text-foreground">{isEditOpen ? "Edit Group" : "Create Group"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isEditOpen ? "Update group details and default profile." : "Add a new user group."}
            </DialogDescription>
          </DialogHeader>
          
          <div className={dialogBodyClass + " space-y-4"}>
            <div className="space-y-2">
              <Label>Group Name <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="e.g. Grade 10" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
              <Label>Default Profile (Package)</Label>
              <Select value={formData.defaultProfile} onValueChange={(val) => setFormData({...formData, defaultProfile: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Default Profile</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Users added to this group will inherit this profile.</p>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Optional description" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className={dialogFooterClass}>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</Button>
            <Button onClick={() => handleSave(isEditOpen)} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="text-foreground">Delete Group</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete the group <strong>{selectedGroup?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className={dialogBodyClass}>
            <p className="text-sm">This action cannot be undone. Only groups with 0 users can be deleted.</p>
          </div>
          <DialogFooter className={dialogFooterClass}>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Suspend Dialog */}
      <Dialog open={isBulkSuspendOpen} onOpenChange={setIsBulkSuspendOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="text-foreground">Suspend All Users</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Suspend all <strong>{selectedGroup?.userCount}</strong> users in <strong>{selectedGroup?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className={dialogBodyClass}>
            <p className="text-sm">
              This will block authentication for all users in this group immediately and disconnect active sessions.
            </p>
          </div>
          <DialogFooter className={dialogFooterClass}>
            <Button variant="outline" onClick={() => setIsBulkSuspendOpen(false)}>Cancel</Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleBulkAction('suspend')} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Suspend Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Enable Dialog */}
      <Dialog open={isBulkEnableOpen} onOpenChange={setIsBulkEnableOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="text-foreground">Reactivate All Users</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Reactivate all suspended users in <strong>{selectedGroup?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className={dialogBodyClass}>
            <p className="text-sm">
              This will remove the suspended restriction for all users in this group, allowing them to authenticate again.
            </p>
          </div>
          <DialogFooter className={dialogFooterClass}>
            <Button variant="outline" onClick={() => setIsBulkEnableOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleBulkAction('enable')} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reactivate Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="text-foreground">Delete All Users</DialogTitle>
            <DialogDescription className="text-red-500 font-medium">
              CRITICAL WARNING: Bulk Deletion
            </DialogDescription>
          </DialogHeader>
          <div className={dialogBodyClass}>
            <p className="text-sm">
              You are about to delete <strong>{selectedGroup?.userCount}</strong> users from <strong>{selectedGroup?.name}</strong>.
              They will be disconnected immediately and permanently lose access.
            </p>
          </div>
          <DialogFooter className={dialogFooterClass}>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleBulkAction('delete')} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete All Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Users Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="text-foreground">Transfer Users</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Move all users from <strong>{selectedGroup?.name}</strong> to another group.
            </DialogDescription>
          </DialogHeader>
          <div className={dialogBodyClass + " space-y-4"}>
            <p className="text-sm">
              Users will be moved to the selected group and will inherit its Default Profile. Active sessions will be disconnected to apply the new profile.
            </p>
            <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
              <Label>Target Group</Label>
              <Select value={targetGroupId} onValueChange={setTargetGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Destination Group" />
                </SelectTrigger>
                <SelectContent>
                  {groups
                    .filter(g => g.id !== selectedGroup?.id)
                    .map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className={dialogFooterClass}>
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleTransfer} disabled={saving || !targetGroupId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className={`${dialogContentClass} sm:max-w-[700px]`}>
          <DialogHeader className={dialogHeaderClass}>
            <DialogTitle className="text-foreground">Group Details: {selectedGroup?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Overview and members of this group.
            </DialogDescription>
          </DialogHeader>
          <div className={`${dialogBodyClass}`}>
            <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-muted-foreground mb-1">Group Name</span>
                  <span className="font-medium text-foreground">{selectedGroup?.name}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground mb-1">Inherited Profile</span>
                  {selectedGroup?.defaultProfile ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {selectedGroup.defaultProfile}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">None</span>
                  )}
                </div>
                <div>
                  <span className="block text-muted-foreground mb-1">Total Members</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{selectedGroup?.userCount} Users</span>
                  </div>
                </div>
                <div>
                  <span className="block text-muted-foreground mb-1">Created At</span>
                  <span className="font-medium">{selectedGroup?.createdAt ? format(new Date(selectedGroup.createdAt), "PPp") : "-"}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-6">
              <span className="block text-sm text-muted-foreground">Description</span>
              <p className="text-sm text-foreground bg-muted/10 p-3 rounded-lg border border-border/50 min-h-[60px]">
                {selectedGroup?.description || <span className="italic text-muted-foreground">No description provided.</span>}
              </p>
            </div>
          </div>
          <DialogFooter className={`${dialogFooterClass} pt-0 border-none`}>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
