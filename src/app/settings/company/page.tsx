"use client"

import * as React from "react"
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  Eye,
  FileJson,
  FileText,
  Fingerprint,
  Globe2,
  HeartPulse,
  ImageIcon,
  KeyRound,
  Laptop,
  Mail,
  MapPin,
  Palette,
  Phone,
  Printer,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  Timer,
  Upload,
  Users,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const COMPANY_KEY = "app_company_settings"
const AUDIT_KEY = "app_audit_logs"

const defaultSettings = {
  general: {
    companyName: "",
    shortName: "",
    sector: "",
    companyType: "",
    foundingYear: "",
    website: "",
    mainContact: "",
    contactTitle: "",
    employeeCount: "",
    description: "",
  },
  legal: {
    taxOffice: "",
    taxNumber: "",
    mersisNo: "",
    tradeRegistryNo: "",
    sgkNo: "",
    naceCode: "",
    kepAddress: "",
    eInvoice: false,
    eArchive: false,
    kvkkOfficer: "",
    dataControllerRep: "",
  },
  contact: {
    phone: "",
    secondPhone: "",
    email: "",
    supportEmail: "",
    hrEmail: "",
    country: "Türkiye",
    city: "",
    district: "",
    zipCode: "",
    address: "",
    mapLocation: "",
    latitude: "",
    longitude: "",
  },
  branding: {
    logo: "",
    sidebarLogo: "",
    favicon: "",
    primaryColor: "#071A2F",
    secondaryColor: "#2563EB",
    accentColor: "#EF4444",
    panelTitle: "Evyapar PDKS",
    mobileTitle: "Evyapar Mobil",
    loginSlogan: "",
    corporateNote: "",
  },
  policies: {
    dailyHours: "8",
    weeklyHours: "45",
    overtimeMethod: "standard",
    lateTolerance: "10",
    earlyExitTolerance: "10",
    lunchBreak: "45",
    teaBreak: "15",
    nightStart: "22:00",
    weekendMultiplier: "2",
    holidayMultiplier: "2.5",
    autoTimesheet: true,
    mobileEntry: true,
    qrRequired: false,
    gpsRequired: false,
    deviceRequired: false,
    faceRequired: false,
  },
  system: {
    timezone: "Europe/Istanbul",
    dateFormat: "dd.MM.yyyy",
    timeFormat: "24h",
    language: "tr",
    currency: "TRY",
    sessionDuration: "480",
    passwordPolicy: "strong",
    twoFactor: false,
    auditRequired: true,
    notifications: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    backupFrequency: "daily",
    autoArchive: true,
  },
  integrations: {},
  updatedAt: "",
  updatedBy: "",
}

const integrationCards = [
  { id: "erp", title: "ERP Entegrasyonu", description: "Kurumsal kaynak planlama sistemleri.", icon: Database },
  { id: "accounting", title: "Muhasebe Entegrasyonu", description: "Finans ve muhasebe aktarımı.", icon: Briefcase },
  { id: "payroll", title: "Bordro Entegrasyonu", description: "Bordro ve puantaj bağlantısı.", icon: Users },
  { id: "sms", title: "SMS Entegrasyonu", description: "SMS bildirim servisleri.", icon: Smartphone },
  { id: "smtp", title: "E-posta SMTP", description: "Kurumsal mail sunucu ayarları.", icon: Mail },
  { id: "maps", title: "Harita / GPS Servisi", description: "Konum doğrulama servisleri.", icon: MapPin },
  { id: "backup", title: "Bulut Yedekleme", description: "Yedekleme ve arşiv hedefleri.", icon: Cloud },
  { id: "api", title: "API Anahtarları", description: "Güvenli servis erişim anahtarları.", icon: KeyRound },
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
    const raw = localStorage.getItem(COMPANY_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return mergeDeep(defaultSettings, parsed || {})
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

export default function CompanySettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<any>(defaultSettings)
  const [savedSettings, setSavedSettings] = React.useState<any>(defaultSettings)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [metrics, setMetrics] = React.useState({
    branches: 0,
    departments: 0,
    personnel: 0,
    activeUsers: 0,
    shifts: 0,
    devices: 0,
    kvkkRate: 0,
  })

  const load = React.useCallback(() => {
    const next = readSettings()
    setSettings(next)
    setSavedSettings(next)
    const branches = readArray("app_branches")
    const departments = readArray("app_departments")
    const personnel = readArray("app_personnel").filter((p: any) => !p?.isDeleted)
    const shifts = readArray("app_shifts")
    const devices = readArray("app_device_ids")
    const kvkkRaw = localStorage.getItem("app_kvkk_consents")
    let kvkkConsents: any[] = []
    try {
      const parsed = kvkkRaw ? JSON.parse(kvkkRaw) : {}
      kvkkConsents = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.consents) ? parsed.consents : []
    } catch {
      kvkkConsents = []
    }
    const approved = kvkkConsents.filter((c: any) => c?.status === "Approved").length
    setMetrics({
      branches: branches.length,
      departments: departments.length,
      personnel: personnel.length,
      activeUsers: personnel.filter((p: any) => p?.status !== "Inactive").length,
      shifts: shifts.length,
      devices: devices.filter((d: any) => d?.status !== "Blocked").length,
      kvkkRate: personnel.length ? Math.round((approved / personnel.length) * 100) : 0,
    })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const dirty = React.useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings])

  const setSection = (section: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
    setErrors((prev) => ({ ...prev, [`${section}.${field}`]: "" }))
  }

  const missingItems = React.useMemo(() => {
    const list = []
    if (!settings.branding.logo) list.push("Logo eksik")
    if (!settings.legal.taxNumber) list.push("Vergi no eksik")
    if (!settings.legal.kvkkOfficer) list.push("KVKK sorumlusu eksik")
    if (!settings.policies.gpsRequired) list.push("GPS politikası tanımlı değil")
    if (!settings.policies.deviceRequired) list.push("Device ID politikası tanımlı değil")
    return list
  }, [settings])

  const completion = React.useMemo(() => {
    const required = [
      settings.general.companyName,
      settings.general.shortName,
      settings.legal.taxNumber,
      settings.legal.taxOffice,
      settings.legal.kvkkOfficer,
      settings.contact.phone,
      settings.contact.email,
      settings.contact.address,
      settings.branding.logo,
      settings.policies.dailyHours,
    ]
    return Math.round((required.filter(Boolean).length / required.length) * 100)
  }, [settings])

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!settings.general.companyName.trim()) nextErrors["general.companyName"] = "Firma adı zorunludur."
    if (!settings.legal.taxOffice.trim()) nextErrors["legal.taxOffice"] = "Vergi dairesi zorunludur."
    if (!settings.legal.taxNumber.trim()) nextErrors["legal.taxNumber"] = "Vergi numarası zorunludur."
    if (settings.legal.taxNumber && !/^\d{10,11}$/.test(settings.legal.taxNumber.replace(/\D/g, ""))) {
      nextErrors["legal.taxNumber"] = "Vergi numarası 10 veya 11 haneli olmalıdır."
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const save = () => {
    if (!validate()) {
      toast({ variant: "destructive", title: "Eksik bilgi", description: "Zorunlu ve format hatalı alanları kontrol edin." })
      return
    }

    const updatedAt = Date.now()
    const next = { ...settings, updatedAt, updatedBy: "İK Yöneticisi" }
    localStorage.setItem(COMPANY_KEY, JSON.stringify(next))
    writeAudit(savedSettings, next)
    setSettings(next)
    setSavedSettings(next)
    toast({ title: "Başarılı", description: "Firma bilgileri kaydedildi." })
  }

  const reset = () => {
    setSettings(savedSettings)
    setErrors({})
    toast({ title: "Sıfırlandı", description: "Kaydedilmiş son ayarlara dönüldü." })
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "firma-bilgileri.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const onLogoUpload = (field: string, file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSection("branding", field, reader.result?.toString() || "")
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_12%_20%,rgba(59,130,246,0.22),transparent_28rem),radial-gradient(circle_at_82%_10%,rgba(124,58,237,0.2),transparent_26rem),linear-gradient(135deg,rgba(5,8,22,0.98),rgba(8,25,49,0.96)_56%,rgba(44,24,85,0.92))] p-8 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-100">
              <Building2 className="h-3.5 w-3.5" />
              Enterprise Company Center
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Firma Bilgileri</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              Şirket kimliği, yasal bilgiler, iletişim ayarları ve kurumsal PDKS yapılandırmasını yönetin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={exportJson}><FileJson className="mr-2 h-4 w-4" />Firma bilgilerini JSON indir</Button>
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={exportJson}><Download className="mr-2 h-4 w-4" />Ayarları dışa aktar</Button>
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Yazdır</Button>
            <Button className="h-11 rounded-2xl bg-white text-primary hover:bg-slate-100 shadow-xl" onClick={() => window.print()}><FileTextIcon />Kurumsal profil PDF indir</Button>
          </div>
        </div>
      </div>

      {dirty && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-3 text-sm font-bold text-amber-800 shadow-lg">
          Kaydedilmemiş değişiklikler var.
        </div>
      )}

      <CompanyProfile settings={settings} metrics={metrics} onLogoUpload={onLogoUpload} setSection={setSection} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Toplam Şube" value={metrics.branches} icon={Building2} gradient="from-slate-900 to-blue-900" />
        <Kpi title="Toplam Departman" value={metrics.departments} icon={Briefcase} gradient="from-indigo-500 to-slate-950" />
        <Kpi title="Toplam Personel" value={metrics.personnel} icon={Users} gradient="from-sky-500 to-blue-950" />
        <Kpi title="Aktif Kullanıcı" value={metrics.activeUsers} icon={CheckCircle2} gradient="from-emerald-500 to-teal-950" />
        <Kpi title="Tanımlı Vardiya" value={metrics.shifts} icon={Timer} gradient="from-purple-500 to-fuchsia-950" />
        <Kpi title="Aktif Cihaz" value={metrics.devices} icon={Laptop} gradient="from-orange-500 to-slate-950" />
        <Kpi title="KVKK Onay Oranı" value={`${metrics.kvkkRate}%`} icon={Fingerprint} gradient="from-blue-500 to-violet-950" />
        <Kpi title="Sistem Durumu" value="Aktif" icon={HeartPulse} gradient="from-green-500 to-slate-950" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Tabs defaultValue="general" className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
              <Tab value="general" icon={Building2} label="Genel Bilgiler" />
              <Tab value="legal" icon={ShieldCheck} label="Yasal Bilgiler" />
              <Tab value="contact" icon={Phone} label="İletişim & Adres" />
              <Tab value="branding" icon={Palette} label="Kurumsal Kimlik" />
              <Tab value="policies" icon={Timer} label="Çalışma Politikaları" />
              <Tab value="system" icon={Settings2} label="Sistem Yapılandırması" />
              <Tab value="integrations" icon={Cloud} label="Entegrasyon Bilgileri" />
            </TabsList>
          </div>

          <TabsContent value="general"><Panel title="Genel Bilgiler" icon={Building2}><GeneralForm settings={settings} setSection={setSection} errors={errors} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="legal"><Panel title="Yasal Bilgiler" icon={ShieldCheck}><LegalForm settings={settings} setSection={setSection} errors={errors} /><LegalWarnings settings={settings} errors={errors} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="contact"><Panel title="İletişim & Adres" icon={MapPin}><ContactForm settings={settings} setSection={setSection} /><MapPreview settings={settings} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="branding"><Panel title="Kurumsal Kimlik" icon={Palette}><BrandingForm settings={settings} setSection={setSection} onLogoUpload={onLogoUpload} /><BrandPreview settings={settings} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="policies"><Panel title="Çalışma Politikaları" icon={Timer}><PoliciesForm settings={settings} setSection={setSection} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="system"><Panel title="Sistem Yapılandırması" icon={Settings2}><SystemForm settings={settings} setSection={setSection} /><ActionBar save={save} reset={reset} /></Panel></TabsContent>
          <TabsContent value="integrations"><Integrations settings={settings} setSection={setSection} /></TabsContent>
        </Tabs>

        <SummaryPanel completion={completion} missingItems={missingItems} settings={settings} save={save} reset={reset} exportJson={exportJson} />
      </div>
    </div>
  )
}

function writeAudit(previous: any, next: any) {
  const changed = diffKeys(previous, next)
  const audit = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "Firma Bilgileri Güncellendi",
    user: "İK Yöneticisi",
    role: "Admin",
    branch: next.general?.shortName || "-",
    detail: `Değişen alanlar: ${changed.join(", ") || "Genel kayıt"}`,
    module: "Firma Bilgileri",
    category: "Admin",
    risk: "Orta",
    status: "Başarılı",
    ipAddress: "local",
    deviceId: "company-settings-panel",
    location: next.contact?.city || "-",
    timestamp: Date.now(),
    oldValue: "Önceki firma ayarları",
    newValue: "Güncel firma ayarları",
  }
  const logs = readArray(AUDIT_KEY)
  localStorage.setItem(AUDIT_KEY, JSON.stringify([audit, ...logs]))
}

function diffKeys(a: any, b: any, prefix = ""): string[] {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])
  const changed: string[] = []
  keys.forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof a?.[key] === "object" && typeof b?.[key] === "object" && !Array.isArray(a?.[key]) && !Array.isArray(b?.[key])) {
      changed.push(...diffKeys(a[key], b[key], path))
    } else if (JSON.stringify(a?.[key]) !== JSON.stringify(b?.[key])) {
      changed.push(path)
    }
  })
  return changed
}

function CompanyProfile({ settings, metrics, onLogoUpload, setSection }: any) {
  return (
    <Card className="overflow-hidden rounded-[28px] border border-white/70 bg-white/75 shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
          <div className="flex items-center gap-5">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-xl">
              {settings.branding.logo ? <img src={settings.branding.logo} alt="Şirket logosu" className="h-full w-full object-cover" /> : <Building2 className="h-10 w-10" />}
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-primary">{settings.general.companyName || "Firma adı tanımlanmadı"}</h3>
              <p className="text-sm font-semibold text-slate-500">{settings.general.shortName || "Kısa ad yok"} · {settings.legal.taxNumber || "Vergi no yok"}</p>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">{settings.contact.address || "Merkez adres bilgisi henüz girilmedi."}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-blue-100">Aktif şube: {metrics.branches}</Badge>
                <Badge className="bg-green-50 text-green-700 border-green-100">Personel: {metrics.personnel}</Badge>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">Sistem durumu: Aktif</Badge>
                <Badge className="bg-slate-50 text-slate-600 border-slate-200">Son güncelleme: {settings.updatedAt ? formatDateTimeTR(settings.updatedAt) : "-"}</Badge>
              </div>
            </div>
          </div>
          <div className="lg:ml-auto flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-primary shadow-sm hover:bg-slate-50">
              <Upload className="mr-2 h-4 w-4" />
              Logo yükle
              <input type="file" accept="image/*" className="hidden" onChange={(event) => onLogoUpload("logo", event.target.files?.[0])} />
            </label>
            <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => setSection("branding", "logo", "")}><X className="mr-2 h-4 w-4" />Logo kaldır</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Kpi({ title, value, icon: Icon, gradient }: any) {
  return <Card className="group overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/70 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl"><CardContent className={cn("relative min-h-[126px] p-5 text-white bg-gradient-to-br", gradient)}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform group-hover:scale-150" /><Icon className="relative z-10 h-6 w-6 text-white/85" /><div className="relative z-10 mt-5 text-3xl font-extrabold">{value}</div><p className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-widest text-white/75">{title}</p></CardContent></Card>
}

function Tab({ value, icon: Icon, label }: any) {
  return <TabsTrigger value={value} className="rounded-xl px-4 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"><Icon className="mr-2 h-4 w-4" />{label}</TabsTrigger>
}

function Panel({ title, icon: Icon, children }: any) {
  return <Card className="premium-card overflow-hidden"><CardHeader className="border-b bg-slate-50/40"><CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest"><Icon className="h-4 w-4" />{title}</CardTitle></CardHeader><CardContent className="p-6 space-y-6">{children}</CardContent></Card>
}

function Field({ label, value, onChange, error, type = "text" }: any) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={cn("h-11 rounded-xl border-slate-200 bg-white", error && "border-red-400")} />{error && <p className="text-xs font-semibold text-red-600">{error}</p>}</div>
}

function SelectField({ label, value, onChange, children }: any) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>
}

function ToggleRow({ label, checked, onChange }: any) {
  return <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"><Label className="text-sm font-bold text-slate-700">{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div>
}

function GeneralForm({ settings, setSection, errors }: any) {
  const g = settings.general
  return <div className="grid gap-4 md:grid-cols-2"><Field label="Firma Adı" value={g.companyName} onChange={(v: string) => setSection("general", "companyName", v)} error={errors["general.companyName"]} /><Field label="Kısa Firma Adı" value={g.shortName} onChange={(v: string) => setSection("general", "shortName", v)} /><Field label="Sektör" value={g.sector} onChange={(v: string) => setSection("general", "sector", v)} /><SelectField label="Şirket Türü" value={g.companyType} onChange={(v: string) => setSection("general", "companyType", v)}><SelectItem value="anonim">Anonim Şirket</SelectItem><SelectItem value="limited">Limited Şirket</SelectItem><SelectItem value="sahis">Şahıs Şirketi</SelectItem><SelectItem value="holding">Holding</SelectItem></SelectField><Field label="Kuruluş Yılı" value={g.foundingYear} onChange={(v: string) => setSection("general", "foundingYear", v)} /><Field label="Web Sitesi" value={g.website} onChange={(v: string) => setSection("general", "website", v)} /><Field label="Ana Yetkili Kişi" value={g.mainContact} onChange={(v: string) => setSection("general", "mainContact", v)} /><Field label="Yetkili Ünvanı" value={g.contactTitle} onChange={(v: string) => setSection("general", "contactTitle", v)} /><Field label="Personel Sayısı" value={g.employeeCount} onChange={(v: string) => setSection("general", "employeeCount", v)} /><div className="md:col-span-2 space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">Açıklama</Label><Textarea value={g.description} onChange={(e) => setSection("general", "description", e.target.value)} className="min-h-[110px] rounded-2xl border-slate-200" /></div></div>
}

function LegalForm({ settings, setSection, errors }: any) {
  const l = settings.legal
  return <div className="grid gap-4 md:grid-cols-2"><Field label="Vergi Dairesi" value={l.taxOffice} onChange={(v: string) => setSection("legal", "taxOffice", v)} error={errors["legal.taxOffice"]} /><Field label="Vergi Numarası" value={l.taxNumber} onChange={(v: string) => setSection("legal", "taxNumber", v)} error={errors["legal.taxNumber"]} /><Field label="MERSİS No" value={l.mersisNo} onChange={(v: string) => setSection("legal", "mersisNo", v)} /><Field label="Ticaret Sicil No" value={l.tradeRegistryNo} onChange={(v: string) => setSection("legal", "tradeRegistryNo", v)} /><Field label="SGK Sicil No" value={l.sgkNo} onChange={(v: string) => setSection("legal", "sgkNo", v)} /><Field label="NACE Kodu" value={l.naceCode} onChange={(v: string) => setSection("legal", "naceCode", v)} /><Field label="KEP Adresi" value={l.kepAddress} onChange={(v: string) => setSection("legal", "kepAddress", v)} /><Field label="KVKK Sorumlusu" value={l.kvkkOfficer} onChange={(v: string) => setSection("legal", "kvkkOfficer", v)} /><Field label="Veri Sorumlusu Temsilcisi" value={l.dataControllerRep} onChange={(v: string) => setSection("legal", "dataControllerRep", v)} /><div className="grid gap-3"><ToggleRow label="E-Fatura Kullanımı" checked={l.eInvoice} onChange={(v: boolean) => setSection("legal", "eInvoice", v)} /><ToggleRow label="E-Arşiv Kullanımı" checked={l.eArchive} onChange={(v: boolean) => setSection("legal", "eArchive", v)} /></div></div>
}

function LegalWarnings({ settings, errors }: any) {
  const warnings = []
  if (!settings.legal.taxNumber) warnings.push("Vergi numarası eksik.")
  if (!settings.legal.kvkkOfficer) warnings.push("KVKK sorumlusu tanımlanmadı.")
  if (!settings.legal.taxOffice) warnings.push("Vergi dairesi eksik.")
  Object.values(errors).forEach((error) => error && warnings.push(error as string))
  if (warnings.length === 0) return <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-700">Yasal bilgi kontrolleri tamam.</div>
  return <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 space-y-1">{warnings.map((w) => <div key={w} className="flex items-center gap-2 text-sm font-bold text-amber-800"><AlertTriangle className="h-4 w-4" />{w}</div>)}</div>
}

function ContactForm({ settings, setSection }: any) {
  const c = settings.contact
  return <div className="grid gap-4 md:grid-cols-2"><Field label="Telefon" value={c.phone} onChange={(v: string) => setSection("contact", "phone", v)} /><Field label="İkinci Telefon" value={c.secondPhone} onChange={(v: string) => setSection("contact", "secondPhone", v)} /><Field label="E-posta" value={c.email} onChange={(v: string) => setSection("contact", "email", v)} /><Field label="Destek E-postası" value={c.supportEmail} onChange={(v: string) => setSection("contact", "supportEmail", v)} /><Field label="İnsan Kaynakları E-postası" value={c.hrEmail} onChange={(v: string) => setSection("contact", "hrEmail", v)} /><Field label="Ülke" value={c.country} onChange={(v: string) => setSection("contact", "country", v)} /><Field label="İl" value={c.city} onChange={(v: string) => setSection("contact", "city", v)} /><Field label="İlçe" value={c.district} onChange={(v: string) => setSection("contact", "district", v)} /><Field label="Posta Kodu" value={c.zipCode} onChange={(v: string) => setSection("contact", "zipCode", v)} /><Field label="Harita Konumu" value={c.mapLocation} onChange={(v: string) => setSection("contact", "mapLocation", v)} /><Field label="Enlem" value={c.latitude} onChange={(v: string) => setSection("contact", "latitude", v)} /><Field label="Boylam" value={c.longitude} onChange={(v: string) => setSection("contact", "longitude", v)} /><div className="md:col-span-2 space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">Açık Adres</Label><Textarea value={c.address} onChange={(e) => setSection("contact", "address", e.target.value)} className="min-h-[100px] rounded-2xl border-slate-200" /></div></div>
}

function MapPreview({ settings }: any) {
  return <div className="relative min-h-[280px] overflow-hidden rounded-[28px] border border-white/70 bg-[#061224] shadow-2xl"><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.28),transparent_16rem),radial-gradient(circle_at_70%_70%,rgba(124,58,237,0.22),transparent_18rem)]" /><div className="relative z-10 p-8 text-white"><MapPin className="h-8 w-8 text-cyan-300" /><h3 className="mt-4 text-xl font-extrabold">Merkez Konum Kartı</h3><p className="mt-2 text-sm text-slate-300">{settings.contact.city || "İl"} / {settings.contact.district || "İlçe"} · {settings.contact.latitude || "-"}, {settings.contact.longitude || "-"}</p><div className="mt-8 grid grid-cols-4 gap-3">{[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-14 rounded-2xl border border-cyan-300/20 bg-cyan-300/10" />)}</div></div></div>
}

function BrandingForm({ settings, setSection, onLogoUpload }: any) {
  const b = settings.branding
  return <div className="grid gap-4 md:grid-cols-2"><LogoPicker label="Logo" value={b.logo} onUpload={(file: File) => onLogoUpload("logo", file)} onRemove={() => setSection("branding", "logo", "")} /><LogoPicker label="Sidebar Logo" value={b.sidebarLogo} onUpload={(file: File) => onLogoUpload("sidebarLogo", file)} onRemove={() => setSection("branding", "sidebarLogo", "")} /><LogoPicker label="Favicon" value={b.favicon} onUpload={(file: File) => onLogoUpload("favicon", file)} onRemove={() => setSection("branding", "favicon", "")} /><div className="grid grid-cols-3 gap-3"><Field label="Birincil Renk" type="color" value={b.primaryColor} onChange={(v: string) => setSection("branding", "primaryColor", v)} /><Field label="İkincil Renk" type="color" value={b.secondaryColor} onChange={(v: string) => setSection("branding", "secondaryColor", v)} /><Field label="Accent Renk" type="color" value={b.accentColor} onChange={(v: string) => setSection("branding", "accentColor", v)} /></div><Field label="Panel Başlığı" value={b.panelTitle} onChange={(v: string) => setSection("branding", "panelTitle", v)} /><Field label="Mobil Uygulama Başlığı" value={b.mobileTitle} onChange={(v: string) => setSection("branding", "mobileTitle", v)} /><Field label="Login Ekranı Sloganı" value={b.loginSlogan} onChange={(v: string) => setSection("branding", "loginSlogan", v)} /><div className="md:col-span-2 space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">Kurumsal Not</Label><Textarea value={b.corporateNote} onChange={(e) => setSection("branding", "corporateNote", e.target.value)} className="min-h-[90px] rounded-2xl border-slate-200" /></div></div>
}

function LogoPicker({ label, value, onUpload, onRemove }: any) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm">{value ? <img src={value} alt={label} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-slate-400" />}</div><div><div className="text-sm font-bold text-primary">{label}</div><div className="mt-2 flex gap-2"><label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"><Upload className="mr-1 inline h-3 w-3" />Yükle<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} /></label><Button size="sm" variant="outline" className="rounded-xl" onClick={onRemove}>Kaldır</Button></div></div></div></div>
}

function BrandPreview({ settings }: any) {
  const b = settings.branding
  return <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-[28px] border border-white/70 bg-white shadow-xl overflow-hidden"><div className="flex"><div className="w-28 p-4 text-white" style={{ background: b.primaryColor }}><div className="mb-4 h-10 w-10 rounded-xl bg-white/20" />{["Panel", "PDKS", "Rapor"].map((i) => <div key={i} className="mb-2 rounded-lg bg-white/10 px-2 py-1 text-xs">{i}</div>)}</div><div className="flex-1 p-5"><h3 className="font-extrabold text-primary">{b.panelTitle}</h3><div className="mt-4 grid grid-cols-2 gap-3"><div className="h-20 rounded-2xl" style={{ background: b.secondaryColor }} /><div className="h-20 rounded-2xl" style={{ background: b.accentColor }} /></div></div></div></div><div className="rounded-[28px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl"><Smartphone className="h-6 w-6 text-sky-300" /><h3 className="mt-4 text-xl font-extrabold">{b.mobileTitle}</h3><p className="text-sm text-slate-300">{b.loginSlogan || "Mobil uygulama önizlemesi"}</p><div className="mt-5 h-24 rounded-3xl bg-white/10" /></div></div>
}

function PoliciesForm({ settings, setSection }: any) {
  const p = settings.policies
  return <div className="grid gap-4 md:grid-cols-2"><Field label="Günlük standart çalışma saati" value={p.dailyHours} onChange={(v: string) => setSection("policies", "dailyHours", v)} /><Field label="Haftalık çalışma saati" value={p.weeklyHours} onChange={(v: string) => setSection("policies", "weeklyHours", v)} /><SelectField label="Fazla mesai hesaplama yöntemi" value={p.overtimeMethod} onChange={(v: string) => setSection("policies", "overtimeMethod", v)}><SelectItem value="standard">Standart</SelectItem><SelectItem value="shift-based">Vardiya Bazlı</SelectItem><SelectItem value="approval-based">Onay Bazlı</SelectItem></SelectField><Field label="Geç kalma toleransı" value={p.lateTolerance} onChange={(v: string) => setSection("policies", "lateTolerance", v)} /><Field label="Erken çıkış toleransı" value={p.earlyExitTolerance} onChange={(v: string) => setSection("policies", "earlyExitTolerance", v)} /><Field label="Yemek molası süresi" value={p.lunchBreak} onChange={(v: string) => setSection("policies", "lunchBreak", v)} /><Field label="Çay molası süresi" value={p.teaBreak} onChange={(v: string) => setSection("policies", "teaBreak", v)} /><Field label="Gece mesaisi başlangıç saati" value={p.nightStart} onChange={(v: string) => setSection("policies", "nightStart", v)} /><Field label="Hafta sonu mesai çarpanı" value={p.weekendMultiplier} onChange={(v: string) => setSection("policies", "weekendMultiplier", v)} /><Field label="Resmi tatil mesai çarpanı" value={p.holidayMultiplier} onChange={(v: string) => setSection("policies", "holidayMultiplier", v)} />{["autoTimesheet:Otomatik puantaj oluşturma","mobileEntry:Mobil giriş izni","qrRequired:QR zorunluluğu","gpsRequired:GPS zorunluluğu","deviceRequired:Device ID zorunluluğu","faceRequired:Yüz doğrulama zorunluluğu"].map((item) => { const [key,label]=item.split(":"); return <ToggleRow key={key} label={label} checked={p[key]} onChange={(v: boolean) => setSection("policies", key, v)} /> })}</div>
}

function SystemForm({ settings, setSection }: any) {
  const s = settings.system
  return <div className="grid gap-4 md:grid-cols-2"><Field label="Varsayılan saat dilimi" value={s.timezone} onChange={(v: string) => setSection("system", "timezone", v)} /><Field label="Tarih formatı" value={s.dateFormat} onChange={(v: string) => setSection("system", "dateFormat", v)} /><SelectField label="Saat formatı" value={s.timeFormat} onChange={(v: string) => setSection("system", "timeFormat", v)}><SelectItem value="24h">24 Saat</SelectItem><SelectItem value="12h">12 Saat</SelectItem></SelectField><SelectField label="Dil" value={s.language} onChange={(v: string) => setSection("system", "language", v)}><SelectItem value="tr">Türkçe</SelectItem><SelectItem value="en">English</SelectItem></SelectField><SelectField label="Para birimi" value={s.currency} onChange={(v: string) => setSection("system", "currency", v)}><SelectItem value="TRY">TRY</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectField><Field label="Oturum süresi" value={s.sessionDuration} onChange={(v: string) => setSection("system", "sessionDuration", v)} /><SelectField label="Şifre politikası" value={s.passwordPolicy} onChange={(v: string) => setSection("system", "passwordPolicy", v)}><SelectItem value="standard">Standart</SelectItem><SelectItem value="strong">Güçlü</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectField><SelectField label="Veri yedekleme sıklığı" value={s.backupFrequency} onChange={(v: string) => setSection("system", "backupFrequency", v)}><SelectItem value="daily">Günlük</SelectItem><SelectItem value="weekly">Haftalık</SelectItem><SelectItem value="monthly">Aylık</SelectItem></SelectField>{["twoFactor:2FA aktif/pasif","auditRequired:Audit log zorunluluğu","notifications:Bildirim sistemi aktif/pasif","emailNotifications:E-posta bildirimleri","pushNotifications:Push bildirimleri","smsNotifications:SMS bildirimleri","autoArchive:Otomatik arşivleme"].map((item) => { const [key,label]=item.split(":"); return <ToggleRow key={key} label={label} checked={s[key]} onChange={(v: boolean) => setSection("system", key, v)} /> })}</div>
}

function Integrations({ settings, setSection }: any) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{integrationCards.map((item) => { const Icon = item.icon; const status = settings.integrations?.[item.id]?.connected; return <Card key={item.id} className="group overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl transition-all hover:-translate-y-1"><CardHeader><div className="flex items-start justify-between"><div><CardTitle className="text-lg font-extrabold text-primary">{item.title}</CardTitle><p className="mt-1 text-xs font-medium text-slate-500">{item.description}</p></div><Icon className="h-6 w-6 text-accent" /></div></CardHeader><CardContent className="space-y-4"><Badge className={status ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-600 border-slate-200"}>{status ? "Bağlı" : "Hazır değil"}</Badge><div className="flex gap-2"><Button variant="outline" className="rounded-xl" onClick={() => setSection("integrations", item.id, { connected: !status })}>Ayarla</Button><Button variant="outline" className="rounded-xl">Test et</Button></div></CardContent></Card> })}</div>
}

function ActionBar({ save, reset }: any) {
  return <div className="flex flex-wrap justify-end gap-2 border-t pt-5"><Button variant="outline" className="rounded-xl" onClick={reset}><RefreshCw className="mr-2 h-4 w-4" />Sıfırla</Button><Button variant="outline" className="rounded-xl"><Eye className="mr-2 h-4 w-4" />Önizle</Button><Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={save}><Save className="mr-2 h-4 w-4" />Kaydet</Button></div>
}

function SummaryPanel({ completion, missingItems, settings, save, reset, exportJson }: any) {
  return <div className="xl:sticky xl:top-6 h-fit space-y-4"><Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur-xl"><CardHeader><CardTitle className="text-lg font-extrabold text-primary">Şirket Özeti</CardTitle></CardHeader><CardContent className="space-y-5"><div><div className="flex justify-between text-sm font-bold text-slate-600"><span>Profil tamamlanma</span><span>{completion}%</span></div><div className="mt-2 h-3 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500" style={{ width: `${completion}%` }} /></div></div><div className="space-y-2"><div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Eksik bilgiler</div>{missingItems.length === 0 ? <Badge className="bg-green-50 text-green-700">Eksik bilgi yok</Badge> : missingItems.map((item: string) => <div key={item} className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"><AlertTriangle className="h-3.5 w-3.5" />{item}</div>)}</div><InfoMini label="Son güncelleyen" value={settings.updatedBy || "-"} /><InfoMini label="Son güncelleme" value={settings.updatedAt ? formatDateTimeTR(settings.updatedAt) : "-"} /><InfoMini label="Sistem sağlık durumu" value="Sağlıklı" /><div className="grid gap-2"><Button className="rounded-xl bg-primary" onClick={save}>Hızlı Kaydet</Button><Button variant="outline" className="rounded-xl" onClick={reset}>Geri Al</Button><Button variant="outline" className="rounded-xl" onClick={exportJson}>Backup indir</Button></div></CardContent></Card></div>
}

function InfoMini({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"><span className="text-xs font-bold text-slate-400">{label}</span><span className="text-xs font-bold text-primary text-right">{value}</span></div>
}

function FileTextIcon() {
  return <FileText className="mr-2 h-4 w-4" />
}
