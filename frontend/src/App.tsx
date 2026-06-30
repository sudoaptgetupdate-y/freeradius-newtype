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
import { DictionaryPage } from "@/pages/dictionary"
import NasPage from "@/pages/nas"
import AdminsPage from "@/pages/admins"
import { VouchersPage } from "@/pages/vouchers"
import RegisterPage from "@/pages/public/register"
import PortalLoginPage from "@/pages/public/portal-login"
import SettingsPage from "@/pages/settings"
import PortalSettings from "@/pages/portal-settings"
import "./i18n"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/:tenantId" element={<RegisterPage />} />
            <Route path="/portal/:tenantId" element={<PortalLoginPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="profiles" element={<ProfilesPage />} />
                <Route path="dictionary" element={<DictionaryPage />} />
                <Route path="nas" element={<NasPage />} />
                <Route path="admins" element={<AdminsPage />} />
                <Route path="vouchers" element={<VouchersPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="portal-settings" element={<PortalSettings />} />
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
