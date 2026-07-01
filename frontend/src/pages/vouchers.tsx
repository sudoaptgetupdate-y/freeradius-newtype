import { useState, useEffect } from "react"
import { Plus, Printer, Loader2, Building, Tag, Hash, RefreshCcw, Ticket, Settings, Image } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { usePagination } from "@/hooks/use-pagination"
import { DataTablePagination } from "@/components/data-table-pagination"

type VoucherBatch = {
  id: string
  tenantId: string
  prefix: string
  amount: number
  groupname: string
  type: string
  createdAt: string
}

type Profile = {
  name: string
  tenantId: string
}

type VoucherSettings = {
  defaultPrefix: string | null
  logoUrl: string | null
  headerText: string | null
  ssidName: string | null
}

export function VouchersPage() {
  const { user, isImpersonating } = useAuth()
  const [batches, setBatches] = useState<VoucherBatch[]>([])
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all")

  const filteredBatches = batches.filter(batch => {
    const matchesTenant = selectedTenantFilter === "all" || batch.tenantId === selectedTenantFilter;
    return matchesTenant;
  })

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData,
    totalPages,
    totalItems
  } = usePagination(filteredBatches)
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const [settings, setSettings] = useState<VoucherSettings>({
    defaultPrefix: "",
    logoUrl: "",
    headerText: "",
    ssidName: ""
  })
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const [formData, setFormData] = useState({
    tenantId: "",
    amount: "10",
    prefix: "",
    groupname: "",
    type: "code",
    codeLength: "6",
    passwordLength: "6"
  })

  const fetchBatches = async () => {
    try {
      const response = await api.get("/vouchers")
      setBatches(response.data)
    } catch (error) {
      console.error("Failed to fetch voucher batches:", error)
    }
  }

  const fetchTenants = async () => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      try {
        const response = await api.get("/tenants")
        const tenantData = response.data
        setTenants(tenantData)
        if (tenantData.length === 1 && !formData.tenantId) {
          setFormData(prev => ({...prev, tenantId: tenantData[0].id}))
        }
      } catch (error) {
        console.error("Failed to fetch tenants:", error)
      }
    }
  }

  const fetchProfiles = async () => {
    try {
      const response = await api.get("/profiles")
      setProfiles(response.data)
    } catch (error) {
      console.error("Failed to fetch profiles:", error)
    }
  }

  const fetchSettings = async (tenantIdToFetch?: string) => {
    try {
      const url = tenantIdToFetch ? `/vouchers/settings?tenantId=${tenantIdToFetch}` : "/vouchers/settings"
      const response = await api.get(url)
      setSettings({
        defaultPrefix: response.data.defaultPrefix || "",
        logoUrl: response.data.logoUrl || "",
        headerText: response.data.headerText || "",
        ssidName: response.data.ssidName || "",
      })
    } catch (error) {
      console.error("Failed to fetch voucher settings:", error)
    }
  }

  useEffect(() => {
    fetchBatches()
    fetchTenants()
    fetchProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!user) return
    if (user.role !== "super_admin" && user.role !== "admin") {
      fetchSettings()
    } else if (formData.tenantId) {
      fetchSettings(formData.tenantId)
    }
  }, [user, formData.tenantId])

  // Polling logic for job progress
  useEffect(() => {
    let interval: any
    if (activeJobId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/vouchers/jobs/${activeJobId}`)
          if (res.data) {
            setProgress(res.data.progress || 0)
            if (res.data.state === "completed") {
              clearInterval(interval)
              setActiveJobId(null)
              setProgress(100)
              setIsGenerating(false)
              setIsDialogOpen(false)
              toast.success("Vouchers generated successfully!")
              fetchBatches()
            } else if (res.data.state === "failed") {
              clearInterval(interval)
              setActiveJobId(null)
              setIsGenerating(false)
              toast.error("Voucher generation failed")
            }
          }
        } catch (e) {
          console.error("Failed to poll job status", e)
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeJobId])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((user?.role === "super_admin" || user?.role === "admin") && !formData.tenantId) {
      toast.error("Please select a Tenant")
      return
    }

    if (!formData.groupname) {
      toast.error("Please select a Profile (Internet Package)")
      return
    }

    setIsGenerating(true)
    setProgress(0)
    
    try {
      const payload: any = { 
        amount: parseInt(formData.amount),
        groupname: formData.groupname,
        type: formData.type,
        codeLength: parseInt(formData.codeLength),
        passwordLength: parseInt(formData.passwordLength)
      }
      if (formData.tenantId) payload.tenantId = formData.tenantId
      if (formData.prefix) payload.prefix = formData.prefix
      
      const res = await api.post("/vouchers/generate", payload)
      if (res.status === 202 && res.data.jobId) {
        setActiveJobId(res.data.jobId)
      } else {
        setIsGenerating(false)
        toast.error("Failed to start generation job")
      }
    } catch (error: any) {
      setIsGenerating(false)
      console.error("Failed to generate vouchers:", error)
      toast.error(error.response?.data?.error || "Failed to generate vouchers")
    }
  }

  const handleOpenCreate = () => {
    setFormData({ tenantId: "", amount: "10", prefix: settings.defaultPrefix || "", groupname: "", type: "code", codeLength: "6", passwordLength: "6" })
    setIsDialogOpen(true)
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    
    if ((user?.role === "super_admin" || user?.role === "admin") && !formData.tenantId) {
      toast.error("Please select a Tenant")
      setIsSavingSettings(false)
      return
    }

    try {
      const payload: any = {
        defaultPrefix: settings.defaultPrefix,
        logoUrl: settings.logoUrl,
        headerText: settings.headerText,
        ssidName: settings.ssidName
      }
      if ((user?.role === "super_admin" || user?.role === "admin") && formData.tenantId) {
        payload.tenantId = formData.tenantId
      }
      await api.put("/vouchers/settings", payload)
      toast.success("Voucher template settings saved successfully!")
      setIsSettingsDialogOpen(false)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save settings")
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handlePrintBatch = async (batchId: string) => {
    try {
      toast.info("Fetching vouchers for printing...");
      const res = await api.get(`/vouchers/batch?batchId=${batchId}`);
      const vouchersList = res.data;
      if (!vouchersList || vouchersList.length === 0) {
        toast.error("No vouchers found in this batch.");
        return;
      }
      
      const batch = batches.find(b => b.id === batchId);
      const packageName = batch ? batch.groupname : "Internet Access";

      // Open new print window
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocker prevented opening the print window.");
        return;
      }

      const logoHtml = settings.logoUrl 
        ? `<img src="${settings.logoUrl}" alt="Logo" class="voucher-logo" />`
        : `<svg class="wifi-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`;

      const headerText = settings.headerText || "WIFI INTERNET VOUCHER";
      const ssidBadgeHtml = settings.ssidName 
        ? `<div class="ssid-badge">SSID: <b>${settings.ssidName}</b></div>`
        : "";

      const batchType = batch ? batch.type : "code";

      const cardsHtml = vouchersList.map((v: any) => {
        let authHtml = "";
        if (batchType === "user_pass" && v.password) {
          authHtml = `
            <div class="auth-row">
              <span class="auth-label">Username:</span>
              <span class="auth-value">${v.code}</span>
            </div>
            <div class="auth-row">
              <span class="auth-label">Password:</span>
              <span class="auth-value">${v.password}</span>
            </div>
          `;
        } else {
          authHtml = `
            <div class="code-label">ACCESS CODE (PIN)</div>
            <div class="code-value">${v.code}</div>
          `;
        }

        return `
          <div class="voucher-card">
            <div class="voucher-header">
              ${logoHtml}
              <h2>${headerText}</h2>
              ${ssidBadgeHtml}
            </div>
            <div class="voucher-body">
              ${authHtml}
              <div class="info-row" style="margin-top: 8px;">
                <span class="info-label">Package:</span>
                <span class="info-value">${packageName}</span>
              </div>
            </div>
            <div class="voucher-footer">
              Connect to WiFi & enter credentials to login.
            </div>
          </div>
        `;
      }).join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Vouchers - Batch ${batchId.substring(0, 8)}</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #fff;
                color: #333;
              }
              .voucher-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 15px;
              }
              .voucher-card {
                border: 2px dashed #999;
                border-radius: 8px;
                padding: 10px 14px;
                box-sizing: border-box;
                background: #fff;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: auto;
                min-height: 195px;
                position: relative;
                page-break-inside: avoid;
              }
              .voucher-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 3px;
                border-bottom: 1px solid #eee;
                padding-bottom: 6px;
                text-align: center;
              }
              .wifi-icon {
                width: 20px;
                height: 20px;
                color: #2563eb;
              }
              .voucher-logo {
                max-height: 20px;
                object-fit: contain;
              }
              .voucher-header h2 {
                margin: 0;
                font-size: 10.5px;
                font-weight: 800;
                letter-spacing: 0.5px;
                color: #1e293b;
                text-align: center;
              }
              .ssid-badge {
                font-size: 8.5px;
                background: #eff6ff;
                color: #1e40af;
                padding: 1px 6px;
                border-radius: 9999px;
                border: 1px solid #bfdbfe;
                font-weight: 700;
                margin-top: 1px;
                display: inline-block;
              }
              .voucher-body {
                margin: 6px 0;
                text-align: center;
              }
              .code-label {
                font-size: 8.5px;
                color: #64748b;
                letter-spacing: 0.5px;
                font-weight: 600;
                margin-bottom: 2px;
              }
              .code-value {
                font-family: 'Courier New', Courier, monospace;
                font-size: 20px;
                font-weight: 900;
                letter-spacing: 1.5px;
                color: #0f172a;
                margin: 2px 0 4px 0;
                background: #f8fafc;
                padding: 4px 6px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
              }
              .auth-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8fafc;
                padding: 3px 6px;
                border: 1px solid #e2e8f0;
                margin-bottom: 3px;
                border-radius: 4px;
              }
              .auth-label {
                font-size: 9px;
                font-weight: 600;
                color: #64748b;
              }
              .auth-value {
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                font-weight: 800;
                color: #0f172a;
                letter-spacing: 0.5px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                color: #475569;
                padding: 0 4px;
              }
              .info-label {
                font-weight: 600;
              }
              .info-value {
                font-weight: 700;
                color: #2563eb;
              }
              .voucher-footer {
                border-top: 1px dashed #eee;
                padding-top: 8px;
                font-size: 8px;
                color: #64748b;
                text-align: center;
              }
              @media print {
                body {
                  padding: 0;
                }
                .voucher-grid {
                  grid-template-columns: repeat(3, 1fr);
                }
              }
            </style>
          </head>
          <body>
            <div class="voucher-grid">
              ${cardsHtml}
            </div>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Print failed:", error);
      toast.error("Failed to load vouchers for printing.");
    }
  };

  // Filter profiles based on selected tenant
  const availableProfiles = profiles.filter(p => 
    !formData.tenantId || (p as any).tenantId === formData.tenantId || !(p as any).tenantId
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vouchers</h2>
          <p className="text-muted-foreground">Generate and manage printable internet vouchers.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)} className="w-full sm:w-auto">
            <Settings className="mr-2 h-4 w-4" />
            Template Settings
          </Button>
          <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Generate Vouchers
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex flex-row justify-between items-center gap-4">
            {user?.role === "super_admin" && !isImpersonating ? (
              <div className="w-full sm:w-64">
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
            ) : (
              <div />
            )}
            <Button variant="outline" size="sm" onClick={fetchBatches} className="shrink-0">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 flex flex-col h-[540px]">
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
          <DataTablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !isGenerating && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
              Generate Vouchers
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              Create a batch of random codes for users to access the internet.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="flex flex-col h-full pt-4">
            <div className="px-5 sm:px-7 pb-4 space-y-4 flex-1 overflow-y-auto">
              
              {/* Highlighted Tenant Dropdown */}
              {(user?.role === "super_admin" || user?.role === "admin") && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Label htmlFor="tenant" className="text-[14px] font-semibold text-foreground">Select Tenant</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val})} disabled={isGenerating}>
                      <SelectTrigger id="tenant" className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
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
              
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-[14px] font-semibold text-foreground">Voucher Format</Label>
                <div className="relative">
                  <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})} disabled={isGenerating}>
                    <SelectTrigger id="type" className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">Code Only (PIN)</SelectItem>
                      <SelectItem value="user_pass">Username & Password</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Length Controls */}
              {formData.type === "code" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="codeLength" className="text-[14px] font-semibold text-foreground">Code Length</Label>
                  <Select value={formData.codeLength} onValueChange={(val) => setFormData({...formData, codeLength: val})} disabled={isGenerating}>
                    <SelectTrigger id="codeLength" className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((len) => (
                        <SelectItem key={len} value={len.toString()}>{len} Characters</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="usernameLength" className="text-[14px] font-semibold text-foreground">Username Length</Label>
                    <Select value={formData.codeLength} onValueChange={(val) => setFormData({...formData, codeLength: val})} disabled={isGenerating}>
                      <SelectTrigger id="usernameLength" className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        {[4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((len) => (
                          <SelectItem key={len} value={len.toString()}>{len} Chars</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="passwordLength" className="text-[14px] font-semibold text-foreground">Password Length</Label>
                    <Select value={formData.passwordLength} onValueChange={(val) => setFormData({...formData, passwordLength: val})} disabled={isGenerating}>
                      <SelectTrigger id="passwordLength" className="h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        {[4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((len) => (
                          <SelectItem key={len} value={len.toString()}>{len} Chars</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="profile" className="text-[14px] font-semibold text-foreground">Internet Package (Profile)</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={formData.groupname} onValueChange={(val) => setFormData({...formData, groupname: val})} disabled={isGenerating}>
                    <SelectTrigger id="profile" className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
                      <SelectValue placeholder="Select a package for these vouchers" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfiles.map(p => (
                        <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-[14px] font-semibold text-foreground">Amount</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="amount" 
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.amount} 
                      onChange={e => setFormData({...formData, amount: e.target.value})} 
                      required 
                      disabled={isGenerating}
                      className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prefix" className="text-[14px] font-semibold text-foreground">Prefix (Optional)</Label>
                  <div className="relative">
                    <Input 
                      id="prefix" 
                      value={formData.prefix} 
                      onChange={e => setFormData({...formData, prefix: e.target.value})} 
                      placeholder="e.g. VIP-" 
                      maxLength={10}
                      disabled={isGenerating}
                      className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                    />
                  </div>
                </div>
              </div>

              {isGenerating && (
                <div className="mt-4 p-4 border border-border rounded-lg bg-muted/20 text-center">
                  <p className="text-sm font-medium mb-2">Generating Vouchers... {progress}%</p>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

            </div>
            
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsDialogOpen(false)} disabled={isGenerating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-none shadow-2xl [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
          <DialogHeader className="px-5 sm:px-8 py-5 sm:py-7 border-b border-border bg-background">
            <DialogTitle className="text-[20px] sm:text-[22px] font-bold text-foreground pr-6">
              Template Settings
            </DialogTitle>
            <DialogDescription className="text-[13px] sm:text-[14px] text-muted-foreground mt-1 sm:mt-1.5">
              Customize voucher print template and defaults.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSettings} className="flex flex-col h-full pt-4">
            <div className="px-5 sm:px-7 pb-4 space-y-4 flex-1 overflow-y-auto">
              
              {/* Highlighted Tenant Dropdown */}
              {(user?.role === "super_admin" || user?.role === "admin") && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Label htmlFor="settings-tenant" className="text-[14px] font-semibold text-foreground">Select Tenant</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val})} disabled={isSavingSettings}>
                      <SelectTrigger id="settings-tenant" className="w-full pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background">
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

              <div className="space-y-1.5">
                <Label htmlFor="defaultPrefix" className="text-[14px] font-semibold text-foreground">Default Prefix</Label>
                <Input 
                  id="defaultPrefix" 
                  value={settings.defaultPrefix || ""} 
                  onChange={e => setSettings({...settings, defaultPrefix: e.target.value})} 
                  placeholder="e.g. mkt_" 
                  maxLength={10}
                  className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="logoUrl" className="text-[14px] font-semibold text-foreground">
                  Logo URL (Optional)
                  <span className="text-[11px] font-normal text-muted-foreground ml-2">(Must be a direct image link like .png or .jpg)</span>
                </Label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="logoUrl" 
                    value={settings.logoUrl || ""} 
                    onChange={e => setSettings({...settings, logoUrl: e.target.value})} 
                    placeholder="https://example.com/logo.png" 
                    className="pl-9 h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="headerText" className="text-[14px] font-semibold text-foreground">Header Text</Label>
                <Input 
                  id="headerText" 
                  value={settings.headerText || ""} 
                  onChange={e => setSettings({...settings, headerText: e.target.value})} 
                  placeholder="WIFI INTERNET VOUCHER" 
                  maxLength={100}
                  className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ssidName" className="text-[14px] font-semibold text-foreground">SSID Name (Optional)</Label>
                <Input 
                  id="ssidName" 
                  value={settings.ssidName || ""} 
                  onChange={e => setSettings({...settings, ssidName: e.target.value})} 
                  placeholder="e.g. MyWiFi_Guest" 
                  maxLength={100}
                  className="h-[44px] rounded-[8px] border-border text-[14px] bg-background"
                />
              </div>
            </div>
            <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-[44px] px-5 rounded-[8px]" onClick={() => setIsSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingSettings} className="w-full sm:w-auto h-[44px] px-6 rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20">
                {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
