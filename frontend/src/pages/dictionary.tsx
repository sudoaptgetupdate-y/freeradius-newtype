import { useState, useEffect } from "react"
import { Plus, Trash2, Library, Loader2, Tag } from "lucide-react"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

type DictionaryAttribute = {
  id: number
  tenantId: string | null
  vendor: string
  attribute: string
  recommendedOp: string
  recommendedType: string
  description: string
}

export function DictionaryPage() {
  const { user } = useAuth()
  const MySwal = withReactContent(Swal)
  const [attributes, setAttributes] = useState<DictionaryAttribute[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    vendor: "Generic",
    attribute: "",
    recommendedOp: "=",
    recommendedType: "reply",
    description: ""
  })

  const fetchDictionary = async () => {
    try {
      const response = await api.get("/dictionary")
      setAttributes(response.data)
    } catch (error) {
      console.error("Failed to fetch dictionary:", error)
    }
  }

  useEffect(() => {
    fetchDictionary()
  }, [user])

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await api.post("/dictionary", formData)
      setIsDialogOpen(false)
      setFormData({ vendor: "Generic", attribute: "", recommendedOp: "=", recommendedType: "reply", description: "" })
      toast.success("Attribute added successfully!")
      fetchDictionary()
    } catch (error: any) {
      console.error("Failed to create attribute:", error)
      toast.error(error.response?.data?.error || "Failed to create attribute")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAttribute = async (id: number) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete this attribute from the dictionary?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/dictionary?id=${id}`)
        toast.success("Attribute deleted successfully!")
        fetchDictionary()
      } catch (error: any) {
        console.error("Failed to delete attribute:", error)
        toast.error(error.response?.data?.error || "Failed to delete attribute")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Radius Dictionary</h2>
          <p className="text-muted-foreground">Manage custom RADIUS attributes for Advanced Profiles.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Attribute
        </Button>
      </div>

      <Card>
        <CardContent className="pt-0 sm:pt-6 p-4 sm:p-6 flex flex-col h-[540px]">
          <div className="rounded-md border overflow-auto max-h-[500px]">
            <Table className="min-w-[700px] sm:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Attribute</TableHead>
                  <TableHead>Default Op</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No attributes in dictionary.
                    </TableCell>
                  </TableRow>
                ) : (
                  attributes.map((attr) => (
                    <TableRow key={attr.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Library className="mr-2 h-4 w-4 text-primary" />
                          {attr.vendor}
                        </div>
                        {attr.tenantId === null && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded ml-6">Global</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{attr.attribute}</TableCell>
                      <TableCell className="font-mono text-xs">{attr.recommendedOp}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${attr.recommendedType === 'check' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                          {attr.recommendedType}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {attr.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {(user?.role === "super_admin" || user?.role === "admin" || attr.tenantId === user?.tenantId) && (
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAttribute(attr.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
              Add Attribute
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              Add a new custom RADIUS attribute to the dictionary.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAttribute} className="flex flex-col h-full pt-4">
            <div className="px-5 sm:px-7 pb-4 space-y-4 flex-1 overflow-y-auto">
              
              <div className="space-y-1.5">
                <Label htmlFor="vendor" className="text-[14px] font-semibold text-foreground">Vendor</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="vendor" 
                    value={formData.vendor} 
                    onChange={e => setFormData({...formData, vendor: e.target.value})} 
                    placeholder="e.g. Cisco, MikroTik, Generic" 
                    required 
                    className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="attribute" className="text-[14px] font-semibold text-foreground">Attribute Name</Label>
                <Input 
                  id="attribute" 
                  value={formData.attribute} 
                  onChange={e => setFormData({...formData, attribute: e.target.value})} 
                  placeholder="e.g. WISPr-Bandwidth-Max-Down" 
                  required 
                  className="h-[44px] rounded-[8px] border-border text-[14px] bg-background font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="recommendedOp" className="text-[14px] font-semibold text-foreground">Operator</Label>
                  <Select value={formData.recommendedOp} onValueChange={(val) => setFormData({...formData, recommendedOp: val})}>
                    <SelectTrigger className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Op" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="=">=</SelectItem>
                      <SelectItem value=":=">:=</SelectItem>
                      <SelectItem value="+=">+=</SelectItem>
                      <SelectItem value="==">==</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recommendedType" className="text-[14px] font-semibold text-foreground">Type</Label>
                  <Select value={formData.recommendedType} onValueChange={(val: 'check' | 'reply') => setFormData({...formData, recommendedType: val})}>
                    <SelectTrigger className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reply">Reply</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-[14px] font-semibold text-foreground">Description (Optional)</Label>
                <Input 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="What does this do?" 
                  className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>

            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px] border-border text-foreground bg-transparent hover:bg-muted text-[14px] font-semibold" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold shadow-none">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
