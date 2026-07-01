import type { ReactNode } from "react"
import { PhoneCall } from "lucide-react"
import { motion } from "framer-motion"

interface PortalLayoutProps {
  children: ReactNode
  activeTab: "login" | "register"
  onTabChange: (tab: "login" | "register") => void
  settings: any
}

export function PortalLayout({ children, activeTab, onTabChange, settings }: PortalLayoutProps) {
  // Use settings colors if provided, fallback to mockup default colors
  const primaryColor = settings?.themeColor || "#0A2540"
  const leftBgColor = settings?.leftBgColor || "#071D33"
  const leftTextColor = settings?.leftTextColor || "#FFFFFF"
  const leftAccentColor = settings?.leftAccentColor || "#F59E0B"
  
  // Custom styles for dynamic colors
  const customStyles = {
    "--primary-color": primaryColor,
    "--brand-bg": leftBgColor,
    "--brand-text": leftTextColor,
    "--brand-accent": leftAccentColor,
  } as React.CSSProperties

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-8" 
      style={{ 
        backgroundColor: "#FAF9F5", 
        fontFamily: "'Sarabun', 'Inter', sans-serif",
        color: "#101522",
        ...customStyles 
      }}
    >
      <motion.div 
        layout 
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full max-w-[960px] bg-white rounded-[20px] border border-[#E7E5DE] grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-xl"
      >
        
        {/* LEFT: brand panel (Hidden on small screens) */}
        <div 
          className="hidden md:flex flex-col justify-between relative overflow-hidden"
          style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)", padding: "48px 40px" }}
        >
          {/* Dot Grid Background */}
          <div 
            className="absolute -right-[40px] -bottom-[40px] w-[260px] h-[260px] opacity-70 z-10"
            style={{ 
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1.5px, transparent 1.5px)", 
              backgroundSize: "18px 18px" 
            }}
          />
          
          <div className="relative z-20 flex flex-col items-center text-center">
            {settings?.logoUrl ? (
              <div className="mb-7 bg-white/10 p-2 rounded-xl inline-block backdrop-blur-sm mx-auto">
                <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto object-contain" onError={(e: any) => (e.currentTarget.style.display = 'none')} />
              </div>
            ) : (
              <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center mb-7 mx-auto" style={{ backgroundColor: "var(--brand-accent)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-[24px] h-[24px]">
                  <path d="M3 10C3 10 7 5 12 5C17 5 21 10 21 10" stroke="var(--brand-bg)" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M6.5 13.5C6.5 13.5 9 10.5 12 10.5C15 10.5 17.5 13.5 17.5 13.5" stroke="var(--brand-bg)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="18" r="1.8" fill="var(--brand-bg)"/>
                </svg>
              </div>
            )}
            
            <h1 className="text-[26px] font-bold leading-[1.4] mb-3 font-sarabun whitespace-pre-line">
              {settings?.orgName || "NT WiFi Portal"}
            </h1>
            <p className="text-[15px] leading-[1.7] max-w-[320px] font-sarabun mx-auto whitespace-pre-line" style={{ opacity: 0.8 }}>
              {settings?.welcomeMessage || "เชื่อมต่อเครือข่าย WiFi องค์กรอย่างปลอดภัย ลงทะเบียนหรือเข้าสู่ระบบเพื่อเริ่มใช้งานอินเทอร์เน็ต"}
            </p>
          </div>
          
          <div className="relative z-20 mt-10 flex flex-col items-center text-center">
            {/* Signal Animation */}
            <div className="flex gap-[6px] items-end justify-center">
              <div className="w-[6px] rounded-[3px] h-[14px]" style={{ backgroundColor: "var(--brand-accent)" }}></div>
              <div className="w-[6px] rounded-[3px] h-[22px]" style={{ backgroundColor: "var(--brand-accent)" }}></div>
              <div className="w-[6px] rounded-[3px] h-[30px]" style={{ backgroundColor: "var(--brand-accent)" }}></div>
              <div className="w-[6px] rounded-[3px] h-[38px]" style={{ backgroundColor: "var(--brand-accent)" }}></div>
              <div className="w-[6px] rounded-[3px] h-[46px] opacity-35" style={{ backgroundColor: "var(--brand-accent)" }}></div>
            </div>
            <div className="text-[12px] mt-2.5 tracking-wider font-inter" style={{ opacity: 0.6 }}>
              สัญญาณเครือข่ายพร้อมใช้งาน
            </div>
            
            <div className="mt-9 pt-4 text-[13px] border-t border-current/20 font-sarabun w-full" style={{ opacity: 0.8 }}>
              มีปัญหาการใช้งาน ติดต่อผู้ดูแลระบบ<br />
              <a href={`tel:${settings?.footerNote || "075343212"}`} className="font-medium no-underline flex items-center justify-center gap-1.5 mt-1" style={{ color: "var(--brand-accent)" }}>
                <PhoneCall className="w-3.5 h-3.5" />
                {settings?.footerNote || "075 343 212"}
              </a>
            </div>
          </div>
        </div>
        
        {/* RIGHT: form panel */}
        <div className="flex flex-col p-8 md:p-[44px]">
          
          {/* Mobile Header (Hidden on md and larger) */}
          <div className="md:hidden flex flex-col items-center text-center mb-6">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-3" onError={(e: any) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "var(--brand-accent)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-[24px] h-[24px]">
                  <path d="M3 10C3 10 7 5 12 5C17 5 21 10 21 10" stroke="var(--brand-bg)" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M6.5 13.5C6.5 13.5 9 10.5 12 10.5C15 10.5 17.5 13.5 17.5 13.5" stroke="var(--brand-bg)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="18" r="1.8" fill="var(--brand-bg)"/>
                </svg>
              </div>
            )}
            <h1 className="text-[20px] font-bold text-[#101522] font-sarabun whitespace-pre-line">
              {settings?.orgName || "NT WiFi Portal"}
            </h1>
          </div>

          {/* Tabs */}
          {settings?.isRegisterEnabled !== false && (
            <div className="flex bg-[#FAF9F5] border border-[#E7E5DE] rounded-[10px] p-1 mb-8">
              <button 
                type="button"
                onClick={() => onTabChange("login")}
                className={`flex-1 text-center py-2.5 text-[14px] rounded-[7px] cursor-pointer select-none transition-all duration-150 ${activeTab === 'login' ? 'bg-white text-[#0B1F3A] border border-[#E7E5DE] font-semibold shadow-sm' : 'text-[#5B6172] font-medium hover:text-[#101522]'}`}
              >
                เข้าสู่ระบบ
              </button>
              <button 
                type="button"
                onClick={() => onTabChange("register")}
                className={`flex-1 text-center py-2.5 text-[14px] rounded-[7px] cursor-pointer select-none transition-all duration-150 ${activeTab === 'register' ? 'bg-white text-[#0B1F3A] border border-[#E7E5DE] font-semibold shadow-sm' : 'text-[#5B6172] font-medium hover:text-[#101522]'}`}
              >
                สมัครสมาชิก
              </button>
            </div>
          )}
          
          {/* Content Area */}
          <div className="flex-1 flex flex-col font-sarabun">
            {children}
          </div>
          
        </div>
      </motion.div>
    </div>
  )
}
