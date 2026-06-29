import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { LoginPage } from "@/pages/login"
import { DashboardLayout } from "@/layouts/dashboard"
import { DashboardPage } from "@/pages/dashboard"
import { UsersPage } from "@/pages/users"
import TenantsPage from "@/pages/tenants"
import { ProfilesPage } from "@/pages/profiles"
import NasPage from "@/pages/nas"
import AdminsPage from "@/pages/admins"
import "./i18n"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="profiles" element={<ProfilesPage />} />
                <Route path="nas" element={<NasPage />} />
                <Route path="admins" element={<AdminsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </ThemeProvider>
  )
}

export default App
