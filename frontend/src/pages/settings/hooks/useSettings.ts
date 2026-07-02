import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "react-toastify"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export const settingsSchema = z.object({
  telegramToken: z.string().optional().nullable(),
  telegramBotId: z.string().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  telegramEnabled: z.boolean().optional().nullable().default(false),
  redisHost: z.string().optional().nullable(),
  redisPort: z.coerce.number().optional().nullable(),
  redisPassword: z.string().optional().nullable(),
  lokiUrl: z.string().optional().nullable(),
  vectorPort: z.coerce.number().optional().nullable(),
  smtpHost: z.string().optional().nullable(),
  smtpPort: z.coerce.number().optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPassword: z.string().optional().nullable(),
  smtpSender: z.string().optional().nullable(),
  timezone: z.string().optional().nullable().default("Asia/Bangkok"),
  googleClientId: z.string().optional().nullable(),
  googleClientSecret: z.string().optional().nullable(),
  lineChannelId: z.string().optional().nullable(),
  lineChannelSecret: z.string().optional().nullable(),
})

export type DialogType = "redis" | "telegram" | "logs" | "smtp" | "general" | "social" | null

export function useSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      telegramEnabled: false,
      timezone: "Asia/Bangkok",
      telegramToken: null as string | null,
      telegramBotId: null as string | null,
      telegramChatId: null as string | null,
      redisHost: null as string | null,
      redisPort: null as number | null,
      redisPassword: null as string | null,
      lokiUrl: null as string | null,
      vectorPort: null as number | null,
      smtpHost: null as string | null,
      smtpPort: null as number | null,
      smtpUser: null as string | null,
      smtpPassword: null as string | null,
      smtpSender: null as string | null,
      googleClientId: null as string | null,
      googleClientSecret: null as string | null,
      lineChannelId: null as string | null,
      lineChannelSecret: null as string | null,
    }
  })

  useEffect(() => {
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await api.get("/settings")
      // Merge defaults in case db record is empty
      form.reset({
        telegramEnabled: false,
        timezone: "Asia/Bangkok",
        ...res.data
      })
    } catch {
      toast.error("Failed to load global settings")
    } finally {
      setLoading(false)
    }
  }

  const onInvalid = (errors: any) => {
    console.error("Form Validation Errors:", errors)
    const firstErrKey = Object.keys(errors)[0]
    if (firstErrKey) {
      toast.error(`Validation Error (${firstErrKey}): ${errors[firstErrKey].message || 'Invalid value'}`)
    } else {
      toast.error("Form validation failed. Please check your inputs.")
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setSaving(true)
      await api.put("/settings", data)
      toast.success("Configuration updated successfully!")
      setActiveDialog(null) // Close dialog on success
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSyncWebhook = async () => {
    const url = window.prompt("Enter your public server URL (e.g. https://my-ngrok-url.app) to sync webhook:")
    if (!url) return
    
    try {
      setSaving(true)
      await api.post("/settings/telegram/sync-webhook", { webhookUrl: url.replace(/\/$/, "") })
      toast.success("Webhook synchronized successfully!")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to sync webhook")
    } finally {
      setSaving(false)
    }
  }

  return {
    user,
    loading,
    saving,
    activeDialog,
    setActiveDialog,
    form,
    fetchSettings,
    onSubmit,
    onInvalid,
    handleSyncWebhook
  }
}
