import { useState, useEffect } from "react"
import Papa from "papaparse"
import { toast } from "react-toastify"
import { Loader2, FileSpreadsheet, Download, Upload, CheckCircle2, XCircle, Building } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"
import { formatToRadiusDate } from "../../utils/date"
import type {  GroupData, TenantData  } from "@/types/user"

interface BulkImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  groups: GroupData[]
  user: any
  isImpersonating?: boolean
  selectedTenantFilter: string
  tenants: TenantData[]
}

export function BulkImportDialog({
  isOpen,
  onClose,
  onSuccess,
  groups,
  user,
  isImpersonating,
  selectedTenantFilter,
  tenants
}: BulkImportDialogProps) {
  const [bulkImportData, setBulkImportData] = useState<any[]>([])
  const [isBulkImporting, setIsBulkImporting] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")

  useEffect(() => {
    if (isOpen) {
      if (selectedTenantFilter && selectedTenantFilter !== "all") {
        setSelectedTenantId(selectedTenantFilter)
      } else {
        setSelectedTenantId("")
      }
    }
  }, [isOpen, selectedTenantFilter])

  const getCsvValue = (row: any, key: string): string => {
    if (!row) return "";
    const cleanKey = key.toLowerCase().replace(/[*]/g, '').trim();
    const foundKey = Object.keys(row).find(k => {
      const ck = k.toLowerCase().replace(/[*]/g, '').replace(/\(optional\)/g, '').replace(/\(required\)/g, '').trim();
      return ck === cleanKey;
    });
    return foundKey ? String(row[foundKey] || "").trim() : "";
  };

  const downloadBulkTemplate = () => {
    const headers = "Username*,Password*,First Name*,Last Name*,Member ID*,Citizen ID (Optional),Email (Optional),Phone (Optional),Expiration Date (Optional),Group Name (Optional)\n";
    const example1 = "john_doe,pass1234,John,Doe,MBR001,1100999999999,john@example.com,0812345678,2027-12-31T23:59,Standard Group\n";
    const example2 = "jane_smith,secret99,Jane,Smith,MBR002,,,,,VIP Group\n";
    const csvContent = headers + example1 + example2;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_users_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setBulkImportData(results.data);
      },
      error: (error: any) => {
        toast.error("Failed to parse CSV file: " + error.message);
      }
    });
    e.target.value = "";
  };

  const handleBulkSubmit = async () => {
    if (bulkImportData.length === 0) return;
    setIsBulkImporting(true);
    
    const missingGroups: string[] = [];
    bulkImportData.forEach(row => {
      const groupName = getCsvValue(row, "Group Name");
      if (groupName && !groups.some(g => g.name.toLowerCase() === groupName.toLowerCase())) {
        missingGroups.push(groupName);
      }
    });

    if (missingGroups.length > 0) {
      const uniqueMissing = Array.from(new Set(missingGroups));
      toast.error(`Import failed: The following groups do not exist in the database: ${uniqueMissing.join(", ")}. Please create them first.`);
      setIsBulkImporting(false);
      return;
    }

    const groupMap = new Map(groups.map(g => [g.name.toLowerCase(), g.id]));
    
    const mappedUsers = bulkImportData.map(row => {
      const username = getCsvValue(row, "Username");
      const password = getCsvValue(row, "Password");
      const groupName = getCsvValue(row, "Group Name");
      
      let groupId = undefined;
      if (groupName) {
         groupId = groupMap.get(groupName.toLowerCase()) || undefined;
      }
      
      const expirationDate = getCsvValue(row, "Expiration Date");
      
      return {
        username: username,
        password: password,
        firstName: getCsvValue(row, "First Name") || undefined,
        lastName: getCsvValue(row, "Last Name") || undefined,
        memberId: getCsvValue(row, "Member ID") || undefined,
        citizenId: getCsvValue(row, "Citizen ID") || undefined,
        email: getCsvValue(row, "Email") || undefined,
        phone: getCsvValue(row, "Phone") || undefined,
        expiration: expirationDate ? formatToRadiusDate(expirationDate) : undefined,
        groupId: groupId
      };
    }).filter(u => u.username && u.password);

    if (mappedUsers.length === 0) {
      toast.error("No valid users found in CSV. Username and Password are required.");
      setIsBulkImporting(false);
      return;
    }

    if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && !user.tenantId && !selectedTenantId) {
      toast.error("Please select a target Tenant first.");
      setIsBulkImporting(false);
      return;
    }

    try {
      let tenantIdQuery = ""
      if (selectedTenantId) {
        tenantIdQuery = `?tenantId=${selectedTenantId}`
      }
      const response = await api.post(`/users/bulk-import${tenantIdQuery}`, { users: mappedUsers });
      toast.success(response.data.message || `Successfully imported users`);
      setBulkImportData([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to bulk import users");
    } finally {
      setIsBulkImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setBulkImportData([]);
      }
    }}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
          <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground">
            Bulk Import Users
          </DialogTitle>
          <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
            Upload a CSV file to bulk create users. Download the template for the correct format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-5 sm:px-8 py-6 flex-1 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
            {(user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && !user.tenantId && (
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                <label className="text-[14px] font-semibold text-foreground">Select Target Tenant</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {!bulkImportData.length ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-10 bg-muted/20">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Drag and drop your file here, or click to browse. Ensure your CSV matches the template format. Date format (Expiration Date) is YYYY-MM-DDTHH:mm.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={downloadBulkTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleBulkFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Button className="pointer-events-none">
                      <Upload className="mr-2 h-4 w-4" />
                      Browse File
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Preview Data ({bulkImportData.length} rows)</h3>
                  <Button variant="outline" size="sm" onClick={() => setBulkImportData([])}>
                    Clear Data
                  </Button>
                </div>
                <div className="rounded-md border overflow-hidden">
                  <Table className="min-w-[600px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[50px]">Status</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Password</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Group Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkImportData.slice(0, 50).map((row, i) => {
                        const username = getCsvValue(row, "Username");
                        const password = getCsvValue(row, "Password");
                        const firstName = getCsvValue(row, "First Name");
                        const groupName = getCsvValue(row, "Group Name");
                        const groupExists = groupName ? groups.some(g => g.name.toLowerCase() === groupName.toLowerCase()) : true;
                        const isValid = username && password && groupExists;
                        return (
                          <TableRow key={i}>
                            <TableCell>
                              {isValid ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                            </TableCell>
                            <TableCell className="font-medium">{username || <span className="text-red-500 italic">Missing</span>}</TableCell>
                            <TableCell>{password ? "********" : <span className="text-red-500 italic">Missing</span>}</TableCell>
                            <TableCell>{firstName || "-"}</TableCell>
                            <TableCell>
                              {groupName ? (
                                <span className={groupExists ? "text-foreground" : "text-red-500 font-semibold"}>
                                  {groupName} {!groupExists && <span className="text-[11px] text-red-500 font-normal ml-1">(Not Found)</span>}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {bulkImportData.length > 50 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Showing first 50 rows. Total {bulkImportData.length} rows will be imported.
                  </p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkSubmit} 
              disabled={isBulkImporting || bulkImportData.length === 0} 
              className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20"
            >
              {isBulkImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {bulkImportData.length} Users
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
