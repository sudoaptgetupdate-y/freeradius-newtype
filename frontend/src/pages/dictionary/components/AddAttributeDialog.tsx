import { Loader2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddAttributeDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isLoading: boolean
  formData: {
    vendor: string
    attribute: string
    recommendedOp: string
    recommendedType: string
    description: string
  }
  setFormData: (data: any) => void
  handleCreateAttribute: (e: React.FormEvent) => Promise<void>
}

export function AddAttributeDialog({
  isOpen,
  setIsOpen,
  isLoading,
  formData,
  setFormData,
  handleCreateAttribute
}: AddAttributeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
  )
}
