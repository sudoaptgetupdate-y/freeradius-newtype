import { useNavigate } from "react-router-dom"
import { LogOut, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import api from "@/lib/api"
import { toast } from "react-toastify"

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedTenantName, exitImpersonation } = useAuth()
  const navigate = useNavigate()

  if (!isImpersonating) return null

  const handleExit = async () => {
    try {
      // Call backend to get a fresh master token (even though we have it in localStorage,
      // this ensures consistency and could revoke the impersonation token server-side in future)
      await api.post("/auth/exit-impersonate")
    } catch {
      // Ignore backend errors — we still restore from localStorage
    }

    const restored = exitImpersonation()
    if (restored) {
      toast.success("Exited impersonation mode")
      navigate("/tenants")
    }
  }

  return (
    <div className="bg-amber-500 dark:bg-amber-600 text-white w-full z-50 px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-2.5 min-w-0">
        <ShieldAlert className="h-4 w-4 shrink-0 animate-pulse" />
        <span className="text-sm font-semibold truncate">
          Impersonation Mode — Managing:{" "}
          <span className="font-bold underline underline-offset-2">
            {impersonatedTenantName}
          </span>
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-3 text-xs font-semibold bg-white/20 hover:bg-white/30 border-white/40 text-white hover:text-white shrink-0 rounded-full"
        onClick={handleExit}
      >
        <LogOut className="h-3 w-3 mr-1.5" />
        Exit
      </Button>
    </div>
  )
}
