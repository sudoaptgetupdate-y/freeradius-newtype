import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { LoginPage } from "@/pages/login/index"
import { DashboardLayout } from "@/layouts/dashboard"
import { DashboardPage } from "@/pages/dashboard/index"
import { UsersPage } from "@/pages/users/index"
import TenantsPage from "@/pages/tenants/index"
import { ProfilesPage } from "@/pages/profiles/index"
import { DictionaryPage } from "@/pages/dictionary/index"
import GroupsPage from "@/pages/groups/index"
import NasPage from "@/pages/nas/index"
import AdminsPage from "@/pages/admins/index"
import { VouchersPage } from "@/pages/vouchers/index"
import PortalPage from "@/pages/public/portal-page"
import SettingsPage from "@/pages/settings/index"
import SiteSettings from "@/pages/site-settings/index"
import PortalSettings from "@/pages/portal-settings/index"
import { SelfCareLayout } from "@/layouts/selfcare-layout"
import { SelfCareLogin } from "@/pages/selfcare/login"
import { SelfCareDashboard } from "@/pages/selfcare/dashboard"
import { SelfCareSettings } from "@/pages/selfcare/settings"
import "./i18n"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/:tenantId" element={<PortalPage defaultTab="register" />} />
            <Route path="/portal/:tenantId" element={<PortalPage defaultTab="login" />} />
            <Route path="/selfcare/:tenantId/login" element={<SelfCareLogin />} />
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["super_admin", "tenant_admin"]} />}>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="profiles" element={<ProfilesPage />} />
                <Route path="dictionary" element={<DictionaryPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="nas" element={<NasPage />} />
                <Route path="admins" element={<AdminsPage />} />
                <Route path="vouchers" element={<VouchersPage />} />
                <Route path="portal-settings" element={<PortalSettings />} />
                <Route path="site-settings" element={<SiteSettings />} />
                
                {/* Super Admin Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
                  <Route path="tenants" element={<TenantsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>

            {/* Self-Care Routes */}
            <Route element={<ProtectedRoute allowedRoles={["end_user"]} />}>
              <Route path="/selfcare/:tenantId" element={<SelfCareLayout />}>
                <Route path="dashboard" element={<SelfCareDashboard />} />
                <Route path="settings" element={<SelfCareSettings />} />
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
