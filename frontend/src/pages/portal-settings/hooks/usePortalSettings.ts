import { useState, useEffect, useCallback } from "react"
import { toast } from "react-toastify"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export type PortalSettingsData = {
  orgName: string
  logoUrl: string
  termsOfService: string
  footerNote: string
  isRegisterEnabled: boolean
  isSocialLoginEnabled: boolean
  themeColor: string
  welcomeMessage: string
  leftBgColor: string
  leftTextColor: string
  leftAccentColor: string
  googleClientIdOverride: string
  googleClientSecretOverride: string
  lineChannelIdOverride: string
  lineChannelSecretOverride: string
  telegramEnabled: boolean
  telegramChatId: string
}

const defaultSettings: PortalSettingsData = {
  orgName: "",
  logoUrl: "",
  termsOfService: "",
  footerNote: "",
  isRegisterEnabled: true,
  isSocialLoginEnabled: true,
  themeColor: "#0A2540",
  welcomeMessage: "",
  leftBgColor: "#071D33",
  leftTextColor: "#FFFFFF",
  leftAccentColor: "#F59E0B",
  googleClientIdOverride: "",
  googleClientSecretOverride: "",
  lineChannelIdOverride: "",
  lineChannelSecretOverride: "",
  telegramEnabled: false,
  telegramChatId: "",
}

export function usePortalSettings() {
  const { user, isImpersonating } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [previewTab, setPreviewTab] = useState<"login" | "register">("login")

  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")
  const [settings, setSettings] = useState<PortalSettingsData>(defaultSettings)

  const fetchSettings = useCallback(async (targetTenantId: string) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/portal/settings/admin/${targetTenantId}`)
      setSettings({
        orgName: data.orgName || "",
        logoUrl: data.logoUrl || "",
        termsOfService: data.termsOfService || "",
        footerNote: data.footerNote || "",
        isRegisterEnabled: data.isRegisterEnabled ?? true,
        isSocialLoginEnabled: data.isSocialLoginEnabled ?? true,
        themeColor: data.themeColor || "#0A2540",
        welcomeMessage: data.welcomeMessage || "",
        leftBgColor: data.leftBgColor || "#071D33",
        leftTextColor: data.leftTextColor || "#FFFFFF",
        leftAccentColor: data.leftAccentColor || "#F59E0B",
        googleClientIdOverride: data.googleClientIdOverride || "",
        googleClientSecretOverride: data.googleClientSecretOverride || "",
        lineChannelIdOverride: data.lineChannelIdOverride || "",
        lineChannelSecretOverride: data.lineChannelSecretOverride || "",
        telegramEnabled: data.telegramEnabled ?? false,
        telegramChatId: data.telegramChatId || "",
      })
    } catch (error) {
      console.error("Failed to fetch portal settings:", error)
      toast.error("Failed to load portal settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    if (user?.role === "super_admin" && !isImpersonating) {
      api.get("/tenants").then(res => {
        if (!isMounted) return
        setTenants(res.data)
        if (res.data.length > 0) {
          setSelectedTenantId(res.data[0].id)
        } else {
          setLoading(false)
        }
      }).catch(err => {
        console.error(err)
        if (isMounted) setLoading(false)
      })
    } else if (user?.tenantId) {
      setSelectedTenantId(user.tenantId)
    } else {
      setLoading(false)
    }
    return () => { isMounted = false }
  }, [user, isImpersonating])

  useEffect(() => {
    if (selectedTenantId) {
      fetchSettings(selectedTenantId)
    }
  }, [selectedTenantId, fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any = { ...settings }
      if (user?.role === "super_admin" && !isImpersonating) {
        payload.tenantId = selectedTenantId
      }
      await api.put('/portal/settings', payload)
      toast.success("Portal settings updated successfully")
    } catch (error: any) {
      console.error("Failed to update portal settings:", error)
      toast.error(error.response?.data?.error || "Failed to update portal settings")
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = () => {
    setSettings(prev => ({
      ...prev,
      themeColor: "#0A2540",
      leftBgColor: "#071D33",
      leftTextColor: "#FFFFFF",
      leftAccentColor: "#F59E0B",
    }))
    toast.info("Theme colors reset to Security Shield defaults. Remember to click Save Settings.")
  }

  const handleCopyLink = () => {
    const registerUrl = `${window.location.origin}/register/${selectedTenantId}`
    navigator.clipboard.writeText(registerUrl)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return {
    user,
    isImpersonating,
    loading,
    saving,
    copied,
    currentStep,
    setCurrentStep,
    previewTab,
    setPreviewTab,
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    settings,
    setSettings,
    handleSave,
    handleResetDefaults,
    handleCopyLink
  }
}
