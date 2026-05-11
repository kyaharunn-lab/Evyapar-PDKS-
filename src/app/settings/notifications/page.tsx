"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
  Download,
  Edit2,
  Eye,
  FileText,
  Fingerprint,
  Globe2,
  History,
  LockKeyhole,
  Mail,
  MessageSquare,
  Monitor,
  MoreHorizontal,
  Phone,
  QrCode,
  RefreshCw,
  Save,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Timer,
  Users,
  Webhook,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatDateTimeTR } from "@/lib/date-time"
import { cn } from "@/lib/utils"

const SETTINGS_KEY = "app_notification_settings"
const AUDIT_KEY = "app_audit_logs"

const channelOptions = ["Panel", "Mobil Push", "E-posta", "SMS", "WhatsApp", "Webhook", "Slack / Teams"]
const roles = ["Admin", "İK Yöneticisi", "Şube Yöneticisi", "Departman Yöneticisi", "Personel"]

const pdksRules = [
  "Personel geç kaldığında bildir",
  "Personel giriş yapmadığında bildir",
  "Personel erken çıktığında bildir",
  "Mesai saati aşıldığında bildir",
  "Vardiya başlamadan önce hatırlat",
  "Vardiya bitişinde çıkış hatırlat",
  "Mola süresi aşıldığında bildir",
  "QR doğrulama başarısız olduğunda bildir",
  "GPS konum dışı girişte bildir",
  "Device ID uyuşmazlığında bildir",
]

const approvalRules = [
  "Yeni izin talebi geldiğinde",
  "İzin onaylandığında",
  "İzin reddedildiğinde",
  "Avans talebi geldiğinde",
  "Avans onaylandığında",
  "Avans reddedildiğinde",
  "Fazla mesai onayı beklediğinde",
  "Yetki değişikliği talebi geldiğinde",
  "Yönetici onayı geciktiğinde",
]

const securityRules = [
  "Başarısız admin girişi",
  "Şüpheli giriş denemesi",
  "Aynı hesap farklı cihazdan giriş",
  "Device ID eşleşmedi",
  "GPS spoofing şüphesi",
  "QR kod tekrar kullanımı",
  "Yetkisiz sayfa erişimi",
  "KVKK onayı eksik personel",
  "Audit log kritik olay",
  "Veri dışa aktarma işlemi",
  "Şirket ayarı değişikliği",
]

const templateNames = [
  "Geç kalma bildirimi",
  "İzin talebi bildirimi",
  "Avans talebi bildirimi",
  "QR hata bildirimi",
  "Device ID uyarısı",
  "Güvenlik uyarısı",
  "KVKK hatırlatma",
  "Vardiya hatırlatma",
  "Sistem bakım bildirimi",
]

const channels = [
  { id: "panel", title: "Admin panel içi bildirim", icon: Monitor },
  { id: "push", title: "Mobil push", icon: Smartphone },
  { id: "email", title: "E-posta", icon: Mail },
  { id: "sms", title: "SMS", icon: Phone },
  { id: "whatsapp", title: "WhatsApp", icon: MessageSquare },
  { id: "webhook", title: "Webhook", icon: Webhook },
  { id: "teams", title: "Slack / Teams", icon: Globe2 },
]

const defaultSettings = {
  global: {
    enabled: true,
    panel: true,
    push: true,
    email: true,
    sms: false,
    criticalAlways: true,
    quietCriticalOnly: true,
    sounds: true,
    desktop: true,
  },
  pdksRules: {},
  approvalRules: {},
  securityRules: {},
  channels: {},
  templates: {},
  schedule: {
    quietStart: "22:00",
    quietEnd: "07:00",
    weekendPolicy: "critical-only",
    holidayPolicy: "critical-only",
    preShiftReminder: "30",
    repeatInterval: "60",
    maxRepeats: "3",
    criticalBypass: true,
  },
  logs: [],
  updatedAt: "",
  updatedBy: "",
}

const readSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return mergeDeep(defaultSettings, parsed)
  } catch {
    return defaultSettings
  }
}

const readArray = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mergeDeep(base: any, patch: any): any {
  const output = { ...base }
  Object.keys(patch || {}).forEach((key) => {
    output[key] = patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key])
      ? mergeDeep(base[key] || {}, patch[key])
      : patch[key]
  })
  return output
}

export default function NotificationSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<any>(defaultSettings)
  const [savedSettings, setSavedSettings] = React.useState<any>(defaultSettings)
  const [selectedLog, setSelectedLog] = React.useState<any | null>(null)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const load = React.useCallback(() => {
    const next = readSettings()
    setSettings(next)
    setSavedSettings(next)
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const dirty = React.useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings])
  const notificationLogs = settings.logs || []
  const today = new Date().toISOString().slice(0, 10)
  const todayLogs = notificationLogs.filter((log: any) => `${log.createdAt || ""}`.slice(0, 10) === today)
  const activeChannels = channels.filter((c) => settings.channels?.[c.id]?.enabled ?? settings.global[c.id] ?? false).length
  const allRules = [...pdksRules, ...approvalRules, ...securityRules]
  const activeRules = allRules.filter((r) => getRule(settings, r).enabled).length
  const criticalLogs = notificationLogs.filter((l: any) => l.risk === "Kritik")
  const failedLogs = notificationLogs.filter((l: any) => l.status === "Başarısız")

  const update = (path: string[], value: any) => {
    setSettings((prev: any) => {
      const next = structuredClone(prev)
      let cursor = next
      path.slice(0, -1).forEach((key) => {
        cursor[key] = cursor[key] || {}
        cursor = cursor[key]
      })
      cursor[path[path.length - 1]] = value
      return next
    })
    setErrors({})
  }

  const save = () => {
    if (!settings.global.enabled && !settings.global.criticalAlways) {
      setErrors({ global: "Bildirim sistemi kapalıyken kritik uyarılar için en az bir güvenli kanal önerilir." })
      toast({ variant: "destructive", title: "Eksik yapılandırma", description: "Bildirim ayarlarını kontrol edin." })
      return
    }
    const updatedAt = Date.now()
    const next = { ...settings, updatedAt, updatedBy: "İK Yöneticisi" }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    writeAudit(savedSettings, next)
    setSettings(next)
    setSavedSettings(next)
    toast({ title: "Başarılı", description: "Bildirim ayarları kaydedildi." })
  }

  const testChannel = (channelId: string) => {
    const log = {
      id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      recipient: "İK Yöneticisi",
      role: "Admin",
      branch: "Merkez",
      type: "Test bildirimi",
      channel: channels.find((c) => c.id === channelId)?.title || channelId,
      title: "Test bildirimi gönderildi",
      status: "Gönderildi",
      risk: "Düşük",
      detail: "Kanal test bildirimi localStorage üzerinde simüle edildi.",
    }
    const next = {
      ...settings,
      channels: {
        ...settings.channels,
        [channelId]: { ...(settings.channels?.[channelId] || {}), lastTestAt: Date.now(), successRate: 100 },
      },
      logs: [log, ...(settings.logs || [])],
    }
    setSettings(next)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    setSavedSettings(next)
    toast({ title: "Test gönderildi", description: "Kanal test bildirimi kaydedildi." })
  }

  const resendLog = (log: any) => {
    const nextLog = { ...log, id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`, createdAt: new Date().toISOString(), status: "Gönderildi", detail: "Bildirim tekrar gönderildi." }
    const next = { ...settings, logs: [nextLog, ...(settings.logs || [])] }
    setSettings(next)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    setSavedSettings(next)
    toast({ title: "Tekrar gönderildi", description: "Bildirim logu güncellendi." })
  }

  const missing = []
  if (!settings.global.push) missing.push("Mobil push aktif değil, önerilir")
  if (!settings.global.sms) missing.push("Kritik güvenlik uyarıları için SMS kanalı kapalı")
  if (!settings.global.email) missing.push("E-posta kanalı kapalı")
  if (!settings.schedule.criticalBypass) missing.push("Kritik uyarılar sessiz saatten muaf değil")

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_12%_20%,rgba(59,130,246,0.22),transparent_28rem),radial-gradient(circle_at_82%_10%,rgba(124,58,237,0.2),transparent_26rem),linear-gradient(135deg,rgba(5,8,22,0.98),rgba(8,25,49,0.96)_56%,rgba(44,24,85,0.92))] p-8 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-100">
              <BellRing className="h-3.5 w-3.5" />
              Enterprise Notification Center
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Bildirim Ayarları</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              PDKS sistemindeki uyarı, hatırlatma, onay ve güvenlik bildirimlerini merkezi olarak yönetin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Yenile</Button>
            <Button className="h-11 rounded-2xl bg-white text-primary hover:bg-slate-100 shadow-xl" onClick={save}><Save className="mr-2 h-4 w-4" />Kaydet</Button>
          </div>
        </div>
      </div>

      {dirty && <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-3 text-sm font-bold text-amber-800">Kaydedilmemiş değişiklikler var.</div>}
      {errors.global && <div className="rounded-2xl border border-red-200 bg-red-50/80 px-5 py-3 text-sm font-bold text-red-700">{errors.global}</div>}

      <SummaryHero settings={settings} activeChannels={activeChannels} todayLogs={todayLogs.length} critical={criticalLogs.length} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Toplam Bildirim Kuralı" value={allRules.length} icon={Bell} gradient="from-slate-900 to-blue-900" />
        <Kpi title="Aktif Kurallar" value={activeRules} icon={CheckCircle2} gradient="from-emerald-500 to-teal-950" />
        <Kpi title="Pasif Kurallar" value={allRules.length - activeRules} icon={XCircle} gradient="from-slate-500 to-slate-950" />
        <Kpi title="Bugünkü Bildirimler" value={todayLogs.length} icon={Activity} gradient="from-sky-500 to-blue-950" />
        <Kpi title="Kritik Güvenlik Uyarıları" value={criticalLogs.length} icon={ShieldAlert} gradient="from-rose-500 to-slate-950" />
        <Kpi title="Bekleyen Onay Bildirimleri" value={notificationLogs.filter((l: any) => /onay|izin|avans/i.test(l.type || "") && l.status === "Bekliyor").length} icon={Clock3} gradient="from-yellow-500 to-slate-950" />
        <Kpi title="Başarısız Gönderimler" value={failedLogs.length} icon={AlertTriangle} gradient="from-orange-500 to-slate-950" />
        <Kpi title="Mobil Push Aktifliği" value={settings.global.push ? "Aktif" : "Pasif"} icon={Smartphone} gradient="from-blue-500 to-violet-950" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Tabs defaultValue="general" className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
              <Tab value="general" icon={Bell} label="Genel Bildirimler" />
              <Tab value="pdks" icon={Timer} label="PDKS Uyarıları" />
              <Tab value="approvals" icon={Users} label="İzin & Onay" />
              <Tab value="security" icon={ShieldAlert} label="Güvenlik" />
              <Tab value="channels" icon={Send} label="Kanal Ayarları" />
              <Tab value="templates" icon={FileText} label="Şablonlar" />
              <Tab value="schedule" icon={Clock3} label="Zamanlama" />
              <Tab value="logs" icon={History} label="Bildirim Logları" />
            </TabsList>
          </div>

          <TabsContent value="general"><Panel title="Genel Bildirimler" icon={Bell}>{Object.entries({
            enabled: "Bildirim sistemi aktif/pasif",
            panel: "Admin panel bildirimleri",
            push: "Mobil push bildirimleri",
            email: "E-posta bildirimleri",
            sms: "SMS bildirimleri",
            criticalAlways: "Kritik uyarıları her zaman gönder",
            quietCriticalOnly: "Sessiz saatlerde sadece kritik uyarı gönder",
            sounds: "Bildirim sesleri",
            desktop: "Masaüstü bildirimleri",
          }).map(([key, label]) => <ToggleSetting key={key} label={label} description={`${label} için merkezi kontrol.`} checked={settings.global[key]} onChange={(v: boolean) => update(["global", key], v)} />)}</Panel></TabsContent>

          <TabsContent value="pdks"><RulesPanel rules={pdksRules} settings={settings} update={update} section="pdksRules" security={false} /></TabsContent>
          <TabsContent value="approvals"><ApprovalPanel rules={approvalRules} settings={settings} update={update} /></TabsContent>
          <TabsContent value="security"><RulesPanel rules={securityRules} settings={settings} update={update} section="securityRules" security /></TabsContent>
          <TabsContent value="channels"><ChannelsPanel settings={settings} update={update} testChannel={testChannel} /></TabsContent>
          <TabsContent value="templates"><TemplatesPanel settings={settings} update={update} /></TabsContent>
          <TabsContent value="schedule"><SchedulePanel settings={settings} update={update} /></TabsContent>
          <TabsContent value="logs"><LogsPanel logs={notificationLogs} setSelectedLog={setSelectedLog} resendLog={resendLog} /></TabsContent>
        </Tabs>

        <SmartSummary activeChannels={activeChannels} today={todayLogs.length} failed={failedLogs.length} critical={criticalLogs.length} settings={settings} missing={missing} logs={notificationLogs} />
      </div>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[640px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">Bildirim Log Detayı</DialogTitle>
            <DialogDescription className="text-white/80">Gönderim ve kanal detayları.</DialogDescription>
          </DialogHeader>
          {selectedLog && <div className="p-8 space-y-3">{Object.entries(selectedLog).map(([k, v]) => <InfoRow key={k} label={k} value={String(v || "-")} />)}</div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getRule(settings: any, name: string) {
  return settings.pdksRules?.[name] || settings.approvalRules?.[name] || settings.securityRules?.[name] || { enabled: false }
}

function writeAudit(previous: any, next: any) {
  const changed = diffKeys(previous, next)
  const log = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "Bildirim Ayarı Güncellendi",
    user: "İK Yöneticisi",
    role: "Admin",
    module: "Bildirim Ayarları",
    category: "Admin",
    risk: "Orta",
    status: "Başarılı",
    detail: `Değişen alan: ${changed.join(", ") || "Genel ayarlar"}`,
    timestamp: Date.now(),
    ipAddress: "local",
    deviceId: "notification-settings-panel",
  }
  localStorage.setItem(AUDIT_KEY, JSON.stringify([log, ...readArray(AUDIT_KEY)]))
}

function diffKeys(a: any, b: any, prefix = ""): string[] {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])
  const changed: string[] = []
  keys.forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof a?.[key] === "object" && typeof b?.[key] === "object" && !Array.isArray(a?.[key]) && !Array.isArray(b?.[key])) changed.push(...diffKeys(a[key], b[key], path))
    else if (JSON.stringify(a?.[key]) !== JSON.stringify(b?.[key])) changed.push(path)
  })
  return changed
}

function SummaryHero({ settings, activeChannels, todayLogs, critical }: any) {
  return <Card className="overflow-hidden rounded-[28px] border border-white/70 bg-white/75 shadow-2xl shadow-slate-200/70 backdrop-blur-xl"><CardContent className="p-6"><div className="flex flex-col lg:flex-row gap-5 lg:items-center justify-between"><div><h3 className="text-2xl font-extrabold text-primary flex items-center gap-2"><BellRing className="h-7 w-7 text-accent" />Bildirim Kontrol Merkezi</h3><p className="mt-1 text-sm font-medium text-slate-500">Sistem durumu: {settings.global.enabled ? "Aktif" : "Pasif"} · Son bildirim: {settings.logs?.[0]?.createdAt ? formatDateTimeTR(settings.logs[0].createdAt) : "-"}</p></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2"><MiniStat label="Sistem" value={settings.global.enabled ? "Aktif" : "Pasif"} /><MiniStat label="Aktif kanal" value={activeChannels} /><MiniStat label="Bugün" value={todayLogs} /><MiniStat label="Kritik" value={critical} /></div></div></CardContent></Card>
}

function MiniStat({ label, value }: any) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"><div className="text-xl font-extrabold text-primary">{value}</div><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div></div>
}

function Kpi({ title, value, icon: Icon, gradient }: any) {
  return <Card className="group overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/70 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl"><CardContent className={cn("relative min-h-[126px] p-5 text-white bg-gradient-to-br", gradient)}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform group-hover:scale-150" /><Icon className="relative z-10 h-6 w-6 text-white/85" /><div className="relative z-10 mt-5 text-2xl font-extrabold">{value}</div><p className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-widest text-white/75">{title}</p><div className="relative z-10 mt-3 flex h-5 items-end gap-1">{[40, 70, 55, 85, 64].map((h, i) => <span key={i} className="w-full rounded-full bg-white/35" style={{ height: `${h}%` }} />)}</div></CardContent></Card>
}

function Tab({ value, icon: Icon, label }: any) {
  return <TabsTrigger value={value} className="rounded-xl px-4 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"><Icon className="mr-2 h-4 w-4" />{label}</TabsTrigger>
}

function Panel({ title, icon: Icon, children }: any) {
  return <Card className="premium-card overflow-hidden"><CardHeader className="border-b bg-slate-50/40"><CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest"><Icon className="h-4 w-4" />{title}</CardTitle></CardHeader><CardContent className="p-6 space-y-4">{children}</CardContent></Card>
}

function ToggleSetting({ label, description, checked, onChange }: any) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white/80 px-5 py-4 shadow-sm"><div><div className="font-bold text-primary">{label}</div><p className="text-xs font-medium text-slate-500">{description}</p><Badge className={checked ? "mt-2 bg-green-50 text-green-700" : "mt-2 bg-slate-50 text-slate-500"}>{checked ? "Aktif" : "Pasif"}</Badge></div><Switch checked={checked} onCheckedChange={onChange} /></div>
}

function RulesPanel({ rules, settings, update, section, security }: any) {
  return <Panel title={security ? "Güvenlik Bildirimleri" : "PDKS Uyarıları"} icon={security ? ShieldAlert : Timer}>{rules.map((rule: string, index: number) => <RuleCard key={rule} rule={rule} value={settings[section]?.[rule] || { enabled: false, role: "Admin", channel: "Panel", threshold: "10", branch: "Tüm Şubeler", risk: index > 7 ? "Kritik" : "Orta" }} update={(field: string, value: any) => update([section, rule, field], value)} security={security} />)}</Panel>
}

function RuleCard({ rule, value, update, security }: any) {
  const critical = security && value.risk === "Kritik"
  return <div className={cn("rounded-2xl border bg-white/80 p-4 shadow-sm", critical ? "border-red-200 shadow-[0_0_24px_rgba(239,68,68,0.18)] animate-pulse" : "border-slate-100")}><div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between"><div><div className="font-extrabold text-primary flex items-center gap-2">{critical && <LockKeyhole className="h-4 w-4 text-accent" />}{rule}</div><p className="text-xs text-slate-500">Kural hedefi, kanal ve eşik değerini yönetin.</p></div><Switch checked={value.enabled} onCheckedChange={(v) => update("enabled", v)} /></div><div className="mt-4 grid gap-3 md:grid-cols-5"><SmallSelect value={value.role} onChange={(v: string) => update("role", v)} items={roles} /><SmallSelect value={value.channel} onChange={(v: string) => update("channel", v)} items={channelOptions} /><Input value={value.threshold || ""} onChange={(e) => update("threshold", e.target.value)} className="h-10 rounded-xl" placeholder="Eşik" /><Input value={value.branch || ""} onChange={(e) => update("branch", e.target.value)} className="h-10 rounded-xl" placeholder="Şube filtresi" />{security ? <SmallSelect value={value.risk || "Orta"} onChange={(v: string) => update("risk", v)} items={["Düşük", "Orta", "Yüksek", "Kritik"]} /> : <Button variant="outline" className="rounded-xl">Kaydet</Button>}</div></div>
}

function ApprovalPanel({ rules, settings, update }: any) {
  return <Panel title="İzin & Onay Bildirimleri" icon={Users}>{rules.map((rule: string) => { const value = settings.approvalRules?.[rule] || { enabled: false, recipient: "Yönetici", channel: "Panel", repeat: "60", escalation: false, followUp: true }; return <div key={rule} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm"><div className="flex justify-between gap-4"><div><div className="font-extrabold text-primary">{rule}</div><p className="text-xs text-slate-500">Onay akışı bildirimi ve escalation ayarları.</p></div><Switch checked={value.enabled} onCheckedChange={(v) => update(["approvalRules", rule, "enabled"], v)} /></div><div className="mt-4 grid gap-3 md:grid-cols-5"><Input value={value.recipient} onChange={(e) => update(["approvalRules", rule, "recipient"], e.target.value)} className="h-10 rounded-xl" placeholder="Kime gidecek" /><SmallSelect value={value.channel} onChange={(v: string) => update(["approvalRules", rule, "channel"], v)} items={channelOptions} /><Input value={value.repeat} onChange={(e) => update(["approvalRules", rule, "repeat"], e.target.value)} className="h-10 rounded-xl" placeholder="Tekrar dk" /><ToggleMini label="Escalation" checked={value.escalation} onChange={(v: boolean) => update(["approvalRules", rule, "escalation"], v)} /><ToggleMini label="Takip" checked={value.followUp} onChange={(v: boolean) => update(["approvalRules", rule, "followUp"], v)} /></div></div> })}</Panel>
}

function ChannelsPanel({ settings, update, testChannel }: any) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{channels.map((c) => { const Icon = c.icon; const value = settings.channels?.[c.id] || {}; const enabled = value.enabled ?? settings.global[c.id] ?? false; return <Card key={c.id} className="group overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1"><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-lg font-extrabold text-primary">{c.title}</CardTitle><p className="text-xs text-slate-500">Bağlantı ve test yönetimi.</p></div><Icon className="h-6 w-6 text-accent" /></div></CardHeader><CardContent className="space-y-4"><ToggleSetting label="Kanal durumu" description={enabled ? "Bağlantı aktif görünüyor." : "Kanal pasif durumda."} checked={enabled} onChange={(v: boolean) => update(["channels", c.id, "enabled"], v)} /><InfoRow label="Bağlantı durumu" value={enabled ? "Aktif" : "Pasif"} /><InfoRow label="Son test tarihi" value={value.lastTestAt ? formatDateTimeTR(value.lastTestAt) : "-"} /><InfoRow label="Başarı oranı" value={`${value.successRate || 0}%`} /><Button className="w-full rounded-xl bg-primary" onClick={() => testChannel(c.id)}>Test bildirimi gönder</Button></CardContent></Card> })}</div>
}

function TemplatesPanel({ settings, update }: any) {
  return <Panel title="Şablonlar" icon={FileText}>{templateNames.map((name) => { const t = settings.templates?.[name] || { title: name, short: "", long: "", variables: "{personelAdi}, {subeAdi}, {tarih}, {saat}, {vardiyaAdi}, {riskSeviyesi}" }; return <div key={name} className="rounded-2xl border border-slate-100 bg-white/80 p-4"><div className="grid gap-3 md:grid-cols-2"><Input value={t.title} onChange={(e) => update(["templates", name, "title"], e.target.value)} className="h-10 rounded-xl" placeholder="Başlık" /><Input value={t.variables} onChange={(e) => update(["templates", name, "variables"], e.target.value)} className="h-10 rounded-xl" placeholder="Değişkenler" /><Input value={t.short} onChange={(e) => update(["templates", name, "short"], e.target.value)} className="h-10 rounded-xl md:col-span-2" placeholder="Kısa mesaj" /><Textarea value={t.long} onChange={(e) => update(["templates", name, "long"], e.target.value)} className="rounded-2xl md:col-span-2" placeholder="Uzun mesaj" /></div><div className="mt-3 flex gap-2"><Badge variant="outline">Önizleme</Badge><Button variant="outline" className="rounded-xl"><Edit2 className="mr-2 h-4 w-4" />Düzenle</Button><Button variant="outline" className="rounded-xl"><Save className="mr-2 h-4 w-4" />Kaydet</Button></div></div> })}</Panel>
}

function SchedulePanel({ settings, update }: any) {
  const s = settings.schedule
  return <Panel title="Zamanlama & Sessiz Saatler" icon={Clock3}><div className="grid gap-4 md:grid-cols-2"><Field label="Sessiz saat başlangıcı" value={s.quietStart} onChange={(v: string) => update(["schedule", "quietStart"], v)} /><Field label="Sessiz saat bitişi" value={s.quietEnd} onChange={(v: string) => update(["schedule", "quietEnd"], v)} /><SmallSelectField label="Hafta sonu bildirim politikası" value={s.weekendPolicy} onChange={(v: string) => update(["schedule", "weekendPolicy"], v)} items={["normal", "critical-only", "silent"]} /><SmallSelectField label="Resmi tatil bildirim politikası" value={s.holidayPolicy} onChange={(v: string) => update(["schedule", "holidayPolicy"], v)} items={["normal", "critical-only", "silent"]} /><Field label="Vardiya öncesi hatırlatma süresi" value={s.preShiftReminder} onChange={(v: string) => update(["schedule", "preShiftReminder"], v)} /><Field label="Tekrar hatırlatma aralığı" value={s.repeatInterval} onChange={(v: string) => update(["schedule", "repeatInterval"], v)} /><Field label="Maksimum tekrar sayısı" value={s.maxRepeats} onChange={(v: string) => update(["schedule", "maxRepeats"], v)} /><ToggleSetting label="Kritik uyarıları sessiz saatten muaf tut" description="Kritik güvenlik bildirimleri her zaman gönderilir." checked={s.criticalBypass} onChange={(v: boolean) => update(["schedule", "criticalBypass"], v)} /></div></Panel>
}

function LogsPanel({ logs, setSelectedLog, resendLog }: any) {
  return <Card className="premium-card overflow-hidden"><CardHeader className="border-b bg-slate-50/40"><CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Bildirim Logları</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table className="min-w-[1200px]"><TableHeader className="enterprise-table-header"><TableRow>{["Bildirim ID","Tarih","Saat","Alıcı","Rol","Şube","Bildirim Türü","Kanal","Başlık","Durum","Risk","Gönderim Detayı","İşlemler"].map((h,i)=><TableHead key={h} className={i===0?"pl-6":i===12?"text-right pr-6":""}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{logs.length===0?<TableRow><TableCell colSpan={13} className="h-72 text-center text-muted-foreground">Bildirim logu bulunmuyor.</TableCell></TableRow>:logs.map((log:any)=>{ const d = log.createdAt ? new Date(log.createdAt) : null; return <TableRow key={log.id}><TableCell className="pl-6 font-mono text-xs">{log.id}</TableCell><TableCell>{d ? d.toISOString().slice(0,10) : "-"}</TableCell><TableCell>{d ? d.toLocaleTimeString("tr-TR") : "-"}</TableCell><TableCell>{log.recipient}</TableCell><TableCell>{log.role}</TableCell><TableCell>{log.branch}</TableCell><TableCell>{log.type}</TableCell><TableCell>{log.channel}</TableCell><TableCell>{log.title}</TableCell><TableCell><StatusBadge status={log.status} /></TableCell><TableCell><RiskBadge risk={log.risk} /></TableCell><TableCell className="max-w-[240px] truncate">{log.detail}</TableCell><TableCell className="text-right pr-6"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={()=>setSelectedLog(log)}><Eye className="mr-2 h-4 w-4" />Detay gör</DropdownMenuItem><DropdownMenuItem onClick={()=>resendLog(log)}><Send className="mr-2 h-4 w-4" />Tekrar gönder</DropdownMenuItem><DropdownMenuItem onClick={()=>setSelectedLog(log)}><History className="mr-2 h-4 w-4" />Log görüntüle</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>})}</TableBody></Table></div></CardContent></Card>
}

function SmartSummary({ activeChannels, today, failed, critical, missing, logs }: any) {
  const topRule = logs[0]?.type || "-"
  const insights = ["Device ID uyarıları son 7 günde arttı", "İzin onay bildirimleri yoğun", "Mobil push aktif değil, önerilir", "Kritik güvenlik uyarıları için SMS kanalı kapalı"]
  return <div className="xl:sticky xl:top-6 h-fit space-y-4"><Card className="rounded-2xl border border-white/70 bg-white/80 shadow-xl backdrop-blur-xl"><CardHeader><CardTitle className="text-lg font-extrabold text-primary">Akıllı Bildirim Özeti</CardTitle></CardHeader><CardContent className="space-y-3"><InfoRow label="Aktif kanal" value={String(activeChannels)} /><InfoRow label="Bugün gönderilenler" value={String(today)} /><InfoRow label="Başarısız gönderimler" value={String(failed)} /><InfoRow label="Kritik uyarılar" value={String(critical)} /><InfoRow label="En çok çalışan kural" value={topRule} /><div className="space-y-2">{missing.map((m:string)=><div key={m} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{m}</div>)}</div></CardContent></Card><Card className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-[#100a24] text-white shadow-2xl"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold"><Activity className="h-5 w-5 text-fuchsia-300" />AI Insights</CardTitle></CardHeader><CardContent className="space-y-3">{insights.map(i=><div key={i} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm font-semibold">{i}</div>)}</CardContent></Card></div>
}

function SmallSelect({ value, onChange, items }: any) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{items.map((i:string)=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
}

function Field({ label, value, onChange }: any) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Input value={value} onChange={(e)=>onChange(e.target.value)} className="h-11 rounded-xl" /></div>
}

function SmallSelectField({ label, value, onChange, items }: any) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><SmallSelect value={value} onChange={onChange} items={items} /></div>
}

function ToggleMini({ label, checked, onChange }: any) {
  return <div className="flex items-center justify-between rounded-xl border px-3"><span className="text-xs font-bold">{label}</span><Switch checked={checked} onCheckedChange={onChange} /></div>
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "Gönderildi" ? "bg-green-50 text-green-700" : status === "Başarısız" ? "bg-red-50 text-accent" : status === "İptal Edildi" ? "bg-slate-50 text-slate-600" : "bg-yellow-50 text-yellow-700"
  return <Badge className={cn("font-bold", cls)}>{status}</Badge>
}

function RiskBadge({ risk }: { risk: string }) {
  const cls = risk === "Kritik" ? "bg-red-50 text-accent shadow-[0_0_18px_rgba(239,68,68,0.35)]" : risk === "Yüksek" ? "bg-orange-50 text-orange-700" : risk === "Orta" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"
  return <Badge className={cn("font-bold", cls)}>{risk || "Düşük"}</Badge>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border border-slate-100 bg-white rounded-xl px-4 py-3"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span><span className="text-sm font-semibold text-slate-700 text-right break-all">{value}</span></div>
}
