import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export type SiteSettingsData = {
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
  telegramEnabled: boolean
  telegramChatId: string
  googleClientIdOverride: string
  googleClientSecretOverride: string
  lineChannelIdOverride: string
  lineChannelSecretOverride: string
  trashRetentionDays: number
}

export function useSiteSettings() {
  const { user, isImpersonating } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")

  // State for modals
  const [isPortalOpen, setIsPortalOpen] = useState(false)
  const [isTelegramOpen, setIsTelegramOpen] = useState(false)
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const [isRetentionOpen, setIsRetentionOpen] = useState(false)
  const [testingTelegram, setTestingTelegram] = useState(false)

  const [settings, setSettings] = useState<SiteSettingsData>({
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
    telegramEnabled: false,
    telegramChatId: "",
    googleClientIdOverride: "",
    googleClientSecretOverride: "",
    lineChannelIdOverride: "",
    lineChannelSecretOverride: "",
    trashRetentionDays: 30,
  })

  const [draftSettings, setDraftSettings] = useState<SiteSettingsData>(settings)

  useEffect(() => {
    if (user?.role === "super_admin" && !isImpersonating) {
      api.get("/tenants").then(res => {
        setTenants(res.data)
        if (res.data.length > 0) {
          setSelectedTenantId(res.data[0].id)
        } else {
          setLoading(false)
        }
      }).catch(err => {
        console.error(err)
        setLoading(false)
      })
    } else if (user?.tenantId) {
      setSelectedTenantId(user.tenantId)
    } else {
      setLoading(false)
    }
  }, [user, isImpersonating])

  useEffect(() => {
    if (selectedTenantId) {
      fetchSettings(selectedTenantId)
    }
  }, [selectedTenantId])

  const fetchSettings = async (targetTenantId: string) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/portal/settings/admin/${targetTenantId}`)
      const fetched: SiteSettingsData = {
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
        telegramEnabled: data.telegramEnabled ?? false,
        telegramChatId: data.telegramChatId || "",
        googleClientIdOverride: data.googleClientIdOverride || "",
        googleClientSecretOverride: data.googleClientSecretOverride || "",
        lineChannelIdOverride: data.lineChannelIdOverride || "",
        lineChannelSecretOverride: data.lineChannelSecretOverride || "",
        trashRetentionDays: data.trashRetentionDays ?? 30,
      }
      setSettings(fetched)
      setDraftSettings(fetched)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleTestTelegram = async () => {
    if (!draftSettings.telegramChatId) {
      toast.error("Please enter a Group Chat ID first")
      return
    }
    setTestingTelegram(true)
    try {
      await api.post('/portal/settings/telegram/test', { chatId: draftSettings.telegramChatId })
      toast.success("Test message sent! Please check your Telegram group.")
    } catch (error: any) {
      console.error("Failed to send test message:", error)
      toast.error(error.response?.data?.error || "Failed to send test message")
    } finally {
      setTestingTelegram(false)
    }
  }

  const handleOpenTelegram = () => {
    setDraftSettings(settings)
    setIsTelegramOpen(true)
  }

  const handleOpenSocial = () => {
    setDraftSettings(settings)
    setIsSocialOpen(true)
  }

  const handleOpenRetention = () => {
    setDraftSettings(settings)
    setIsRetentionOpen(true)
  }

  const handleSaveModal = async (modalType: 'telegram' | 'social' | 'retention') => {
    setSaving(true)
    try {
      const payload: any = { ...settings, ...draftSettings }
      if (user?.role === "super_admin" && !isImpersonating) {
        payload.tenantId = selectedTenantId
      }
      await api.put('/portal/settings', payload)
      setSettings(payload)
      toast.success("Settings saved successfully")
      
      if (modalType === 'telegram') setIsTelegramOpen(false)
      if (modalType === 'social') setIsSocialOpen(false)
      if (modalType === 'retention') setIsRetentionOpen(false)
    } catch (error: any) {
      console.error("Failed to save settings:", error)
      toast.error(error.response?.data?.error || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return {
    user,
    isImpersonating,
    loading,
    saving,
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    isPortalOpen,
    setIsPortalOpen,
    isTelegramOpen,
    setIsTelegramOpen,
    isSocialOpen,
    setIsSocialOpen,
    isRetentionOpen,
    setIsRetentionOpen,
    testingTelegram,
    settings,
    draftSettings,
    setDraftSettings,
    handleTestTelegram,
    handleOpenTelegram,
    handleOpenSocial,
    handleOpenRetention,
    handleSaveModal
  }
}
