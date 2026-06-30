import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-toastify"
import { Loader2, LogIn, UserPlus } from "lucide-react"
import api from "@/lib/api"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"

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
    <div className="min-h-screen flex flex-col bg-muted/30" style={{ '--primary': settings.themeColor } as any}>
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-16 mx-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <LogIn className="h-8 w-8" />
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{settings.orgName}</h1>
            <p className="text-sm text-muted-foreground">Sign in to connect to the internet</p>
          </div>

          <Card className="border-t-4 shadow-xl" style={{ borderTopColor: settings.themeColor }}>
            <form onSubmit={handleLoginSubmit}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Enter your username"
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    placeholder="Enter your password"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full text-white" 
                  style={{ backgroundColor: settings.themeColor }}
                  disabled={loggingIn}
                >
                  {loggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  Connect
                </Button>

                {settings.isRegisterEnabled && (
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(getRegisterLink())}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register New Account
                  </Button>
                )}

                {settings.isSocialLoginEnabled && (
                  <div className="space-y-3 w-full pt-2 border-t border-border">
                    <p className="text-xs text-center text-muted-foreground uppercase tracking-widest">Or login with</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white hover:bg-red-50 hover:text-red-600 text-black border-red-200"
                        onClick={() => handleSocialLogin("google")}
                      >
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.355-2.845-6.355-6.355s2.845-6.355 6.355-6.355c1.62 0 3.09.61 4.22 1.62l3.05-3.05C19.34 2.25 15.99 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.88 0 11.76-4.83 11.76-11.96 0-.49-.04-.97-.12-1.44H12.24z"/>
                        </svg>
                        Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-[#06C755] hover:bg-[#05b04b] text-white hover:text-white border-none"
                        onClick={() => handleSocialLogin("line")}
                      >
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 10.3c0-5.7-5.4-10.3-12-10.3s-12 4.6-12 10.3c0 5.1 4.3 9.3 10.1 10.1.4.1.9.3 1 .7.1.3.1.8 0 1.1s-.4 1.8-.5 2.1c0 .2-.1.4.1.6.1.1.3.2.5.2.2 0 1.2-.6 2.3-1.4 1-.7 2.1-1.6 2.8-2.2 4.8-1.5 8.2-5.7 8.2-11.2z"/>
                        </svg>
                        LINE
                      </Button>
                    </div>
                  </div>
                )}
                
                {settings.footerNote && (
                  <p className="text-xs text-center text-muted-foreground w-full">
                    {settings.footerNote}
                  </p>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
