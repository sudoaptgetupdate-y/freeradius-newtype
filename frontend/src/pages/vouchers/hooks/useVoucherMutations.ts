import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import api from "@/lib/api"
import type { VoucherBatch, VoucherSettings } from "@/types/voucher"

interface UseVoucherMutationsProps {
  user: any
  isImpersonating: boolean
  batches: VoucherBatch[]
  settings: VoucherSettings
  fetchBatches: () => void
  fetchSettings: (tenantId?: string) => Promise<void>
  setIsGenerating: (val: boolean) => void
  setProgress: (val: number) => void
  setIsDialogOpen: (val: boolean) => void
  setIsSettingsDialogOpen: (val: boolean) => void
  setIsSavingSettings: (val: boolean) => void
}

export function useVoucherMutations({
  user,
  isImpersonating,
  batches,
  settings,
  fetchBatches,
  fetchSettings,
  setIsGenerating,
  setProgress,
  setIsDialogOpen,
  setIsSettingsDialogOpen,
  setIsSavingSettings
}: UseVoucherMutationsProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

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
              if (res.data.returnvalue?.batchId) {
                handlePrintBatch(res.data.returnvalue.batchId)
              }
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
  }, [activeJobId, fetchBatches, setIsDialogOpen, setIsGenerating, setProgress])

  const handleGenerate = async (formData: any) => {
    if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && !formData.tenantId) {
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

  const handleSaveSettings = async (formData: any, localSettings: VoucherSettings) => {
    setIsSavingSettings(true)
    
    if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && !formData.tenantId) {
      toast.error("Please select a Tenant")
      setIsSavingSettings(false)
      return
    }

    try {
      const payload: any = {
        defaultPrefix: localSettings.defaultPrefix,
        logoUrl: localSettings.logoUrl,
        headerText: localSettings.headerText,
        ssidName: localSettings.ssidName,
        footerText: localSettings.footerText
      }
      if ((user?.role === "super_admin" || user?.role === "admin") && !isImpersonating && formData.tenantId) {
        payload.tenantId = formData.tenantId
      }
      await api.put("/vouchers/settings", payload)
      toast.success("Voucher template settings saved successfully!")
      setIsSettingsDialogOpen(false)
      if (formData.tenantId) {
        await fetchSettings(formData.tenantId)
      } else {
        await fetchSettings()
      }
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
      
      let batch = batches.find(b => b.id === batchId);
      
      // If not in state yet (just generated), fetch directly to get package name
      if (!batch) {
        try {
          const batchRes = await api.get('/vouchers');
          batch = batchRes.data.find((b: any) => b.id === batchId);
        } catch(e) {
          console.error("Could not fetch batches list for print info");
        }
      }

      const packageName = batch ? batch.groupname : "Internet Access";
      const batchType = batch ? batch.type : "code";

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocker prevented opening the print window.");
        return;
      }
      printWindow.onafterprint = () => {
        printWindow.close();
      };

      const logoHtml = settings.logoUrl 
        ? `<img src="${settings.logoUrl}" alt="Logo" class="voucher-logo" />`
        : `<svg class="wifi-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`;

      const headerText = settings.headerText || "WIFI INTERNET VOUCHER";
      const ssidBadgeHtml = settings.ssidName 
        ? `<div class="ssid-badge">SSID: <b>${settings.ssidName}</b></div>`
        : "";
        
      const footerTextHtml = settings.footerText
        ? `<div class="footer-text">${settings.footerText}</div>`
        : "";


      const cardsHtml = vouchersList.map((v: any) => {
        let authHtml = "";
        if (batchType === "code") {
            authHtml = `
              <div class="voucher-body">
                <div class="code-label">PIN CODE</div>
                <div class="code-value">${v.code}</div>
              </div>
            `;
        } else {
            authHtml = `
              <div class="voucher-body">
                <div class="auth-row">
                  <span class="auth-label">USER</span>
                  <span class="auth-value">${v.code}</span>
                </div>
                <div class="auth-row" style="margin-bottom:0;">
                  <span class="auth-label">PASS</span>
                  <span class="auth-value">${v.password || ""}</span>
                </div>
              </div>
            `;
        }

        return `
          <div class="voucher-card">
            <div class="voucher-header">
              ${logoHtml}
              <h2>${headerText}</h2>
              ${ssidBadgeHtml}
            </div>
            ${authHtml}
            <div class="voucher-footer">
              <span class="package-name">${packageName}</span>
            </div>
            ${footerTextHtml}
          </div>
        `;
      }).join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Vouchers - Batch ${batchId}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                margin: 0;
                padding: 60px 20px 20px 20px;
                background-color: #fff;
                color: #333;
              }
              .sticky-bar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 44px;
                background-color: #f1f5f9;
                border-bottom: 1px solid #cbd5e1;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 20px;
                z-index: 1000;
              }
              .sticky-title {
                font-size: 14px;
                font-weight: 600;
                color: #334155;
              }
              .close-btn {
                background-color: #e2e8f0;
                color: #0f172a;
                border: 1px solid #cbd5e1;
                padding: 5px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
              }
              .close-btn:hover {
                background-color: #cbd5e1;
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
              }
              .voucher-footer {
                border-top: 1px solid #eee;
                padding-top: 6px;
                text-align: center;
              }
              .package-name {
                font-size: 10px;
                font-weight: 700;
                color: #475569;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .footer-text {
                font-size: 8px;
                color: #64748b;
                text-align: center;
                margin-top: 4px;
                padding-top: 4px;
                border-top: 1px dashed #e2e8f0;
              }
              @media print {
                body { padding: 0; }
                .voucher-card { page-break-inside: avoid; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="sticky-bar no-print">
              <span class="sticky-title">Print Preview - Batch ${batchId}</span>
              <button class="close-btn" onclick="window.close()">Close Preview</button>
            </div>
            <div class="voucher-grid">
              ${cardsHtml}
            </div>
            <script>
              window.addEventListener('afterprint', () => {
                window.close();
              });
              setTimeout(() => {
                window.print();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Print failed:", error);
      toast.error("Failed to load vouchers for printing.");
    }
  }

  return {
    handleGenerate,
    handleSaveSettings,
    handlePrintBatch,
    activeJobId
  }
}
