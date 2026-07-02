import { useState, useEffect } from "react"
import api from "@/lib/api"

export type DashboardStats = {
  totalTenants: number
  onlineUsers: number
  trafficGB: string
  activeVouchers: number
  routerStatus: "online" | "offline" | "unknown"
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    onlineUsers: 0,
    trafficGB: "0 GB",
    activeVouchers: 0,
    routerStatus: "unknown"
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await api.get("/dashboard/stats")
        setStats(response.data)
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return { stats, loading }
}
