import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user) {
    // If simulating a tenant, block access to Master Admin only routes
    const isMasterAdminOnlyRoute = allowedRoles.length === 1 && allowedRoles[0] === "super_admin"
    if (isMasterAdminOnlyRoute && user.isImpersonating) {
      return <Navigate to="/" replace />
    }

    if (!allowedRoles.includes(user.role)) {
      // Redirect based on role if they try to access unauthorized route
      if (user.role === "end_user") {
        return <Navigate to={`/selfcare/${user.tenantId}/dashboard`} replace />
      }
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}
