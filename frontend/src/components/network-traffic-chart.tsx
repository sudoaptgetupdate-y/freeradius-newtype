import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useTheme } from "./theme-provider"

const data = [
  { time: "00:00", upload: 120, download: 450 },
  { time: "04:00", upload: 80, download: 200 },
  { time: "08:00", upload: 400, download: 1200 },
  { time: "12:00", upload: 600, download: 2400 },
  { time: "16:00", upload: 750, download: 3100 },
  { time: "20:00", upload: 500, download: 1800 },
  { time: "24:00", upload: 200, download: 800 },
]

export function NetworkTrafficChart() {
  const { theme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5d87ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#5d87ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#49beff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#49beff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333f55" : "#dfe5ef"} />
          <XAxis 
            dataKey="time" 
            stroke={isDark ? "#7c8fac" : "#5a6a85"} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke={isDark ? "#7c8fac" : "#5a6a85"} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value} GB`} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? "#1c2536" : "#ffffff",
              borderColor: isDark ? "#333f55" : "#dfe5ef",
              borderRadius: "10px",
              boxShadow: "0 1px 4px rgba(133, 146, 173, 0.2)"
            }}
            itemStyle={{ color: isDark ? "#ffffff" : "#1c2536" }}
          />
          <Area 
            type="monotone" 
            dataKey="download" 
            name="Download"
            stroke="#5d87ff" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorDownload)" 
          />
          <Area 
            type="monotone" 
            dataKey="upload" 
            name="Upload"
            stroke="#49beff" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorUpload)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
