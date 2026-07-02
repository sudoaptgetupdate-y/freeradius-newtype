import { useAuth } from "@/contexts/auth-context"
import { MasterDashboard } from "./components/MasterDashboard"
import { TenantDashboard } from "./components/TenantDashboard"

export function DashboardPage() {
  const { user, isImpersonating } = useAuth()

  // IMPORTANT: If impersonating, the user should see the Tenant Dashboard
  if (user?.role === "super_admin" && !isImpersonating) {
    return <MasterDashboard />
  }

  return <TenantDashboard />
}
