import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { toast } from "react-toastify"
interface LoginFormProps {
  tenantId: string
  settings: any
  onRegisterClick: () => void
}

export function LoginForm({ tenantId, settings, onRegisterClick }: LoginFormProps) {

  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  // Router params
  const linkLogin = searchParams.get("link-login") || searchParams.get("link-login-only") || ""
  const mac = searchParams.get("mac") || ""
  const ip = searchParams.get("ip") || ""
  const dst = searchParams.get("dst") || ""

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

    // Detect device type
    const deviceType = settings?.primaryDeviceType || 
      (magic && gateway ? "fortigate" : 
       linkLogin ? "mikrotik" : 
       baseGrantUrl ? "meraki" : 
       arubaSubmitUrl ? "aruba" : "standard")

    console.log("Detecting Captive Portal client:", { deviceType, linkLogin, magic, gateway, port, redir })

    const form = document.createElement("form")
    form.method = "POST"

    if (deviceType === "fortigate" && gateway) {
      const protocol = window.location.protocol
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

      if (dst) {
        const dInput = document.createElement("input")
        dInput.type = "hidden"
        dInput.name = "dst"
        dInput.value = dst
        form.appendChild(dInput)
      }

      document.body.appendChild(form)
      form.submit()
    } else if (deviceType === "meraki" && baseGrantUrl) {
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
      setTimeout(() => {
        setLoggingIn(false)
        toast.success(`Mock logged in as ${username}. (Device Type: ${deviceType.toUpperCase()})`)
      }, 1500)
    }
  }

  const handleSocialLogin = (provider: "google" | "line") => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, ""); // strip /api/v1 if present
    const params = new URLSearchParams();
    if (linkLogin) params.append("linkLogin", linkLogin);
    if (mac) params.append("mac", mac);
    if (ip) params.append("ip", ip);
    if (dst) params.append("dst", dst);

    window.location.href = `${baseUrl}/api/v1/auth/${tenantId}/social-auth/${provider}?${params.toString()}`;
  }

  return (
    <form onSubmit={handleLoginSubmit} className="flex-1 flex flex-col">
      <div className="mb-[18px]">
        <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">ชื่อผู้ใช้</label>
        <input 
          type="text" 
          placeholder="กรอกชื่อผู้ใช้"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#0B1F3A] focus:ring-[3px] focus:ring-[#0B1F3A]/10"
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
          className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#0B1F3A] focus:ring-[3px] focus:ring-[#0B1F3A]/10"
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
          ยังไม่มีบัญชี? <a onClick={onRegisterClick} className="font-semibold text-[#0B1F3A] cursor-pointer hover:underline" style={settings?.themeColor ? { color: settings.themeColor } : {}}>สมัครสมาชิกใหม่</a>
        </div>
      )}
    </form>
  )
}
