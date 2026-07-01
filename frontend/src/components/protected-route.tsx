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

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect based on role if they try to access unauthorized route
    if (user.role === "end_user") {
      return <Navigate to={`/selfcare/${user.tenantId}/dashboard`} replace />
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
