import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-toastify"
import { Loader2 } from "lucide-react"
import api from "@/lib/api"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { PortalLayout } from "@/layouts/portal-layout"

export default function PortalLoginPage() {
  const { tenantId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  
  // Router params
  const linkLogin = searchParams.get("link-login") || searchParams.get("link-login-only") || ""
  const mac = searchParams.get("mac") || ""
  const ip = searchParams.get("ip") || ""
  const errorMsg = searchParams.get("error") || ""
  const dst = searchParams.get("dst") || ""

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get(`/portal/settings/${tenantId}`)
        setSettings(data)
        // Apply theme color
        if (data.themeColor) {
          document.documentElement.style.setProperty('--primary', data.themeColor)
        }
      } catch (error) {
        console.error("Failed to fetch portal settings:", error)
        toast.error("Invalid portal link or tenant not found")
      } finally {
        setLoading(false)
      }
    }
    
    if (tenantId) {
      fetchSettings()
    }
    
    if (errorMsg) {
      toast.error(`Router Error: ${errorMsg}`)
    }
  }, [tenantId, errorMsg])

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error("Please enter both username and password")
      return
    }

    setLoggingIn(true)

    // Retrieve parameters for different vendors
    const magic = searchParams.get("magic") || ""
    const gateway = searchParams.get("gateway") || ""
    const port = searchParams.get("port") || ""
    const redir = searchParams.get("redir") || searchParams.get("continue") || searchParams.get("url") || dst
    
    // Cisco Meraki parameters
    const baseGrantUrl = searchParams.get("base_grant_url") || ""
    const userContinueUrl = searchParams.get("user_continue_url") || ""

    // Aruba parameters
    const arubaSubmitUrl = searchParams.get("submit_url") || ""

    // Detect device type (either explicitly configured in settings, or auto-detected from query params)
    const deviceType = settings?.primaryDeviceType || 
      (magic && gateway ? "fortigate" : 
       linkLogin ? "mikrotik" : 
       baseGrantUrl ? "meraki" : 
       arubaSubmitUrl ? "aruba" : "standard")

    console.log("Detecting Captive Portal client:", { deviceType, linkLogin, magic, gateway, port, redir })

    const form = document.createElement("form")
    form.method = "POST"

    if (deviceType === "fortigate" && gateway) {
      // Fortigate Auth Submission (https://<gateway>:<port>/fgtauth)
      // Usually uses port 1000 or 1003 for HTTPS
      const protocol = window.location.protocol // Use current protocol as default
      const gatewayPort = port || "1003"
      form.action = `${protocol}//${gateway}:${gatewayPort}/fgtauth`

      const uInput = document.createElement("input")
      uInput.type = "hidden"
      uInput.name = "username"
      uInput.value = username
      form.appendChild(uInput)
      
      const pInput = document.createElement("input")
      pInput.type = "hidden"
      pInput.name = "password"
      pInput.value = password
      form.appendChild(pInput)

      const mInput = document.createElement("input")
      mInput.type = "hidden"
      mInput.name = "magic"
      mInput.value = magic
      form.appendChild(mInput)

      if (redir) {
        const rInput = document.createElement("input")
        rInput.type = "hidden"
        rInput.name = "redir"
        rInput.value = redir
        form.appendChild(rInput)
      }

      document.body.appendChild(form)
      form.submit()
    } else if (deviceType === "mikrotik" && linkLogin) {
      // Mikrotik Auth Submission
      form.action = linkLogin
      
      const uInput = document.createElement("input")
      uInput.type = "hidden"
      uInput.name = "username"
      uInput.value = username
      form.appendChild(uInput)
      
      const pInput = document.createElement("input")
      pInput.type = "hidden"
      pInput.name = "password"
      pInput.value = password
      form.appendChild(pInput)

      if (redir) {
        const dInput = document.createElement("input")
        dInput.type = "hidden"
        dInput.name = "dst"
        dInput.value = redir
        form.appendChild(dInput)
      }

      document.body.appendChild(form)
      form.submit()
    } else if (deviceType === "meraki" && baseGrantUrl) {
      // Cisco Meraki Auth Submission
      form.action = baseGrantUrl
      
      const uInput = document.createElement("input")
      uInput.type = "hidden"
      uInput.name = "username"
      uInput.value = username
      form.appendChild(uInput)
      
      const pInput = document.createElement("input")
      pInput.type = "hidden"
      pInput.name = "password"
      pInput.value = password
      form.appendChild(pInput)

      if (userContinueUrl) {
        const cInput = document.createElement("input")
        cInput.type = "hidden"
        cInput.name = "continue_url"
        cInput.value = userContinueUrl
        form.appendChild(cInput)
      }

      document.body.appendChild(form)
      form.submit()
    } else if (deviceType === "aruba" && arubaSubmitUrl) {
      // Aruba Controller Auth Submission
      form.action = arubaSubmitUrl
      
      const uInput = document.createElement("input")
      uInput.type = "hidden"
      uInput.name = "user"
      uInput.value = username
      form.appendChild(uInput)
      
      const pInput = document.createElement("input")
      pInput.type = "hidden"
      pInput.name = "password"
      pInput.value = password
      form.appendChild(pInput)

      document.body.appendChild(form)
      form.submit()
    } else {
      // Fallback: If we don't have enough parameters to construct form action, simulate/mock
      setTimeout(() => {
        setLoggingIn(false)
        toast.success(`Mock logged in as ${username}. (Device Type: ${deviceType.toUpperCase()})`)
      }, 1500)
    }
  }

  const handleSocialLogin = (provider: "google" | "line") => {
    toast.info(`Login with ${provider} will be available in the next update.`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-destructive mb-4">
            <LogIn className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <CardTitle className="text-xl mb-2">Invalid Link</CardTitle>
          <CardDescription>
            The captive portal link is invalid or the tenant does not exist.
          </CardDescription>
        </Card>
      </div>
    )
  }

  // Helper to carry query params forward to register page
  const getRegisterLink = () => {
    const params = new URLSearchParams()
    if (linkLogin) params.set("link-login", linkLogin)
    if (mac) params.set("mac", mac)
    if (ip) params.set("ip", ip)
    if (dst) params.set("dst", dst)
    return `/register/${tenantId}?${params.toString()}`
  }

  return (
    <PortalLayout 
      activeTab="login" 
      onTabChange={(tab) => {
        if (tab === "register") navigate(getRegisterLink())
      }} 
      settings={settings}
    >
      <form onSubmit={handleLoginSubmit} className="flex-1 flex flex-col">
        
        <div className="mb-[18px]">
          <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">ชื่อผู้ใช้</label>
          <input 
            type="text" 
            placeholder="กรอกชื่อผู้ใช้"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#E8B339] focus:ring-[3px] focus:ring-[#FBF1DA]"
          />
        </div>
        
        <div className="mb-2">
          <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">รหัสผ่าน</label>
          <input 
            type="password" 
            placeholder="กรอกรหัสผ่าน"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#E8B339] focus:ring-[3px] focus:ring-[#FBF1DA]"
          />
        </div>
        
        <div className="text-right mb-5">
          <a className="text-[12.5px] text-[#5B6172] cursor-pointer hover:text-[#0B1F3A]">ลืมรหัสผ่าน?</a>
        </div>
        
        <button 
          type="submit" 
          disabled={loggingIn}
          className="w-full h-[46px] border-none rounded-[9px] text-white text-[14.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors bg-[#0B1F3A] hover:bg-[#16315C] disabled:opacity-70"
          style={settings?.themeColor ? { backgroundColor: settings.themeColor } : {}}
        >
          {loggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
          เชื่อมต่ออินเทอร์เน็ต
        </button>

        {settings.isSocialLoginEnabled && (
          <>
            <div className="flex items-center gap-3 my-[22px] text-[#9498A4] text-[12px] before:content-[''] before:flex-1 before:h-[1px] before:bg-[#E7E5DE] after:content-[''] after:flex-1 after:h-[1px] after:bg-[#E7E5DE]">
              หรือเข้าสู่ระบบด้วย
            </div>
            
            <div className="flex gap-2.5 mb-2">
              <button 
                type="button"
                onClick={() => handleSocialLogin("google")}
                className="flex-1 h-[42px] rounded-[9px] border border-[#E7E5DE] bg-white text-[13.5px] font-medium text-[#101522] cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-[#FAF9F5] hover:border-[#9498A4]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.55-5.17 3.55-8.65z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.25 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.3c-.25-.72-.38-1.5-.38-2.3s.13-1.58.38-2.3v-3.1H1.27A11.93 11.93 0 0 0 0 12c0 1.93.46 3.76 1.27 5.4l4-3.1z"/><path fill="#EA4335" d="M12 4.74c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.18 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4 3.1C6.22 6.85 8.87 4.74 12 4.74z"/></svg>
                Google
              </button>
              <button 
                type="button"
                onClick={() => handleSocialLogin("line")}
                className="flex-1 h-[42px] rounded-[9px] border border-[#E7E5DE] bg-white text-[13.5px] font-medium text-[#101522] cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-[#FAF9F5] hover:border-[#9498A4]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#06C755" d="M12 0C5.37 0 0 4.48 0 10c0 4.94 4.29 9.07 10.08 9.86.39.08.92.26 1.06.6.12.31.08.79.04 1.1l-.17 1.05c-.05.31-.24 1.2 1.05.65 1.29-.54 6.96-4.1 9.5-7.03C23.16 14.07 24 12.13 24 10c0-5.52-5.37-10-12-10z"/></svg>
                LINE
              </button>
            </div>
          </>
        )}

        {settings.isRegisterEnabled && (
          <div className="text-center text-[13px] text-[#5B6172] mt-auto pt-4">
            ยังไม่มีบัญชี? <a onClick={() => navigate(getRegisterLink())} className="font-semibold text-[#0B1F3A] cursor-pointer hover:underline" style={settings?.themeColor ? { color: settings.themeColor } : {}}>สมัครสมาชิกใหม่</a>
          </div>
        )}
      </form>
    </PortalLayout>
  )
}
