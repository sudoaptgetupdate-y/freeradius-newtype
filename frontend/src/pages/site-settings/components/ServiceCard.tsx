import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"

interface ServiceCardProps {
  title: string
  description: string
  icon: any
  colorClass: string
  status?: string
  isConfigured?: boolean
  onClick: () => void
}

export function ServiceCard({ 
  title, 
  description, 
  icon: Icon, 
  colorClass, 
  status, 
  isConfigured, 
  onClick 
}: ServiceCardProps) {
  return (
    <Card 
      onClick={onClick}
      className="cursor-pointer border-border/50 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 group bg-background/50 backdrop-blur-sm flex flex-col h-full"
    >
      <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full relative overflow-hidden flex-1">
        <div className={`absolute top-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${colorClass.replace("text-", "bg-")}`}></div>
        
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 ${colorClass.replace("text-", "bg-").replace("500", "500/10").replace("blue-500", "blue-500/10")} transition-transform group-hover:scale-110 duration-300`}>
          <Icon className={`h-8 w-8 ${colorClass}`} />
        </div>
        
        <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{description}</p>
        
        <div className="mt-auto flex items-center justify-center space-x-1.5 pt-2">
          {status ? (
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${status === "Enabled" || status === "Active" ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
              {status}
            </span>
          ) : (
            isConfigured ? (
              <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Configured
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-medium text-muted-foreground">
                <XCircle className="mr-1 h-3.5 w-3.5" /> Not Configured
              </span>
            )
          )}
        </div>
      </CardContent>
    </Card>
  )
}
