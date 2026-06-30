import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Server, MessageSquare, Database, Mail, RefreshCw, Settings, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Navigate } from "react-router-dom";

const settingsSchema = z.object({
  telegramToken: z.string().optional().nullable(),
  telegramBotId: z.string().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  telegramEnabled: z.boolean().optional().nullable().default(false),
  redisHost: z.string().optional().nullable(),
  redisPort: z.coerce.number().optional().nullable(),
  redisPassword: z.string().optional().nullable(),
  lokiUrl: z.string().optional().nullable(),
  vectorPort: z.coerce.number().optional().nullable(),
  smtpHost: z.string().optional().nullable(),
  smtpPort: z.coerce.number().optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPassword: z.string().optional().nullable(),
  smtpSender: z.string().optional().nullable(),
  timezone: z.string().optional().nullable().default("Asia/Bangkok"),
  googleClientId: z.string().optional().nullable(),
  googleClientSecret: z.string().optional().nullable(),
  lineChannelId: z.string().optional().nullable(),
  lineChannelSecret: z.string().optional().nullable(),
});

type DialogType = "redis" | "telegram" | "logs" | "smtp" | "general" | "social" | null;

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      telegramEnabled: false,
      timezone: "Asia/Bangkok",
    }
  });

  const telegramEnabled = watch("telegramEnabled");
  // Watch values for status indicators
  const currentValues = watch();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings");
      // Merge defaults in case db record is empty
      reset({
        telegramEnabled: false,
        timezone: "Asia/Bangkok",
        ...res.data
      });
    } catch (error) {
      toast.error("Failed to load global settings");
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Form Validation Errors:", errors);
    const firstErrKey = Object.keys(errors)[0];
    if (firstErrKey) {
      toast.error(`Validation Error (${firstErrKey}): ${errors[firstErrKey].message || 'Invalid value'}`);
    } else {
      toast.error("Form validation failed. Please check your inputs.");
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setSaving(true);
      await api.put("/settings", data);
      toast.success("Configuration updated successfully!");
      setActiveDialog(null); // Close dialog on success
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p>Loading System Configuration...</p>
        </div>
      </div>
    );
  }

  const isRedisConfigured = !!currentValues.redisHost;
  const isLokiConfigured = !!currentValues.lokiUrl;
  const isSmtpConfigured = !!currentValues.smtpHost;

  const ServiceCard = ({ 
    title, description, icon: Icon, colorClass, status, isConfigured, onClick 
  }: { 
    title: string, description: string, icon: any, colorClass: string, status?: string, isConfigured?: boolean, onClick: () => void 
  }) => (
    <Card 
      onClick={onClick}
      className="cursor-pointer border-border/50 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 group bg-background/50 backdrop-blur-sm"
    >
      <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full relative overflow-hidden">
        <div className={`absolute top-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${colorClass.replace("text-", "bg-")}`}></div>
        
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 ${colorClass.replace("text-", "bg-").replace("500", "500/10")} transition-transform group-hover:scale-110 duration-300`}>
          <Icon className={`h-8 w-8 ${colorClass}`} />
        </div>
        
        <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="mt-auto flex items-center justify-center space-x-1.5 pt-2">
          {status ? (
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${telegramEnabled ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-muted text-muted-foreground'}`}>
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
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">System Control Panel</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Click on a module tile below to configure its settings.
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchSettings} 
          disabled={loading || saving}
          className="bg-background shadow-sm h-10 px-5 rounded-lg border-border/50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload System State
        </Button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600/90 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3 text-sm">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">Service Restart Required</span>
          Changes made to infrastructure modules (Redis, Loki, Vector) will require a manual restart of the backend service to re-establish connections.
        </div>
      </div>

      {/* Grid of Control Panel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ServiceCard 
          title="Redis Server" 
          description="Manage connection for BullMQ background workers and cache." 
          icon={Database} 
          colorClass="text-emerald-500" 
          isConfigured={isRedisConfigured}
          onClick={() => setActiveDialog("redis")} 
        />
        <ServiceCard 
          title="Telegram Bot" 
          description="Configure bot API token for server alerts and guest approvals." 
          icon={MessageSquare} 
          colorClass="text-blue-500" 
          status={telegramEnabled ? "Bot Enabled" : "Bot Disabled"}
          onClick={() => setActiveDialog("telegram")} 
        />
        <ServiceCard 
          title="Logging Engine" 
          description="Set up Grafana Loki URL and Vector Receiver ports." 
          icon={Server} 
          colorClass="text-orange-500" 
          isConfigured={isLokiConfigured}
          onClick={() => setActiveDialog("logs")} 
        />
        <ServiceCard 
          title="SMTP Settings" 
          description="Email delivery configuration for reports and password resets." 
          icon={Mail} 
          colorClass="text-violet-500" 
          isConfigured={isSmtpConfigured}
          onClick={() => setActiveDialog("smtp")} 
        />
        <ServiceCard 
          title="Social Login API" 
          description="Global OAuth credentials for Google and LINE." 
          icon={Settings} 
          colorClass="text-pink-500" 
          isConfigured={!!currentValues.googleClientId || !!currentValues.lineChannelId}
          onClick={() => setActiveDialog("social")} 
        />
      </div>
      
      {/* General Settings Button */}
      <div className="flex justify-center mt-8">
        <Button variant="ghost" onClick={() => setActiveDialog("general")} className="text-muted-foreground hover:text-foreground">
          <Settings className="mr-2 h-4 w-4" /> Edit General System Settings
        </Button>
      </div>

      {/* Reusable Dialog Container */}
      <Dialog open={!!activeDialog} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-background border-none shadow-2xl sm:max-w-[500px] p-0 [&>button]:text-muted-foreground [&>button]:hover:bg-accent/50 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:p-1.5 [&>button>svg]:h-5 [&>button>svg]:w-5">
          <DialogHeader className="bg-background border-b border-border px-5 sm:px-8 py-5 sm:py-7">
            <DialogTitle className="text-xl text-foreground font-bold flex items-center">
              {activeDialog === 'redis' && <><Database className="mr-3 h-5 w-5 text-emerald-500" /> Redis Configuration</>}
              {activeDialog === 'telegram' && <><MessageSquare className="mr-3 h-5 w-5 text-blue-500" /> Telegram Integration</>}
              {activeDialog === 'logs' && <><Server className="mr-3 h-5 w-5 text-orange-500" /> Logging Infrastructure</>}
              {activeDialog === 'smtp' && <><Mail className="mr-3 h-5 w-5 text-violet-500" /> SMTP Email Server</>}
              {activeDialog === 'general' && <><Settings className="mr-3 h-5 w-5 text-muted-foreground" /> General Settings</>}
              {activeDialog === 'social' && <><Settings className="mr-3 h-5 w-5 text-pink-500" /> Social Login Config</>}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Update the settings below and click save.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 sm:px-8 py-6 max-h-[60vh] overflow-y-auto">
            
            {activeDialog === "redis" && (
              <div className="space-y-5">
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Label className="text-foreground font-semibold">Redis Host Address</Label>
                  <Input {...register("redisHost")} placeholder="e.g. 127.0.0.1 or redis.internal" className="h-[44px] rounded-[8px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Port Number</Label>
                    <Input type="number" {...register("redisPort")} placeholder="6379" className="h-[44px] rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Auth Password</Label>
                    <Input type="password" {...register("redisPassword")} placeholder="••••••••" className="h-[44px] rounded-[8px]" />
                  </div>
                </div>
              </div>
            )}

            {activeDialog === "telegram" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-border/50 mb-2">
                  <div>
                    <Label className="text-base font-semibold">Enable Telegram Bot</Label>
                    <p className="text-xs text-muted-foreground mt-1">Turn on bot functions globally</p>
                  </div>
                  <Switch checked={!!telegramEnabled} onCheckedChange={(c) => setValue("telegramEnabled", c)} />
                </div>
                
                <div className={`space-y-5 transition-opacity ${!telegramEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                    <Label>HTTP API Token</Label>
                    <Input {...register("telegramToken")} placeholder="123456789:ABCDEF..." className="font-mono h-[44px] rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bot Username</Label>
                    <Input {...register("telegramBotId")} placeholder="@SysAdminBot" className="h-[44px] rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Master Chat ID</Label>
                    <Input {...register("telegramChatId")} placeholder="-100123456789" className="h-[44px] rounded-[8px]" />
                    <p className="text-xs text-muted-foreground">For server alerts and administrative notifications.</p>
                  </div>
                </div>
              </div>
            )}

            {activeDialog === "logs" && (
              <div className="space-y-5">
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Label className="font-semibold">Grafana Loki HTTP URL</Label>
                  <Input {...register("lokiUrl")} placeholder="http://localhost:3100" className="h-[44px] rounded-[8px]" />
                  <p className="text-xs text-muted-foreground mt-1">REST endpoint used for querying audit logs.</p>
                </div>
                <div className="space-y-2">
                  <Label>Vector Receiver Port</Label>
                  <Input type="number" {...register("vectorPort")} placeholder="514" className="h-[44px] rounded-[8px] w-1/2" />
                  <p className="text-xs text-muted-foreground mt-1">UDP port mapped for RouterOS Syslog traffic.</p>
                </div>
              </div>
            )}

            {activeDialog === "smtp" && (
              <div className="space-y-5">
                <div className="grid grid-cols-[2fr_1fr] gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input {...register("smtpHost")} placeholder="smtp.gmail.com" className="h-[44px] rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input type="number" {...register("smtpPort")} placeholder="587" className="h-[44px] rounded-[8px]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP User</Label>
                    <Input {...register("smtpUser")} placeholder="user@example.com" className="h-[44px] rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Password</Label>
                    <Input type="password" {...register("smtpPassword")} placeholder="••••••••" className="h-[44px] rounded-[8px]" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label>Sender Email (From)</Label>
                  <Input {...register("smtpSender")} placeholder="noreply@domain.com" className="h-[44px] rounded-[8px]" />
                </div>
              </div>
            )}

            {activeDialog === "general" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>System Timezone</Label>
                  <Input {...register("timezone")} placeholder="Asia/Bangkok" className="h-[44px] rounded-[8px]" />
                </div>
              </div>
            )}

            {activeDialog === "social" && (
              <div className="space-y-5">
                <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-[#4285F4] flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.55-5.17 3.55-8.65z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.25 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.3c-.25-.72-.38-1.5-.38-2.3s.13-1.58.38-2.3v-3.1H1.27A11.93 11.93 0 0 0 0 12c0 1.93.46 3.76 1.27 5.4l4-3.1z"/><path fill="#EA4335" d="M12 4.74c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.18 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4 3.1C6.22 6.85 8.87 4.74 12 4.74z"/></svg>
                    Google OAuth
                  </h4>
                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input {...register("googleClientId")} placeholder="Enter Google Client ID" className="h-[44px] rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input type="password" {...register("googleClientSecret")} placeholder="Enter Google Client Secret" className="h-[44px] rounded-[8px]" />
                  </div>
                </div>

                <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-[#06C755] flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#06C755" d="M12 0C5.37 0 0 4.48 0 10c0 4.94 4.29 9.07 10.08 9.86.39.08.92.26 1.06.6.12.31.08.79.04 1.1l-.17 1.05c-.05.31-.24 1.2 1.05.65 1.29-.54 6.96-4.1 9.5-7.03C23.16 14.07 24 12.13 24 10c0-5.52-5.37-10-12-10z"/></svg>
                    LINE Login
                  </h4>
                  <div className="space-y-2">
                    <Label>Channel ID</Label>
                    <Input {...register("lineChannelId")} placeholder="Enter LINE Channel ID" className="h-[44px] rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Channel Secret</Label>
                    <Input type="password" {...register("lineChannelSecret")} placeholder="Enter LINE Channel Secret" className="h-[44px] rounded-[8px]" />
                  </div>
                </div>
              </div>
            )}

          </div>

          <DialogFooter className="px-5 sm:px-7 py-4 border-t border-border bg-background flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-auto">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setActiveDialog(null)}
              className="h-[44px] rounded-[8px]"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit(onSubmit, onInvalid)} 
              disabled={saving}
              className="bg-primary shadow-md shadow-primary/20 font-semibold h-[44px] rounded-[8px]"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
