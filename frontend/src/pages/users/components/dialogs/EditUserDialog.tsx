import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Loader2, User, Key, Calendar, Layers } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"
import { formatToRadiusDate, parseFromRadiusDate } from "../../utils/date"
import type {  UserData, GroupData  } from "@/types/user"

interface EditUserDialogProps {
  userObj: UserData | null
  onClose: () => void
  onSuccess: () => void
  user: any
  groups: GroupData[]
}

export function EditUserDialog({
  userObj,
  onClose,
  onSuccess,
  user,
  groups
}: EditUserDialogProps) {
  const isOpen = !!userObj
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingDetails, setIsFetchingDetails] = useState(false)
  const [editFormData, setEditFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    memberId: "",
    citizenId: "",
    email: "",
    phone: "",
    expiration: "",
    groupId: "",
    tenantId: ""
  })

  useEffect(() => {
    if (userObj) {
      const fetchDetails = async () => {
        setIsFetchingDetails(true)
        try {
          let tenantIdQuery = ""
          if (user?.role === "super_admin" || user?.role === "admin") {
            if (userObj.tenantId) {
              tenantIdQuery = `?tenantId=${userObj.tenantId}`
            }
          }
          const response = await api.get(`/users/${userObj.username}/details${tenantIdQuery}`)
          const details = response.data
          setEditFormData({
            username: userObj.username,
            password: "",
            firstName: details.personalInfo?.firstName || "",
            lastName: details.personalInfo?.lastName || "",
            memberId: details.personalInfo?.memberId || "",
            citizenId: details.personalInfo?.citizenId || "",
            email: details.personalInfo?.email || "",
            phone: details.personalInfo?.phone || "",
            expiration: details.personalInfo?.expiration ? parseFromRadiusDate(details.personalInfo.expiration) : "",
            groupId: userObj.groupId || "none",
            tenantId: userObj.tenantId || ""
          })
        } catch (error) {
          toast.error("Failed to load user data for editing")
          onClose()
        } finally {
          setIsFetchingDetails(false)
        }
      }
      fetchDetails()
    } else {
      setEditFormData({ username: "", password: "", firstName: "", lastName: "", memberId: "", citizenId: "", email: "", phone: "", expiration: "", groupId: "", tenantId: "" })
    }
  }, [userObj, user?.role, onClose])

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        memberId: editFormData.memberId,
        citizenId: editFormData.citizenId,
        email: editFormData.email,
        phone: editFormData.phone,
        expiration: editFormData.expiration ? formatToRadiusDate(editFormData.expiration) : "",
      }
      if (editFormData.password) payload.password = editFormData.password
      if (editFormData.tenantId) payload.tenantId = editFormData.tenantId
      
      if (editFormData.groupId && editFormData.groupId !== "none") {
         payload.groupId = editFormData.groupId
      } else if (editFormData.groupId === "none") {
         payload.groupId = null
      }
      
      await api.put(`/users/${editFormData.username}`, payload)
      toast.success("User updated successfully!")
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Failed to update user:", error)
      toast.error(error.response?.data?.error || "Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] md:max-w-[680px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
          <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground">
            Edit User
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
            Update password or reassign to a different group.
          </DialogDescription>
        </DialogHeader>

        {isFetchingDetails ? (
          <div className="flex items-center justify-center p-12 min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleEditUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-5 sm:px-8 py-6 flex-1 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-firstName" className="text-[13px] font-semibold text-foreground">First Name <span className="text-red-500">*</span></Label>
                      <Input id="edit-firstName" value={editFormData.firstName} onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} required placeholder="First name" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-lastName" className="text-[13px] font-semibold text-foreground">Last Name <span className="text-red-500">*</span></Label>
                      <Input id="edit-lastName" value={editFormData.lastName} onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} required placeholder="Last name" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-memberId" className="text-[13px] font-semibold text-foreground">Member ID <span className="text-red-500">*</span></Label>
                      <Input id="edit-memberId" value={editFormData.memberId} onChange={e => setEditFormData({...editFormData, memberId: e.target.value})} required placeholder="E.g., student ID, employee ID" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-citizenId" className="text-[13px] font-semibold text-foreground">Citizen ID</Label>
                      <Input id="edit-citizenId" value={editFormData.citizenId} onChange={e => setEditFormData({...editFormData, citizenId: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-email" className="text-[13px] font-semibold text-foreground">Email</Label>
                      <Input id="edit-email" type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-phone" className="text-[13px] font-semibold text-foreground">Phone</Label>
                      <Input id="edit-phone" type="tel" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} placeholder="Optional" className="h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Account Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-foreground">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={editFormData.username} disabled className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-password" className="text-[13px] font-semibold text-foreground">New Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="edit-password" type="password" value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} placeholder="Leave blank to keep current" className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background" />
                      </div>
                    </div>
                    {/* Select Group & Expire Date side-by-side */}
                    <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <Label htmlFor="edit-group" className="text-[13px] font-semibold text-foreground">Group</Label>
                      <div className="relative mt-1">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Select value={editFormData.groupId} onValueChange={(val) => setEditFormData({...editFormData, groupId: val})}>
                          <SelectTrigger className="w-full pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background">
                            <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Group</SelectItem>
                            {groups.filter(g => !g.tenantId || !editFormData.tenantId || g.tenantId === editFormData.tenantId).map(g => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">Changing group updates Profile automatically.</p>
                    </div>

                    <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <Label htmlFor="edit-expiration" className="text-[13px] font-semibold text-foreground">Expiration Date</Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="edit-expiration" 
                          type={editFormData.expiration ? "datetime-local" : "text"} 
                          placeholder="No Expire" 
                          value={editFormData.expiration} 
                          onFocus={(e) => (e.target.type = "datetime-local")}
                          onBlur={(e) => {
                            if (!e.target.value) e.target.type = "text";
                          }}
                          onChange={e => setEditFormData({...editFormData, expiration: e.target.value})} 
                          className="pl-9 h-[40px] rounded-[8px] border-border text-[13px] bg-background w-full" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
