import { Plus, Trash2, Library } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDictionary } from "./hooks/useDictionary"
import { AddAttributeDialog } from "./components/AddAttributeDialog"

export function DictionaryPage() {
  const {
    user,
    attributes,
    isDialogOpen,
    setIsDialogOpen,
    isLoading,
    formData,
    setFormData,
    handleCreateAttribute,
    handleDeleteAttribute
  } = useDictionary()

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Radius Dictionary</h2>
          <p className="text-muted-foreground">Manage custom RADIUS attributes for Advanced Profiles.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto h-[44px] px-6 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          Add Attribute
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px]">
            <Table className="min-w-[700px] sm:min-w-full">
              <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="font-semibold">Vendor</TableHead>
                  <TableHead className="font-semibold">Attribute</TableHead>
                  <TableHead className="font-semibold">Default Op</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="text-right font-semibold pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No attributes in dictionary.
                    </TableCell>
                  </TableRow>
                ) : (
                  attributes.map((attr) => (
                    <TableRow key={attr.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Library className="mr-2 h-4 w-4 text-primary" />
                          {attr.vendor}
                        </div>
                        {attr.tenantId === null && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full ml-6">Global</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{attr.attribute}</TableCell>
                      <TableCell className="font-mono text-sm">{attr.recommendedOp}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${attr.recommendedType === 'check' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                          {attr.recommendedType}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {attr.description || "-"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {(user?.role === "super_admin" || user?.role === "admin" || attr.tenantId === user?.tenantId) && (
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleDeleteAttribute(attr.id)}>
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

      <AddAttributeDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen} 
        isLoading={isLoading} 
        formData={formData} 
        setFormData={setFormData} 
        handleCreateAttribute={handleCreateAttribute} 
      />
    </div>
  )
}
