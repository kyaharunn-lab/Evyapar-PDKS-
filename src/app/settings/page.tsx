"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  Archive,
  BadgeCheck,
  Bell,
  Brush,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  Download,
  Eye,
  FileJson,
  Fingerprint,
  Globe2,
  HardDrive,
  KeyRound,
  Laptop,
  LockKeyhole,
  MapPin,
  Monitor,
  Palette,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Timer,
  Upload,
  Users,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatDateTimeTR } from "@/lib/date-time"
import { cn } from "@/lib/utils"

const SETTINGS_KEY = "app_system_settings"
const AUDIT_KEY = "app_audit_logs"

const defaultSettings = {
  general: {
    systemName: "Evyapar PDKS",
    panelTitle: "Evyapar PDKS Yönetim Paneli",
    language: "tr",
    timezone: "Europe/Istanbul",
    dateFormat: "dd.MM.yyyy",
    timeFormat: "24h",
    currency: "TRY",
    landingPage: "/dashboard",
    weekStart: "monday",
    maintenanceMode: false,
    blockDummyData: true,
  },
  security: {
    twoFactorRequired: false,
    strongPassword: true,
    adminLoginLog: true,
    failedLoginLimit: "5",
    autoLogoutMinutes: "480",
    ipRestriction: false,
    deviceRequired: false,
    suspiciousLoginAlert: true,
    exportApproval: true,
    criticalReauth: true,
    kvkkRequired: true,
  },
  pdks: {
    entryMethod: "QR",
    qrRequired: false,
    gpsRequired: false,
    deviceRequired: false,
    faceRequired: false,
    lateTolerance: "10",
    earlyExitTolerance: "10",
    breakTolerance: "10",
    autoTimesheet: true,
    autoOvertime: true,
    weekendRule: "approval",
    holidayRule: "double",
    manualEntry: true,
    managerApproval: false,
  },
  mobile: {
    mobileEntry: true,
    mobileExit: true,
    qrScan: true,
    gpsVerify: false,
    cameraVerify: false,
    offlineAttempt: false,
    mobileNotifications: true,
    devicePairingRequired: false,
    singleDevicePolicy: false,
    appTitle: "Evyapar Mobil",
    themeColor: "#2563EB",
    splashText: "Güvenli PDKS deneyimi",
  },
  data: {
    autoBackup: false,
    backupFrequency: "daily",
    retentionDays: "3650",
    auditRetentionDays: "730",
    kvkkDeletionPolicy: "manual",
    archiveEnabled: true,
  },
  theme: {
    mode: "light",
    compactSidebar: false,
    premiumGlow: true,
    animations: true,
    cardRadius: "2xl",
    primaryColor: "#071A2F",
    accentColor: "#EF4444",
    headerStyle: "glass",
    fontDensity: "comfortable",
    dashboardDensity: "comfortable",
    logoVisible: true,
  },
  access: {
    defaultRole: "Personel",
    adminApproval: true,
    rolePageAccess: true,
    branchAccess: true,
    sessionMinutes: "480",
    multiSession: true,
    userLockPolicy: "failed-login",
    passwordChangeDays: "90",
    sensitiveApproval: true,
    auditRoleChanges: true,
  },
  updatedAt: "",
  updatedBy: "",
}

const storageKeys = [
  "app_personnel",
  "app_branches",
  "app_departments",
  "app_positions",
  "app_shifts",
  "app_leave_requests",
  "app_break_records",
  "app_device_ids",
  "app_qr_points",
  "app_kvkk_consents",
  "app_audit_logs",
  "app_company_settings",
  "app_notification_settings",
  "app_system_settings",
]

const readArray = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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

function mergeDeep(base: any, patch: any): any {
  const output = { ...base }
  Object.keys(patch || {}).forEach((key) => {
    output[key] = patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key])
      ? mergeDeep(base[key] || {}, patch[key])
      : patch[key]
  })
  return output
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<any>(defaultSettings)
  const [savedSettings, setSavedSettings] = React.useState<any>(defaultSettings)
  const [records, setRecords] = React.useState<Record<string, number>>({})
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [dangerOpen, setDangerOpen] = React.useState(false)

  const load = React.useCallback(() => {
    const next = readSettings()
    setSettings(next)
    setSavedSettings(next)
    const counts: Record<string, number> = {}
    storageKeys.forEach((key) => {
      try {
        const raw = localStorage.getItem(key)
        const parsed = raw ? JSON.parse(raw) : null
        counts[key] = Array.isArray(parsed) ? parsed.length : parsed ? 1 : 0
      } catch {
        counts[key] = 0
      }
    })
    setRecords(counts)
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const dirty = React.useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings])
  const activeModules = Object.values(records).filter((count) => count > 0).length
  const securityScore = React.useMemo(() => {
    const checks = [
      settings.security.twoFactorRequired,
      settings.security.strongPassword,
      settings.security.adminLoginLog,
      settings.security.deviceRequired,
      settings.security.suspiciousLoginAlert,
      settings.security.exportApproval,
      settings.security.criticalReauth,
      settings.security.kvkkRequired,
      settings.data.autoBackup,
      settings.access.auditRoleChanges,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [settings])

  const setSection = (section: string, field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [section]: { ...prev[section], [field]: value } }))
    setErrors((prev) => ({ ...prev, [`${section}.${field}`]: "" }))
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!settings.general.systemName.trim()) next["general.systemName"] = "Sistem adı zorunludur."
    if (!settings.general.panelTitle.trim()) next["general.panelTitle"] = "Panel başlığı zorunludur."
    if (!settings.security.autoLogoutMinutes) next["security.autoLogoutMinutes"] = "Oturum süresi zorunludur."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = () => {
    if (!validate()) {
      toast({ variant: "destructive", title: "Eksik ayar", description: "Zorunlu alanları kontrol edin." })
      return
    }
    const next = { ...settings, updatedAt: Date.now(), updatedBy: "İK Yöneticisi" }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    writeAudit(savedSettings, next)
    setSettings(next)
    setSavedSettings(next)
    toast({ title: "Başarılı", description: "Genel ayarlar kaydedildi." })
  }

  const reset = () => {
    setSettings(savedSettings)
    setErrors({})
    toast({ title: "Sıfırlandı", description: "Kaydedilmiş ayarlara dönüldü." })
  }

  const exportSettings = () => downloadBlob(JSON.stringify(settings, null, 2), "sistem-ayarlari.json", "application/json;charset=utf-8")
  const exportProfile = () => downloadBlob(JSON.stringify({ settings, records }, null, 2), "sistem-profili.json", "application/json;charset=utf-8")
  const backupAll = () => {
    const backup: Record<string, string | null> = {}
    storageKeys.forEach((key) => backup[key] = localStorage.getItem(key))
    downloadBlob(JSON.stringify(backup, null, 2), "evyapar-pdks-backup.json", "application/json;charset=utf-8")
  }
  const importSettings = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result?.toString() || "{}")
        const next = mergeDeep(defaultSettings, parsed)
        setSettings(next)
        toast({ title: "İçe aktarıldı", description: "Ayarlar düzenleme ekranına alındı. Kaydetmeyi unutmayın." })
      } catch {
        toast({ variant: "destructive", title: "Hata", description: "JSON dosyası okunamadı." })
      }
    }
    reader.readAsText(file)
  }

  const healthWarnings = [
    !settings.security.deviceRequired && "Device ID zorunlu değil, güvenlik için önerilir",
    !settings.pdks.gpsRequired && "GPS doğrulama kapalı",
    settings.security.adminLoginLog && "Audit log aktif durumda",
    !settings.data.autoBackup && "Yedekleme politikası tanımlı değil",
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_12%_20%,rgba(59,130,246,0.22),transparent_28rem),radial-gradient(circle_at_82%_10%,rgba(124,58,237,0.2),transparent_26rem),linear-gradient(135deg,rgba(5,8,22,0.98),rgba(8,25,49,0.96)_56%,rgba(44,24,85,0.92))] p-8 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-100">
              <Settings2 className="h-3.5 w-3.5" />
              Enterprise Control Panel
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Ayarlar</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              Sistem davranışı, güvenlik politikaları, kullanıcı deneyimi, veri yönetimi ve genel PDKS yapılandırmasını yönetin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={exportSettings}><FileJson className="mr-2 h-4 w-4" />Ayarları JSON indir</Button>
            <label className="inline-flex h-11 cursor-pointer items-center rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15">
              <Upload className="mr-2 h-4 w-4" />Ayarları içe aktar
              <input type="file" accept="application/json" className="hidden" onChange={(event) => importSettings(event.target.files?.[0])} />
            </label>
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={exportProfile}><Download className="mr-2 h-4 w-4" />Sistem profilini dışa aktar</Button>
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Yazdır</Button>
            <Button className="h-11 rounded-2xl bg-white text-primary hover:bg-slate-100 shadow-xl" onClick={backupAll}><Archive className="mr-2 h-4 w-4" />Backup oluştur</Button>
          </div>
        </div>
      </div>

      {dirty && <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-3 text-sm font-bold text-amber-800">Kaydedilmemiş değişiklikler var.</div>}

      <SystemHero settings={settings} activeModules={activeModules} records={records} />

      <Tabs value="general-settings" className="space-y-0">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            <SettingsCenterTab value="company" label="Firma Bilgileri" href="/settings/company" />
            <SettingsCenterTab value="notifications" label="Bildirim Ayarları" href="/settings/notifications" />
            <SettingsCenterTab value="general-settings" label="Genel Ayarlar" href="/settings" />
            <SettingsCenterTab value="theme-settings" label="Tema" href="/settings" />
            <SettingsCenterTab value="security-settings" label="Güvenlik" href="/settings" />
            <SettingsCenterTab value="backup-settings" label="Yedekleme" href="/settings" />
            <SettingsCenterTab value="integrations" label="Entegrasyonlar" href="/settings/company" />
          </TabsList>
        </div>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Aktif Modüller" value={activeModules} icon={GridIcon} gradient="from-slate-900 to-blue-900" badge="canlı" />
        <Kpi title="Güvenlik Seviyesi" value={`${securityScore}%`} icon={ShieldCheck} gradient="from-emerald-500 to-teal-950" badge={securityScore > 75 ? "yüksek" : "orta"} />
        <Kpi title="Veri Kaydı Durumu" value={Object.values(records).reduce((a, b) => a + b, 0)} icon={Database} gradient="from-sky-500 to-blue-950" badge="local" />
        <Kpi title="Bildirim Durumu" value={readSettingsLabel("app_notification_settings")} icon={Bell} gradient="from-purple-500 to-fuchsia-950" badge="sync" />
        <Kpi title="Audit Log Durumu" value={settings.security.adminLoginLog ? "Aktif" : "Pasif"} icon={Fingerprint} gradient="from-indigo-500 to-slate-950" badge="audit" />
        <Kpi title="Mobil Giriş Durumu" value={settings.mobile.mobileEntry ? "Aktif" : "Pasif"} icon={Smartphone} gradient="from-blue-500 to-violet-950" badge="mobil" />
        <Kpi title="QR Zorunluluğu" value={settings.pdks.qrRequired ? "Açık" : "Kapalı"} icon={QrCode} gradient="from-orange-500 to-slate-950" badge="pdks" />
        <Kpi title="GPS Zorunluluğu" value={settings.pdks.gpsRequired ? "Açık" : "Kapalı"} icon={MapPin} gradient="from-rose-500 to-slate-950" badge="gps" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Tabs defaultValue="general" className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
              <Tab value="general" icon={Settings2} label="Genel Sistem" />
              <Tab value="security" icon={ShieldAlert} label="Güvenlik" />
              <Tab value="pdks" icon={Timer} label="PDKS Kuralları" />
              <Tab value="mobile" icon={Smartphone} label="Mobil Uygulama" />
              <Tab value="data" icon={HardDrive} label="Veri & Yedekleme" />
              <Tab value="theme" icon={Palette} label="Tema & Görünüm" />
              <Tab value="access" icon={KeyRound} label="Yetki & Oturum" />
              <Tab value="developer" icon={Code2} label="Geliştirici / Sistem Bilgisi" />
            </TabsList>
          </div>

          <TabsContent value="general"><Panel title="Genel Sistem" icon={Settings2}><GeneralTab settings={settings} setSection={setSection} errors={errors} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="security"><Panel title="Güvenlik" icon={ShieldAlert}><SecurityTab settings={settings} setSection={setSection} errors={errors} securityScore={securityScore} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="pdks"><Panel title="PDKS Kuralları" icon={Timer}><PdksTab settings={settings} setSection={setSection} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="mobile"><Panel title="Mobil Uygulama" icon={Smartphone}><MobileTab settings={settings} setSection={setSection} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="data"><Panel title="Veri & Yedekleme" icon={HardDrive}><DataTab settings={settings} setSection={setSection} backupAll={backupAll} exportSettings={exportSettings} setDangerOpen={setDangerOpen} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="theme"><Panel title="Tema & Görünüm" icon={Palette}><ThemeTab settings={settings} setSection={setSection} /><ThemePreview settings={settings} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="access"><Panel title="Yetki & Oturum" icon={KeyRound}><AccessTab settings={settings} setSection={setSection} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="developer"><DeveloperTab records={records} load={load} /></TabsContent>
        </Tabs>

        <HealthPanel score={securityScore} warnings={healthWarnings} settings={settings} save={save} />
      </div>

      <Dialog open={dangerOpen} onOpenChange={setDangerOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-red-600 text-white">
            <DialogTitle className="text-2xl font-bold">Tehlikeli İşlem Onayı</DialogTitle>
            <DialogDescription className="text-white/80">Sistem verisini sıfırlama işlemi geri alınamaz.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4">
            <p className="text-sm font-semibold text-slate-600">Bu işlem için sadece ayar ekranı onay modalı hazırlandı. Güvenlik nedeniyle otomatik silme uygulanmadı.</p>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setDangerOpen(false)}>Kapat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function writeAudit(previous: any, next: any) {
  const changed = diffKeys(previous, next)
  const highRisk = changed.some((field) => /security|access|data|device|audit|2fa|export/i.test(field))
  const log = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "Sistem Ayarı Güncellendi",
    user: "İK Yöneticisi",
    role: "Admin",
    module: "Genel Ayarlar",
    category: "Admin",
    risk: highRisk ? "Yüksek" : "Orta",
    status: "Başarılı",
    detail: `Değişen alan: ${changed.join(", ") || "Genel ayarlar"}`,
    oldValue: "Önceki sistem ayarları",
    newValue: "Güncel sistem ayarları",
    timestamp: Date.now(),
    ipAddress: "local",
    deviceId: "system-settings-panel",
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

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function readSettingsLabel(key: string) {
  try {
    return localStorage.getItem(key) ? "Aktif" : "Yok"
  } catch {
    return "Yok"
  }
}

function SystemHero({ settings, activeModules, records }: any) {
  return <Card className="overflow-hidden rounded-[28px] border border-white/70 bg-white/75 shadow-2xl shadow-slate-200/70 backdrop-blur-xl"><CardContent className="p-6"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5"><div><h3 className="text-2xl font-extrabold text-primary">{settings.general.systemName}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{settings.general.panelTitle}</p><p className="mt-2 text-sm text-slate-500">Runtime: Local · Data mode: localStorage · Son güncelleme: {settings.updatedAt ? formatDateTimeTR(settings.updatedAt) : "-"}</p></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2"><MiniStat label="Aktif modül" value={activeModules} /><MiniStat label="Rol" value="Admin" /><MiniStat label="Durum" value="Aktif" /><MiniStat label="Veri key" value={Object.keys(records).length} /></div></div></CardContent></Card>
}

function MiniStat({ label, value }: any) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"><div className="text-xl font-extrabold text-primary">{value}</div><div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div></div>
}

function Kpi({ title, value, icon: Icon, gradient, badge }: any) {
  return <Card className="group overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/70 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl"><CardContent className={cn("relative min-h-[126px] p-5 text-white bg-gradient-to-br", gradient)}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform group-hover:scale-150" /><div className="relative z-10 flex items-center justify-between"><Icon className="h-6 w-6 text-white/85" /><span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold">{badge}</span></div><div className="relative z-10 mt-5 text-2xl font-extrabold">{value}</div><p className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-widest text-white/75">{title}</p></CardContent></Card>
}

function Tab({ value, icon: Icon, label }: any) {
  return <TabsTrigger value={value} className="rounded-xl px-4 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"><Icon className="mr-2 h-4 w-4" />{label}</TabsTrigger>
}

function SettingsCenterTab({ value, label, href }: { value: string; label: string; href: string }) {
  return (
    <TabsTrigger value={value} asChild className="rounded-xl px-4 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg">
      <Link href={href}>{label}</Link>
    </TabsTrigger>
  )
}

function Panel({ title, icon: Icon, children }: any) {
  return <Card className="premium-card overflow-hidden"><CardHeader className="border-b bg-slate-50/40"><CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest"><Icon className="h-4 w-4" />{title}</CardTitle></CardHeader><CardContent className="p-6 space-y-6">{children}</CardContent></Card>
}

function Field({ label, value, onChange, error, type = "text" }: any) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cn("h-11 rounded-xl border-slate-200 bg-white", error && "border-red-400")} />{error && <p className="text-xs font-semibold text-red-600">{error}</p>}</div>
}

function SelectField({ label, value, onChange, children }: any) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>
}

function ToggleRow({ label, checked, onChange }: any) {
  return <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"><Label className="text-sm font-bold text-slate-700">{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div>
}

function GeneralTab({ settings, setSection, errors }: any) {
  const g = settings.general
  return <div className="grid gap-4 md:grid-cols-2"><Field label="Sistem adı" value={g.systemName} onChange={(v: string) => setSection("general", "systemName", v)} error={errors["general.systemName"]} /><Field label="Panel başlığı" value={g.panelTitle} onChange={(v: string) => setSection("general", "panelTitle", v)} error={errors["general.panelTitle"]} /><SelectField label="Varsayılan dil" value={g.language} onChange={(v: string) => setSection("general", "language", v)}><SelectItem value="tr">Türkçe</SelectItem><SelectItem value="en">English</SelectItem></SelectField><Field label="Varsayılan saat dilimi" value={g.timezone} onChange={(v: string) => setSection("general", "timezone", v)} /><Field label="Tarih formatı" value={g.dateFormat} onChange={(v: string) => setSection("general", "dateFormat", v)} /><SelectField label="Saat formatı" value={g.timeFormat} onChange={(v: string) => setSection("general", "timeFormat", v)}><SelectItem value="24h">24 Saat</SelectItem><SelectItem value="12h">12 Saat</SelectItem></SelectField><SelectField label="Para birimi" value={g.currency} onChange={(v: string) => setSection("general", "currency", v)}><SelectItem value="TRY">TRY</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectField><Field label="İlk açılış sayfası" value={g.landingPage} onChange={(v: string) => setSection("general", "landingPage", v)} /><SelectField label="Haftanın başlangıç günü" value={g.weekStart} onChange={(v: string) => setSection("general", "weekStart", v)}><SelectItem value="monday">Pazartesi</SelectItem><SelectItem value="sunday">Pazar</SelectItem></SelectField><ToggleRow label="Sistem bakım modu" checked={g.maintenanceMode} onChange={(v: boolean) => setSection("general", "maintenanceMode", v)} /><ToggleRow label="Demo/dummy veri engeli aktif" checked={g.blockDummyData} onChange={(v: boolean) => setSection("general", "blockDummyData", v)} /></div>
}

function SecurityTab({ settings, setSection, errors, securityScore }: any) {
  const s = settings.security
  const level = securityScore > 85 ? "yüksek" : securityScore > 60 ? "orta" : securityScore > 35 ? "düşük" : "kritik"
  return <div className="space-y-5"><div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div className="text-sm font-bold text-slate-500">Risk seviyesi</div><div className="mt-2 text-2xl font-extrabold text-primary capitalize">{level} · {securityScore}%</div></div><div className="grid gap-4 md:grid-cols-2"><ToggleRow label="2FA zorunlu" checked={s.twoFactorRequired} onChange={(v: boolean) => setSection("security", "twoFactorRequired", v)} /><ToggleRow label="Güçlü şifre politikası" checked={s.strongPassword} onChange={(v: boolean) => setSection("security", "strongPassword", v)} /><ToggleRow label="Admin giriş logu" checked={s.adminLoginLog} onChange={(v: boolean) => setSection("security", "adminLoginLog", v)} /><Field label="Başarısız giriş limiti" value={s.failedLoginLimit} onChange={(v: string) => setSection("security", "failedLoginLimit", v)} /><Field label="Otomatik oturum kapatma süresi" value={s.autoLogoutMinutes} onChange={(v: string) => setSection("security", "autoLogoutMinutes", v)} error={errors["security.autoLogoutMinutes"]} /><ToggleRow label="IP kısıtlama" checked={s.ipRestriction} onChange={(v: boolean) => setSection("security", "ipRestriction", v)} /><ToggleRow label="Device ID zorunluluğu" checked={s.deviceRequired} onChange={(v: boolean) => setSection("security", "deviceRequired", v)} /><ToggleRow label="Şüpheli giriş uyarısı" checked={s.suspiciousLoginAlert} onChange={(v: boolean) => setSection("security", "suspiciousLoginAlert", v)} /><ToggleRow label="Veri dışa aktarma onayı" checked={s.exportApproval} onChange={(v: boolean) => setSection("security", "exportApproval", v)} /><ToggleRow label="Kritik işlemde yeniden doğrulama" checked={s.criticalReauth} onChange={(v: boolean) => setSection("security", "criticalReauth", v)} /><ToggleRow label="KVKK onayı zorunlu" checked={s.kvkkRequired} onChange={(v: boolean) => setSection("security", "kvkkRequired", v)} /></div></div>
}

function PdksTab({ settings, setSection }: any) {
  const p = settings.pdks
  return <div className="grid gap-4 md:grid-cols-2"><SelectField label="Giriş yöntemi" value={p.entryMethod} onChange={(v: string) => setSection("pdks", "entryMethod", v)}><SelectItem value="QR">QR</SelectItem><SelectItem value="GPS">GPS</SelectItem><SelectItem value="Device ID">Device ID</SelectItem><SelectItem value="Manuel">Manuel</SelectItem></SelectField>{["qrRequired:QR zorunlu","gpsRequired:GPS zorunlu","deviceRequired:Device ID zorunlu","faceRequired:Yüz doğrulama zorunlu"].map((i) => { const [k,l]=i.split(":"); return <ToggleRow key={k} label={l} checked={p[k]} onChange={(v:boolean)=>setSection("pdks",k,v)} />})}<Field label="Geç kalma toleransı" value={p.lateTolerance} onChange={(v:string)=>setSection("pdks","lateTolerance",v)} /><Field label="Erken çıkış toleransı" value={p.earlyExitTolerance} onChange={(v:string)=>setSection("pdks","earlyExitTolerance",v)} /><Field label="Mola aşım toleransı" value={p.breakTolerance} onChange={(v:string)=>setSection("pdks","breakTolerance",v)} /><ToggleRow label="Otomatik puantaj" checked={p.autoTimesheet} onChange={(v:boolean)=>setSection("pdks","autoTimesheet",v)} /><ToggleRow label="Fazla mesai otomatik hesaplama" checked={p.autoOvertime} onChange={(v:boolean)=>setSection("pdks","autoOvertime",v)} /><SelectField label="Hafta sonu mesai kuralı" value={p.weekendRule} onChange={(v:string)=>setSection("pdks","weekendRule",v)}><SelectItem value="approval">Onaylı</SelectItem><SelectItem value="auto">Otomatik</SelectItem><SelectItem value="blocked">Kapalı</SelectItem></SelectField><SelectField label="Resmi tatil mesai kuralı" value={p.holidayRule} onChange={(v:string)=>setSection("pdks","holidayRule",v)}><SelectItem value="double">Çift çarpan</SelectItem><SelectItem value="approval">Onaylı</SelectItem><SelectItem value="blocked">Kapalı</SelectItem></SelectField><ToggleRow label="Manuel kayıt izni" checked={p.manualEntry} onChange={(v:boolean)=>setSection("pdks","manualEntry",v)} /><ToggleRow label="Yönetici onayı zorunlu" checked={p.managerApproval} onChange={(v:boolean)=>setSection("pdks","managerApproval",v)} /></div>
}

function MobileTab({ settings, setSection }: any) {
  const m = settings.mobile
  return <div className="grid gap-4 md:grid-cols-2">{["mobileEntry:Mobil giriş aktif","mobileExit:Mobil çıkış aktif","qrScan:QR okutma aktif","gpsVerify:GPS doğrulama aktif","cameraVerify:Kamera doğrulama aktif","offlineAttempt:Offline giriş denemesi","mobileNotifications:Mobil bildirimler","devicePairingRequired:Cihaz eşleştirme zorunlu","singleDevicePolicy:Tek cihaz politikası"].map((i)=>{const[k,l]=i.split(":");return <ToggleRow key={k} label={l} checked={m[k]} onChange={(v:boolean)=>setSection("mobile",k,v)} />})}<Field label="Mobil uygulama başlığı" value={m.appTitle} onChange={(v:string)=>setSection("mobile","appTitle",v)} /><Field label="Mobil tema rengi" type="color" value={m.themeColor} onChange={(v:string)=>setSection("mobile","themeColor",v)} /><Field label="Mobil splash ekran metni" value={m.splashText} onChange={(v:string)=>setSection("mobile","splashText",v)} /></div>
}

function DataTab({ settings, setSection, backupAll, exportSettings, setDangerOpen }: any) {
  const d = settings.data
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2"><ToggleRow label="Otomatik yedekleme aktif" checked={d.autoBackup} onChange={(v:boolean)=>setSection("data","autoBackup",v)} /><SelectField label="Yedekleme sıklığı" value={d.backupFrequency} onChange={(v:string)=>setSection("data","backupFrequency",v)}><SelectItem value="daily">Günlük</SelectItem><SelectItem value="weekly">Haftalık</SelectItem><SelectItem value="monthly">Aylık</SelectItem></SelectField><Field label="Veri saklama süresi" value={d.retentionDays} onChange={(v:string)=>setSection("data","retentionDays",v)} /><Field label="Audit log saklama süresi" value={d.auditRetentionDays} onChange={(v:string)=>setSection("data","auditRetentionDays",v)} /><SelectField label="KVKK veri silme politikası" value={d.kvkkDeletionPolicy} onChange={(v:string)=>setSection("data","kvkkDeletionPolicy",v)}><SelectItem value="manual">Manuel</SelectItem><SelectItem value="scheduled">Planlı</SelectItem><SelectItem value="request-based">Talep bazlı</SelectItem></SelectField><ToggleRow label="Arşivleme aktif" checked={d.archiveEnabled} onChange={(v:boolean)=>setSection("data","archiveEnabled",v)} /></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-xl" onClick={backupAll}>JSON yedek indir</Button><Button variant="outline" className="rounded-xl">JSON yedek yükle</Button><Button variant="outline" className="rounded-xl" onClick={backupAll}>Tüm localStorage verisini dışa aktar</Button></div><div className="rounded-2xl border border-red-200 bg-red-50 p-5"><h3 className="font-extrabold text-red-700">Tehlikeli İşlemler</h3><p className="mt-1 text-sm text-red-600">Sistem verisini sıfırlama onay modalı gerektirir.</p><Button className="mt-4 bg-red-600 hover:bg-red-700 rounded-xl" onClick={()=>setDangerOpen(true)}>Sistem verisini sıfırla</Button></div></div>
}

function ThemeTab({ settings, setSection }: any) {
  const t = settings.theme
  return <div className="grid gap-4 md:grid-cols-2"><SelectField label="Açık / koyu tema" value={t.mode} onChange={(v:string)=>setSection("theme","mode",v)}><SelectItem value="light">Açık</SelectItem><SelectItem value="dark">Koyu</SelectItem><SelectItem value="system">Sistem</SelectItem></SelectField>{["compactSidebar:Sidebar kompakt mod","premiumGlow:Premium glow efektleri","animations:Animasyonlar","logoVisible:Logo görünümü"].map((i)=>{const[k,l]=i.split(":");return <ToggleRow key={k} label={l} checked={t[k]} onChange={(v:boolean)=>setSection("theme",k,v)} />})}<SelectField label="Kart radius seviyesi" value={t.cardRadius} onChange={(v:string)=>setSection("theme","cardRadius",v)}><SelectItem value="lg">Large</SelectItem><SelectItem value="xl">XL</SelectItem><SelectItem value="2xl">2XL</SelectItem></SelectField><Field label="Ana renk" type="color" value={t.primaryColor} onChange={(v:string)=>setSection("theme","primaryColor",v)} /><Field label="Accent renk" type="color" value={t.accentColor} onChange={(v:string)=>setSection("theme","accentColor",v)} /><SelectField label="Header görünümü" value={t.headerStyle} onChange={(v:string)=>setSection("theme","headerStyle",v)}><SelectItem value="glass">Glass</SelectItem><SelectItem value="solid">Solid</SelectItem></SelectField><SelectField label="Font yoğunluğu" value={t.fontDensity} onChange={(v:string)=>setSection("theme","fontDensity",v)}><SelectItem value="compact">Compact</SelectItem><SelectItem value="comfortable">Comfortable</SelectItem></SelectField><SelectField label="Dashboard yoğunluk modu" value={t.dashboardDensity} onChange={(v:string)=>setSection("theme","dashboardDensity",v)}><SelectItem value="compact">Compact</SelectItem><SelectItem value="comfortable">Comfortable</SelectItem><SelectItem value="spacious">Spacious</SelectItem></SelectField></div>
}

function ThemePreview({ settings }: any) {
  const t = settings.theme
  return <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-[28px] border border-white/70 bg-white shadow-xl overflow-hidden"><div className="flex"><div className="w-28 p-4 text-white" style={{ background: t.primaryColor }}><Monitor className="h-6 w-6 mb-4" />{["Dashboard","Rapor","Ayar"].map((i)=><div key={i} className="mb-2 rounded-lg bg-white/10 px-2 py-1 text-xs">{i}</div>)}</div><div className="flex-1 p-5"><h3 className="font-extrabold text-primary">Mini admin panel preview</h3><div className="mt-4 grid grid-cols-2 gap-3"><div className="h-20 rounded-2xl" style={{ background: t.accentColor }} /><div className="h-20 rounded-2xl bg-slate-100" /></div></div></div></div><div className="rounded-[28px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl"><Smartphone className="h-6 w-6 text-sky-300" /><h3 className="mt-4 text-xl font-extrabold">Mini mobile app preview</h3><p className="text-sm text-slate-300">Tema: {t.mode}</p><div className="mt-5 h-24 rounded-3xl" style={{ background: t.accentColor }} /></div></div>
}

function AccessTab({ settings, setSection }: any) {
  const a = settings.access
  return <div className="grid gap-4 md:grid-cols-2"><SelectField label="Varsayılan yeni kullanıcı rolü" value={a.defaultRole} onChange={(v:string)=>setSection("access","defaultRole",v)}><SelectItem value="Personel">Personel</SelectItem><SelectItem value="Şube Yöneticisi">Şube Yöneticisi</SelectItem><SelectItem value="İK Yöneticisi">İK Yöneticisi</SelectItem></SelectField>{["adminApproval:Admin onayı zorunlu","rolePageAccess:Rol bazlı sayfa erişimi","branchAccess:Şube bazlı erişim","multiSession:Aynı anda çoklu oturum","sensitiveApproval:Hassas işlem onayı","auditRoleChanges:Yetki değişikliğinde audit log"].map((i)=>{const[k,l]=i.split(":");return <ToggleRow key={k} label={l} checked={a[k]} onChange={(v:boolean)=>setSection("access",k,v)} />})}<Field label="Oturum süresi" value={a.sessionMinutes} onChange={(v:string)=>setSection("access","sessionMinutes",v)} /><SelectField label="Kullanıcı kilitleme politikası" value={a.userLockPolicy} onChange={(v:string)=>setSection("access","userLockPolicy",v)}><SelectItem value="failed-login">Başarısız giriş</SelectItem><SelectItem value="manual">Manuel</SelectItem><SelectItem value="none">Yok</SelectItem></SelectField><Field label="Şifre değiştirme periyodu" value={a.passwordChangeDays} onChange={(v:string)=>setSection("access","passwordChangeDays",v)} /></div>
}

function DeveloperTab({ records, load }: any) {
  const total = Object.values(records).reduce((a: any, b: any) => a + b, 0)
  const createAudit = () => {
    const log = { id: `audit-${Date.now()}`, type: "Test Audit Log Oluşturuldu", user: "İK Yöneticisi", module: "Genel Ayarlar", risk: "Düşük", status: "Başarılı", timestamp: Date.now(), detail: "Sistem sağlık testi kapsamında oluşturuldu." }
    localStorage.setItem(AUDIT_KEY, JSON.stringify([log, ...readArray(AUDIT_KEY)]))
    load()
  }
  return <Panel title="Geliştirici / Sistem Bilgisi" icon={Code2}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><InfoCard label="Framework" value="Next.js" /><InfoCard label="Runtime" value="Local" /><InfoCard label="Data mode" value="localStorage" /><InfoCard label="Firestore" value="Disabled" /><InfoCard label="Environment" value="Development" /><InfoCard label="App version" value="0.1.0" /><InfoCard label="Build mode" value="Dev" /><InfoCard label="Toplam kayıt" value={String(total)} /><InfoCard label="Son kayıt güncelleme zamanı" value={new Date().toLocaleString("tr-TR")} /></div><div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">localStorage key listesi</div><div className="grid gap-2 md:grid-cols-2">{Object.entries(records).map(([key,count])=><div key={key} className="flex justify-between rounded-xl bg-white px-3 py-2 text-xs"><span className="font-mono text-slate-600">{key}</span><span className="font-bold text-primary">{String(count)}</span></div>)}</div></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-xl" onClick={load}>localStorage kontrol et</Button><Button variant="outline" className="rounded-xl" onClick={load}>sistem sağlık testi çalıştır</Button><Button variant="outline" className="rounded-xl">cache temizle</Button><Button variant="outline" className="rounded-xl">console log export</Button><Button className="rounded-xl bg-primary" onClick={createAudit}>test audit log oluştur</Button></div></Panel>
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm"><div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</div><div className="mt-2 text-lg font-extrabold text-primary">{value}</div></div>
}

function ActionBar({ save, reset }: any) {
  return <div className="flex flex-wrap justify-end gap-2 border-t pt-5"><Button variant="outline" className="rounded-xl" onClick={reset}><RefreshCw className="mr-2 h-4 w-4" />Sıfırla</Button><Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={save}><Save className="mr-2 h-4 w-4" />Kaydet</Button></div>
}

function HealthPanel({ score, warnings, settings, save }: any) {
  const criticalActive = [settings.security.adminLoginLog, settings.security.kvkkRequired, settings.security.criticalReauth].filter(Boolean).length
  return <div className="xl:sticky xl:top-6 h-fit space-y-4"><Card className="rounded-2xl border border-white/70 bg-white/80 shadow-xl backdrop-blur-xl"><CardHeader><CardTitle className="text-lg font-extrabold text-primary">Sistem Sağlık Durumu</CardTitle></CardHeader><CardContent className="space-y-4"><div><div className="flex justify-between text-sm font-bold text-slate-600"><span>Sağlık puanı</span><span>{score}%</span></div><div className="mt-2 h-3 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500" style={{ width: `${score}%` }} /></div></div><InfoMini label="Aktif kritik kurallar" value={String(criticalActive)} /><InfoMini label="Pasif kritik kurallar" value={String(3 - criticalActive)} /><InfoMini label="Son ayar değişikliği" value={settings.updatedAt ? formatDateTimeTR(settings.updatedAt) : "-"} /><div className="space-y-2"><div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Uyarılar / öneriler</div>{warnings.map((w:string)=><div key={w} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{w}</div>)}</div><Button className="w-full rounded-xl bg-primary" onClick={save}>Hızlı Kaydet</Button></CardContent></Card><Card className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-[#100a24] text-white shadow-2xl"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold"><Activity className="h-5 w-5 text-fuchsia-300" />AI Insights</CardTitle></CardHeader><CardContent className="space-y-3">{warnings.map((w:string)=><div key={w} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm font-semibold">{w}</div>)}</CardContent></Card></div>
}

function InfoMini({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"><span className="text-xs font-bold text-slate-400">{label}</span><span className="text-xs font-bold text-primary text-right">{value}</span></div>
}

function GridIcon(props: any) {
  return <Settings2 {...props} />
}
