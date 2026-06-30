import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-toastify"
import { Loader2, UserPlus, CheckCircle2, ArrowLeft } from "lucide-react"
import api from "@/lib/api"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"

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

  if (!settings.isRegisterEnabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4" style={{ '--primary': settings.themeColor } as any}>
        <div className="absolute top-4 right-4 flex gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <Card className="max-w-md w-full text-center p-8 border-t-4" style={{ borderTopColor: settings.themeColor }}>
          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="h-16 mx-auto mb-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          )}
          <CardTitle className="text-xl mb-2">Registration Disabled</CardTitle>
          <CardDescription>
            Self-registration is currently disabled for {settings.orgName}. Please contact the administrator.
          </CardDescription>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4" style={{ '--primary': settings.themeColor } as any}>
        <Card className="max-w-md w-full text-center p-8 border-t-4" style={{ borderTopColor: settings.themeColor }}>
          <div className="text-green-500 mb-6 flex justify-center">
            <CheckCircle2 className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl mb-2">Registration Successful!</CardTitle>
          <CardDescription className="mb-6">
            Your account has been created. You can now log in to the Wi-Fi network using your username and password.
          </CardDescription>
          <Button 
            className="w-full" 
            style={{ backgroundColor: settings.themeColor }}
            onClick={() => navigate(`/portal/${tenantId}?${searchParams.toString()}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Login
          </Button>
        </Card>
      </div>
    )
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
                <UserPlus className="h-8 w-8" />
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{settings.orgName}</h1>
            <p className="text-sm text-muted-foreground">Create an account to access the internet</p>
          </div>

          <Card className="border-t-4 shadow-xl" style={{ borderTopColor: settings.themeColor }}>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      required 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      required 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    required 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      required 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      required 
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>

                {settings.termsOfService && (
                  <div className="pt-2">
                    <Label className="mb-2 block">Terms of Service</Label>
                    <div className="h-32 w-full rounded-md border border-input bg-muted/50 p-3 text-sm overflow-y-auto whitespace-pre-wrap">
                      {settings.termsOfService}
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox 
                    id="terms" 
                    checked={formData.acceptedTos}
                    onCheckedChange={(checked: any) => setFormData({...formData, acceptedTos: !!checked})}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I accept the terms and conditions
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full text-white" 
                  style={{ backgroundColor: settings.themeColor }}
                  disabled={registering}
                >
                  {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
                
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
