import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useAuth } from "@/contexts/auth-context"
import api from "@/lib/api"

export function useLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await api.post("/auth/login", { email, password })
      const { token, user } = response.data
      
      login(token, user)
      toast.success("Login successful!")
      navigate("/")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid credentials")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleLogin
  }
}
