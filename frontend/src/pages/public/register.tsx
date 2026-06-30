import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-toastify"
import { Loader2, UserPlus, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { PortalLayout } from "@/layouts/portal-layout"

export default function RegisterPage() {
  const { tenantId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [settings, setSettings] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
    acceptedTos: false,
  })

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
        toast.error("Invalid registration link or tenant not found")
      } finally {
        setLoading(false)
      }
    }
    
    if (tenantId) fetchSettings()
  }, [tenantId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (!formData.acceptedTos) {
      toast.error("You must accept the terms of service")
      return
    }
    
    setRegistering(true)
    try {
      await api.post(`/portal/register/${tenantId}`, {
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      })
      setSuccess(true)
    } catch (error: any) {
      console.error("Registration failed:", error)
      toast.error(error.response?.data?.error || "Registration failed")
    } finally {
      setRegistering(false)
    }
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
            <UserPlus className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <CardTitle className="text-xl mb-2">Invalid Link</CardTitle>
          <CardDescription>
            The registration link is invalid or the tenant does not exist.
          </CardDescription>
        </Card>
      </div>
    )
  }

  const getLoginLink = () => `/portal/${tenantId}?${searchParams.toString()}`

  if (!settings.isRegisterEnabled) {
    return (
      <PortalLayout activeTab="register" onTabChange={(tab) => { if (tab === "login") navigate(getLoginLink()) }} settings={settings}>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <CardTitle className="text-xl mb-2 text-[#101522]">Registration Disabled</CardTitle>
          <CardDescription className="text-[#5B6172]">
            Self-registration is currently disabled for {settings.orgName}. Please contact the administrator.
          </CardDescription>
        </div>
      </PortalLayout>
    )
  }

  if (success) {
    return (
      <PortalLayout activeTab="register" onTabChange={(tab) => { if (tab === "login") navigate(getLoginLink()) }} settings={settings}>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="text-green-500 mb-6">
            <CheckCircle2 className="h-16 w-16 mx-auto" />
          </div>
          <CardTitle className="text-2xl mb-2 text-[#101522]">Registration Successful!</CardTitle>
          <CardDescription className="mb-8 text-[#5B6172]">
            Your account has been created. You can now log in to the Wi-Fi network using your username and password.
          </CardDescription>
          <button 
            onClick={() => navigate(getLoginLink())}
            className="h-[46px] px-8 border-none rounded-[9px] text-white text-[14.5px] font-semibold flex items-center justify-center cursor-pointer transition-colors bg-[#0B1F3A] hover:bg-[#16315C]"
            style={settings?.themeColor ? { backgroundColor: settings.themeColor } : {}}
          >
            ไปที่หน้าเข้าสู่ระบบ
          </button>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout 
      activeTab="register" 
      onTabChange={(tab) => {
        if (tab === "login") navigate(getLoginLink())
      }} 
      settings={settings}
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        
        <div className="grid grid-cols-2 gap-3.5 mb-[18px]">
          <div>
            <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">ชื่อจริง</label>
            <input 
              type="text" 
              placeholder="ชื่อจริง"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#E8B339] focus:ring-[3px] focus:ring-[#FBF1DA]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">นามสกุล</label>
            <input 
              type="text" 
              placeholder="นามสกุล"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#E8B339] focus:ring-[3px] focus:ring-[#FBF1DA]"
            />
          </div>
        </div>

        <div className="mb-[18px]">
          <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">เบอร์โทรศัพท์</label>
          <input 
            type="tel" 
            placeholder="08X-XXX-XXXX"
            required
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#E8B339] focus:ring-[3px] focus:ring-[#FBF1DA]"
          />
        </div>

        <div className="mb-[18px]">
          <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">ชื่อผู้ใช้</label>
          <input 
            type="text" 
            placeholder="ตั้งชื่อผู้ใช้"
            required
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#E8B339] focus:ring-[3px] focus:ring-[#FBF1DA]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5 mb-[18px]">
          <div>
            <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">รหัสผ่าน</label>
            <input 
              type="password" 
              placeholder="รหัสผ่าน"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#E8B339] focus:ring-[3px] focus:ring-[#FBF1DA]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">ยืนยันรหัสผ่าน</label>
            <input 
              type="password" 
              placeholder="ยืนยันรหัสผ่าน"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#E8B339] focus:ring-[3px] focus:ring-[#FBF1DA]"
            />
          </div>
        </div>

        {settings.termsOfService && (
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#101522] mb-1.5">ข้อกำหนดและเงื่อนไขการใช้บริการ</label>
            <div className="border border-[#E7E5DE] rounded-[9px] bg-[#FAF9F5] p-3 h-[90px] overflow-y-auto text-[12.5px] text-[#5B6172] leading-[1.6] whitespace-pre-wrap">
              {settings.termsOfService}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 my-3.5 mb-[22px]">
          <input 
            type="checkbox" 
            id="accept"
            checked={formData.acceptedTos}
            onChange={(e) => setFormData({...formData, acceptedTos: e.target.checked})}
            className="w-4 h-4 mt-[2px] cursor-pointer"
            style={{ accentColor: settings.themeColor || "#0B1F3A" }}
          />
          <label htmlFor="accept" className="text-[13px] font-normal text-[#5B6172] cursor-pointer m-0">
            ฉันยอมรับข้อกำหนดและเงื่อนไขการใช้บริการ
          </label>
        </div>

        <button 
          type="submit" 
          disabled={registering}
          className="w-full h-[46px] border-none rounded-[9px] text-white text-[14.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors bg-[#0B1F3A] hover:bg-[#16315C] disabled:opacity-70"
          style={settings?.themeColor ? { backgroundColor: settings.themeColor } : {}}
        >
          {registering && <Loader2 className="h-4 w-4 animate-spin" />}
          สร้างบัญชี
        </button>

        <div className="text-center text-[13px] text-[#5B6172] mt-auto pt-[18px]">
          มีบัญชีอยู่แล้ว? <a onClick={() => navigate(getLoginLink())} className="font-semibold text-[#0B1F3A] cursor-pointer hover:underline" style={settings?.themeColor ? { color: settings.themeColor } : {}}>เข้าสู่ระบบ</a>
        </div>
      </form>
    </PortalLayout>
  )
}
