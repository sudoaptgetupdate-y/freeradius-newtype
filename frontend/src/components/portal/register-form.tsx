import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "react-toastify"
import api from "@/lib/api"

interface RegisterFormProps {
  tenantId: string
  settings: any
  onLoginClick: () => void
}

export function RegisterForm({ tenantId, settings, onLoginClick }: RegisterFormProps) {
  const [registering, setRegistering] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
    acceptedTos: false,
  })

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

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <div className="text-green-500 mb-6">
          <CheckCircle2 className="h-16 w-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-[#101522]">ลงทะเบียนสำเร็จ!</h2>
        <p className="mb-8 text-[#5B6172] text-[14px]">
          สร้างบัญชีของคุณเรียบร้อยแล้ว สามารถเข้าสู่ระบบใช้งานอินเทอร์เน็ตได้ทันที
        </p>
        <button 
          onClick={onLoginClick}
          className="h-[46px] px-8 border-none rounded-[9px] text-white text-[14.5px] font-semibold flex items-center justify-center cursor-pointer transition-colors bg-[#0B1F3A] hover:bg-[#16315C]"
          style={settings?.themeColor ? { backgroundColor: settings.themeColor } : {}}
        >
          ไปที่หน้าเข้าสู่ระบบ
        </button>
      </div>
    )
  }

  return (
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
            className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#0B1F3A] focus:ring-[3px] focus:ring-[#0B1F3A]/10"
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
            className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#0B1F3A] focus:ring-[3px] focus:ring-[#0B1F3A]/10"
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
          className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#0B1F3A] focus:ring-[3px] focus:ring-[#0B1F3A]/10"
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
          className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#0B1F3A] focus:ring-[3px] focus:ring-[#0B1F3A]/10"
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
            className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#0B1F3A] focus:ring-[3px] focus:ring-[#0B1F3A]/10"
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
            className="w-full h-[42px] px-3.5 border border-[#E7E5DE] rounded-[9px] text-[14px] text-[#101522] bg-white outline-none transition-all focus:border-[#0B1F3A] focus:ring-[3px] focus:ring-[#0B1F3A]/10"
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
        มีบัญชีอยู่แล้ว? <a onClick={onLoginClick} className="font-semibold text-[#0B1F3A] cursor-pointer hover:underline" style={settings?.themeColor ? { color: settings.themeColor } : {}}>เข้าสู่ระบบ</a>
      </div>
    </form>
  )
}
