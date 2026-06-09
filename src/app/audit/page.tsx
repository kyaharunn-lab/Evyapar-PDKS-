"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  Globe2,
  Laptop,
  LockKeyhole,
  MapPin,
  MonitorSmartphone,
  MoreHorizontal,
  Printer,
  Radar,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCog,
  UserRound,
  Users,
  WifiOff,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { DATE_INPUT_PROPS, formatDateTimeTR } from "@/lib/date-time"
import { cn } from "@/lib/utils"

const AUDIT_KEY = "app_audit_logs"
const ALL = "__all__"

const WATCHED_STORAGE_KEYS: Record<string, { module: string; type: string; category: string }> = {
  app_personnel: { module: "Personel", type: "Personel kaydı değiştirildi", category: "Personel" },
  app_shifts: { module: "Vardiya", type: "Vardiya değiştirildi", category: "Vardiya" },
  app_leave_requests: { module: "İzin", type: "İzin kaydı değiştirildi", category: "İzin" },
  app_qr_points: { module: "QR", type: "QR noktası değiştirildi", category: "QR" },
  app_device_ids: { module: "Device", type: "Device ID kaydı değiştirildi", category: "Device" },
  app_access_control: { module: "Yetki", type: "Yetki değiştirildi", category: "Yetki" },
  app_kvkk_consents: { module: "KVKK", type: "KVKK kaydı değiştirildi", category: "KVKK" },
  app_attendance_logs: { module: "PDKS", type: "Giriş/çıkış kaydı değiştirildi", category: "Sistem" },
}

const CATEGORIES = ["Güvenlik", "Personel", "Vardiya", "İzin", "Device", "QR", "GPS", "Yetki", "KVKK", "Sistem", "Admin", "API", "Mobil"]
const RISKS = ["Düşük", "Orta", "Yüksek", "Kritik"]
const STATUSES = ["Başarılı", "Başarısız", "İncelemede"]
const CHANNELS = ["Web", "Mobil", "API", "Panel"]

const readLogs = () => {
  try {
    const raw = localStorage.getItem(AUDIT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeLogs = (logs: any[]) => {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(logs))
}

const toDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getLogTime = (log: any) => {
  const date = new Date(log?.timestamp || log?.createdAt || Date.now())
  if (Number.isNaN(date.getTime())) return { date: "-", time: "-" }
  return {
    date: toDateInput(date),
    time: new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      hourCycle: "h23",
      timeZone: "Europe/Istanbul",
    }).format(date),
  }
}

const normalizeLog = (log: any) => {
  const timestamp = log?.timestamp || log?.createdAt || Date.now()
  return {
    id: log?.id || log?.operationId || `audit-${timestamp}-${Math.random().toString(16).slice(2)}`,
    type: log?.type || log?.eventType || "Sistem işlemi",
    user: log?.user || log?.actor || log?.username || "Sistem",
    role: log?.role || "Sistem",
    branch: log?.branch || log?.branchName || "-",
    detail: log?.detail || log?.description || log?.message || "-",
    module: log?.module || "Sistem",
    category: log?.category || "Sistem",
    ipAddress: log?.ipAddress || log?.ip || "-",
    deviceId: log?.deviceId || log?.device || "-",
    location: log?.location || "-",
    risk: log?.risk || log?.riskLevel || "Düşük",
    status: log?.status || "Başarılı",
    channel: log?.channel || log?.platform || "Panel",
    adminAction: Boolean(log?.adminAction || /admin|yetki|rol/i.test(`${log?.type || ""} ${log?.module || ""}`)),
    oldValue: log?.oldValue || log?.before || "",
    newValue: log?.newValue || log?.after || "",
    browser: log?.browser || "-",
    os: log?.os || "-",
    deviceModel: log?.deviceModel || "-",
    gps: log?.gps || log?.gpsInfo || "-",
    sessionId: log?.sessionId || "-",
    timestamp,
  }
}

const createStorageAuditLog = (key: string, meta: { module: string; type: string; category: string }, oldValue: string | null, newValue: string | null) => ({
  id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type: meta.type,
  user: "Panel Kullanıcısı",
  role: "Admin",
  branch: "-",
  detail: `${key} localStorage kaydı güncellendi.`,
  module: meta.module,
  category: meta.category,
  ipAddress: "local",
  deviceId: "browser-storage",
  location: "-",
  risk: meta.category === "Yetki" || meta.category === "KVKK" ? "Yüksek" : "Orta",
  status: "Başarılı",
  channel: "Web",
  adminAction: meta.category === "Yetki" || meta.category === "Admin",
  oldValue: oldValue ? "Önceki kayıt mevcut" : "Boş",
  newValue: newValue ? "Yeni kayıt yazıldı" : "Boş",
  browser: typeof navigator !== "undefined" ? navigator.userAgent : "-",
  os: typeof navigator !== "undefined" ? navigator.platform : "-",
  deviceModel: "Web Browser",
  gps: "-",
  sessionId: "local-session",
  timestamp: Date.now(),
})

export default function AuditPage() {
  const { toast } = useToast()
  const [logs, setLogs] = React.useState<any[]>([])
  const [selectedLog, setSelectedLog] = React.useState<any | null>(null)
  const [filters, setFilters] = React.useState({
    startDate: "",
    endDate: "",
    user: "",
    branch: ALL,
    category: ALL,
    risk: ALL,
    status: ALL,
    deviceId: "",
    ipAddress: "",
    channel: ALL,
    adminOnly: "all",
    search: "",
  })

  const loadLogs = React.useCallback(() => {
    setLogs(readLogs().map(normalizeLog))
  }, [])

  React.useEffect(() => {
    loadLogs()

    const onStorage = (event: StorageEvent) => {
      if (event.key === AUDIT_KEY) {
        loadLogs()
        return
      }

      if (!event.key || !WATCHED_STORAGE_KEYS[event.key]) return
      const auditLog = createStorageAuditLog(event.key, WATCHED_STORAGE_KEYS[event.key], event.oldValue, event.newValue)
      const next = [auditLog, ...readLogs().map(normalizeLog)]
      writeLogs(next)
      setLogs(next)
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [loadLogs])

  React.useEffect(() => {
    const originalSetItem = localStorage.setItem.bind(localStorage)
    localStorage.setItem = (key: string, value: string) => {
      const oldValue = localStorage.getItem(key)
      originalSetItem(key, value)

      if (key === AUDIT_KEY || !WATCHED_STORAGE_KEYS[key] || oldValue === value) return
      const auditLog = createStorageAuditLog(key, WATCHED_STORAGE_KEYS[key], oldValue, value)
      const next = [auditLog, ...readLogs().map(normalizeLog)]
      originalSetItem(AUDIT_KEY, JSON.stringify(next))
      setLogs(next)
    }

    return () => {
      localStorage.setItem = originalSetItem
    }
  }, [])

  const branches = React.useMemo(() => Array.from(new Set(logs.map((log) => log.branch).filter((branch) => branch && branch !== "-"))), [logs])

  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      const { date } = getLogTime(log)
      const search = filters.search.toLowerCase()
      const searchTarget = `${log.user} ${log.ipAddress} ${log.deviceId} ${log.detail} ${log.branch} ${log.type}`.toLowerCase()

      return (!filters.startDate || date >= filters.startDate)
        && (!filters.endDate || date <= filters.endDate)
        && (!filters.user || log.user.toLowerCase().includes(filters.user.toLowerCase()))
        && (filters.branch === ALL || log.branch === filters.branch)
        && (filters.category === ALL || log.category === filters.category)
        && (filters.risk === ALL || log.risk === filters.risk)
        && (filters.status === ALL || log.status === filters.status)
        && (!filters.deviceId || log.deviceId.toLowerCase().includes(filters.deviceId.toLowerCase()))
        && (!filters.ipAddress || log.ipAddress.toLowerCase().includes(filters.ipAddress.toLowerCase()))
        && (filters.channel === ALL || log.channel === filters.channel)
        && (filters.adminOnly === "all" || (filters.adminOnly === "admin" ? log.adminAction : !log.adminAction))
        && (!search || searchTarget.includes(search))
    }).sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
  }, [filters, logs])

  const stats = React.useMemo(() => {
    const today = toDateInput(new Date())
    const last24 = Date.now() - 24 * 60 * 60 * 1000
    return {
      total: logs.length,
      today: logs.filter((log) => getLogTime(log).date === today).length,
      critical: logs.filter((log) => log.risk === "Kritik").length,
      failedLogin: logs.filter((log) => /giriş|login/i.test(log.type) && log.status === "Başarısız").length,
      deviceMismatch: logs.filter((log) => /device|cihaz|uyuşmaz/i.test(`${log.type} ${log.detail}`)).length,
      suspicious: logs.filter((log) => /şüpheli|suspicious|anomali/i.test(`${log.type} ${log.detail}`) || log.risk === "Kritik").length,
      admin: logs.filter((log) => log.adminAction).length,
      last24: logs.filter((log) => Number(log.timestamp || 0) >= last24).length,
    }
  }, [logs])

  const exportLogs = (format: "json" | "csv" | "filtered") => {
    const source = format === "filtered" ? filteredLogs : logs
    if (format === "csv" || format === "filtered") {
      const header = ["İşlem ID", "İşlem Türü", "Kullanıcı", "Rol", "Şube", "İşlem Detayı", "Modül", "IP Adresi", "Device ID", "Konum", "Tarih", "Saat", "Risk Seviyesi", "Durum"]
      const lines = source.map((log) => {
        const time = getLogTime(log)
        return [log.id, log.type, log.user, log.role, log.branch, log.detail, log.module, log.ipAddress, log.deviceId, log.location, time.date, time.time, log.risk, log.status]
      })
      const csv = [header, ...lines].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n")
      downloadBlob(`\uFEFF${csv}`, format === "filtered" ? "audit-logs-filtered.csv" : "audit-logs.csv", "text/csv;charset=utf-8")
      return
    }

    downloadBlob(JSON.stringify(source, null, 2), "audit-logs.json", "application/json;charset=utf-8")
  }

  const activityFeed = filteredLogs.slice(0, 8)
  const dailyChart = buildDateChart(filteredLogs)
  const categoryChart = buildGroupChart(filteredLogs, "category")
  const branchChart = buildGroupChart(filteredLogs, "branch")
  const channelChart = buildGroupChart(filteredLogs, "channel")
  const hourlyChart = buildHourlyChart(filteredLogs)

  const openLogAfterMenuClose = React.useCallback((log: any) => {
    window.setTimeout(() => setSelectedLog(log), 0)
  }, [])

  React.useEffect(() => {
    if (selectedLog || typeof document === "undefined") return
    const cleanup = window.setTimeout(() => {
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""
      document.body.removeAttribute("data-scroll-locked")
      document.body.removeAttribute("inert")
    }, 50)
    return () => window.clearTimeout(cleanup)
  }, [selectedLog])

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_12%_20%,rgba(124,58,237,0.22),transparent_28rem),linear-gradient(135deg,rgba(5,8,22,0.98),rgba(8,25,49,0.96)_56%,rgba(44,24,85,0.92))] p-8 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-100">
              <Radar className="h-3.5 w-3.5" />
              Security Operations Audit Center
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-cyan-300" />
              Denetim Logları
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              Kritik sistem işlemlerini, güvenlik olaylarını, cihaz izlerini ve yönetici aksiyonlarını merkezi olarak izleyin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Yazdır
            </Button>
            <Button className="h-11 rounded-2xl bg-white text-primary hover:bg-slate-100 shadow-xl" onClick={loadLogs}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <AuditKpi title="Toplam Log" value={stats.total} icon={FileText} gradient="from-slate-900 to-blue-900" />
        <AuditKpi title="Bugünkü İşlem" value={stats.today} icon={Clock3} gradient="from-sky-500 to-blue-950" />
        <AuditKpi title="Kritik Güvenlik Olayı" value={stats.critical} icon={ShieldAlert} gradient="from-rose-500 to-slate-950" />
        <AuditKpi title="Başarısız Giriş" value={stats.failedLogin} icon={WifiOff} gradient="from-red-500 to-zinc-950" />
        <AuditKpi title="Device Uyuşmazlığı" value={stats.deviceMismatch} icon={MonitorSmartphone} gradient="from-orange-500 to-slate-950" />
        <AuditKpi title="Şüpheli Aktivite" value={stats.suspicious} icon={AlertTriangle} gradient="from-purple-500 to-fuchsia-950" />
        <AuditKpi title="Aktif Admin İşlemi" value={stats.admin} icon={UserCog} gradient="from-indigo-500 to-slate-950" />
        <AuditKpi title="Son 24 Saat Değişiklikleri" value={stats.last24} icon={Activity} gradient="from-emerald-500 to-slate-950" />
      </div>

      <LiveActivityBar logs={activityFeed} />

      <Card className="premium-card overflow-hidden">
        <CardHeader className="border-b bg-slate-50/40">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Gelişmiş Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Kullanıcı adı, IP, device id, işlem açıklaması veya şube ara..."
              className="h-12 rounded-2xl border-slate-200 bg-white pl-11"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <FilterInput label="Başlangıç" type="date" value={filters.startDate} onChange={(value) => setFilters((prev) => ({ ...prev, startDate: value }))} />
            <FilterInput label="Bitiş" type="date" value={filters.endDate} onChange={(value) => setFilters((prev) => ({ ...prev, endDate: value }))} />
            <FilterInput label="Kullanıcı" value={filters.user} onChange={(value) => setFilters((prev) => ({ ...prev, user: value }))} />
            <FilterSelect label="Şube" value={filters.branch} onChange={(value) => setFilters((prev) => ({ ...prev, branch: value }))}>
              <SelectItem value={ALL}>Tüm Şubeler</SelectItem>
              {branches.map((branch) => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="İşlem Türü" value={filters.category} onChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}>
              <SelectItem value={ALL}>Tüm Kategoriler</SelectItem>
              {CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="Risk Seviyesi" value={filters.risk} onChange={(value) => setFilters((prev) => ({ ...prev, risk: value }))}>
              <SelectItem value={ALL}>Tüm Riskler</SelectItem>
              {RISKS.map((risk) => <SelectItem key={risk} value={risk}>{risk}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="Başarılı/Başarısız" value={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectItem value={ALL}>Tüm Durumlar</SelectItem>
              {STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </FilterSelect>
            <FilterInput label="Device ID" value={filters.deviceId} onChange={(value) => setFilters((prev) => ({ ...prev, deviceId: value }))} />
            <FilterInput label="IP Adresi" value={filters.ipAddress} onChange={(value) => setFilters((prev) => ({ ...prev, ipAddress: value }))} />
            <FilterSelect label="Mobil/Web" value={filters.channel} onChange={(value) => setFilters((prev) => ({ ...prev, channel: value }))}>
              <SelectItem value={ALL}>Tüm Kanallar</SelectItem>
              {CHANNELS.map((channel) => <SelectItem key={channel} value={channel}>{channel}</SelectItem>)}
            </FilterSelect>
            <FilterSelect label="Admin İşlemleri" value={filters.adminOnly} onChange={(value) => setFilters((prev) => ({ ...prev, adminOnly: value }))}>
              <SelectItem value="all">Tüm İşlemler</SelectItem>
              <SelectItem value="admin">Sadece Admin</SelectItem>
              <SelectItem value="non-admin">Admin Hariç</SelectItem>
            </FilterSelect>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <MiniChart title="Günlük işlem yoğunluğu" icon={BarChart3} data={dailyChart} />
            <MiniChart title="Güvenlik olayları" icon={ShieldAlert} data={categoryChart} />
            <MiniChart title="Şube bazlı aktiviteler" icon={Building2} data={branchChart} />
            <MiniChart title="Mobil/Web kullanım oranı" icon={MonitorSmartphone} data={channelChart} />
            <MiniChart title="Saatlik giriş yoğunluğu" icon={Clock3} data={hourlyChart} />
          </div>

          <Card className="premium-card overflow-hidden">
            <CardHeader className="border-b bg-slate-50/40">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Ana Audit Table</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => exportLogs("json")}><FileText className="mr-2 h-4 w-4" />PDF export</Button>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => exportLogs("csv")}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel export</Button>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => exportLogs("csv")}><Download className="mr-2 h-4 w-4" />CSV export</Button>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => exportLogs("filtered")}><Download className="mr-2 h-4 w-4" />Filtrelenmiş dışa aktar</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <div className="flex min-h-[380px] flex-col items-center justify-center p-16 text-center">
                  <div className="rounded-full bg-secondary/50 p-6 mb-6">
                    <HistoryIcon />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Kriterlere uygun audit log bulunmuyor.</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">Sistem işlemleri oluştuğunda kayıtlar `app_audit_logs` altında listelenecek.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[1500px]">
                    <TableHeader className="enterprise-table-header">
                      <TableRow>
                        <TableHead className="pl-6">İşlem ID</TableHead>
                        <TableHead>İşlem Türü</TableHead>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Şube</TableHead>
                        <TableHead>İşlem Detayı</TableHead>
                        <TableHead>Modül</TableHead>
                        <TableHead>IP Adresi</TableHead>
                        <TableHead>Device ID</TableHead>
                        <TableHead>Konum</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Saat</TableHead>
                        <TableHead>Risk Seviyesi</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right pr-6">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => {
                        const time = getLogTime(log)
                        return (
                          <TableRow key={log.id} className={cn("group hover:bg-slate-50/80 transition-all", log.risk === "Kritik" && "border-l-4 border-l-red-500 shadow-[inset_0_0_24px_rgba(239,68,68,0.08)]")}>
                            <TableCell className="pl-6 font-mono text-xs text-slate-500">{log.id}</TableCell>
                            <TableCell className="font-bold text-primary">{log.type}</TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>{log.role}</TableCell>
                            <TableCell>{log.branch}</TableCell>
                            <TableCell className="max-w-[280px] truncate text-sm text-slate-600">{log.detail}</TableCell>
                            <TableCell><CategoryBadge category={log.category} /></TableCell>
                            <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                            <TableCell className="font-mono text-xs">{log.deviceId}</TableCell>
                            <TableCell>{log.location}</TableCell>
                            <TableCell>{time.date}</TableCell>
                            <TableCell>{time.time}</TableCell>
                            <TableCell><RiskBadge risk={log.risk} /></TableCell>
                            <TableCell><StatusBadge status={log.status} /></TableCell>
                            <TableCell className="text-right pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><MoreHorizontal className="h-5 w-5 text-slate-500" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60 rounded-xl shadow-xl">
                                  <DropdownMenuLabel>Aksiyonlar</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => openLogAfterMenuClose(log)}><Eye className="mr-3 h-4 w-4 text-slate-400" />Detay görüntüle</DropdownMenuItem>
                                  <DropdownMenuItem><ShieldAlert className="mr-3 h-4 w-4 text-slate-400" />Güvenlik incelemesi başlat</DropdownMenuItem>
                                  <DropdownMenuItem><UserRound className="mr-3 h-4 w-4 text-slate-400" />Kullanıcı profiline git</DropdownMenuItem>
                                  <DropdownMenuItem><Laptop className="mr-3 h-4 w-4 text-slate-400" />Cihaz detayına git</DropdownMenuItem>
                                  <DropdownMenuItem><Building2 className="mr-3 h-4 w-4 text-slate-400" />Şubeye git</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <SecurityInsights logs={filteredLogs} />
      </div>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[760px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">Log Detayı</DialogTitle>
            <DialogDescription className="text-white/80">Tam işlem geçmişi, cihaz ve oturum bilgileri.</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="İşlem ID" value={selectedLog.id} />
              <InfoRow label="İşlem Türü" value={selectedLog.type} />
              <InfoRow label="Kullanıcı" value={selectedLog.user} />
              <InfoRow label="Rol" value={selectedLog.role} />
              <InfoRow label="Eski Değer" value={String(selectedLog.oldValue || "-")} />
              <InfoRow label="Yeni Değer" value={String(selectedLog.newValue || "-")} />
              <InfoRow label="Timestamp" value={formatDateTimeTR(selectedLog.timestamp)} />
              <InfoRow label="Browser Bilgisi" value={selectedLog.browser || "-"} />
              <InfoRow label="İşletim Sistemi" value={selectedLog.os || "-"} />
              <InfoRow label="Cihaz Modeli" value={selectedLog.deviceModel || "-"} />
              <InfoRow label="GPS Bilgisi" value={selectedLog.gps || "-"} />
              <InfoRow label="Oturum Bilgisi" value={selectedLog.sessionId || "-"} />
              <div className="md:col-span-2">
                <InfoRow label="Tam İşlem Geçmişi" value={selectedLog.detail || "-"} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
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

function AuditKpi({ title, value, icon: Icon, gradient }: any) {
  return (
    <Card className="group overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/70 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
      <CardContent className={cn("relative min-h-[132px] p-5 text-white bg-gradient-to-br", gradient)}>
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform group-hover:scale-150" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-5">
          <Icon className="h-6 w-6 text-white/85" />
          <div>
            <div className="text-3xl font-extrabold tracking-tight">{value}</div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/75">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LiveActivityBar({ logs }: { logs: any[] }) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-[#061224] shadow-2xl shadow-slate-950/20">
      <CardContent className="relative p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(34,211,238,0.18),transparent_22rem),radial-gradient(circle_at_75%_40%,rgba(124,58,237,0.2),transparent_24rem)]" />
        <div className="relative z-10 flex items-center gap-4 p-4">
          <div className="flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyan-100">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)] animate-pulse" />
            Canlı Aktivite
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            {logs.length === 0 ? (
              <p className="text-sm font-medium text-slate-300">Canlı log akışı bekleniyor.</p>
            ) : (
              <div className="flex animate-pulse gap-3 overflow-hidden">
                {logs.map((log) => <span key={log.id} className="shrink-0 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-950/20">{log.user} · {log.type}</span>)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  const inputProps = type === "date" ? DATE_INPUT_PROPS : { type }
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label>
      <Input {...inputProps} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border-slate-200 bg-white" />
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Güvenlik: "bg-red-50 text-accent border-red-100",
    Personel: "bg-blue-50 text-blue-700 border-blue-100",
    Vardiya: "bg-purple-50 text-purple-700 border-purple-100",
    İzin: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Device: "bg-orange-50 text-orange-700 border-orange-100",
    QR: "bg-cyan-50 text-cyan-700 border-cyan-100",
    GPS: "bg-sky-50 text-sky-700 border-sky-100",
    Yetki: "bg-indigo-50 text-indigo-700 border-indigo-100",
    KVKK: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    Admin: "bg-slate-100 text-slate-700 border-slate-200",
  }
  return <Badge className={cn("font-bold", colors[category] || "bg-slate-50 text-slate-600 border-slate-200")}>{category}</Badge>
}

function RiskBadge({ risk }: { risk: string }) {
  const style = {
    Düşük: "bg-green-50 text-green-700 border-green-100",
    Orta: "bg-yellow-50 text-yellow-700 border-yellow-100",
    Yüksek: "bg-orange-50 text-orange-700 border-orange-100",
    Kritik: "bg-red-50 text-accent border-red-100 shadow-[0_0_20px_rgba(239,68,68,0.35)]",
  }[risk] || "bg-slate-50 text-slate-600 border-slate-200"
  return <Badge className={cn("font-bold px-3 py-1 rounded-lg", style)}>{risk === "Kritik" && <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />}{risk}</Badge>
}

function StatusBadge({ status }: { status: string }) {
  const style = status === "Başarılı" ? "bg-green-50 text-green-700 border-green-100" : status === "Başarısız" ? "bg-red-50 text-accent border-red-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"
  return <Badge className={cn("font-bold px-3 py-1 rounded-lg", style)}>{status}</Badge>
}

function SecurityInsights({ logs }: { logs: any[] }) {
  const activeUsers = topList(logs, "user")
  const noisyDevices = topList(logs.filter((log) => log.status === "Başarısız" || /device|cihaz/i.test(log.detail)), "deviceId")
  const suspicious = logs.filter((log) => log.risk === "Kritik" || /şüpheli|suspicious/i.test(`${log.type} ${log.detail}`)).slice(0, 5)
  const riskyBranches = topList(logs.filter((log) => log.risk === "Yüksek" || log.risk === "Kritik"), "branch")
  const failed = logs.filter((log) => log.status === "Başarısız").slice(0, 5)
  const mismatch = logs.filter((log) => /device|cihaz|uyuşmaz/i.test(`${log.type} ${log.detail}`)).slice(0, 5)

  return (
    <div className="space-y-4">
      <InsightCard title="En aktif kullanıcılar" icon={Users} items={activeUsers} />
      <InsightCard title="En çok hata veren cihazlar" icon={Laptop} items={noisyDevices} />
      <InsightCard title="Şüpheli giriş denemeleri" icon={ShieldAlert} items={suspicious.map((log) => ({ label: log.user, value: log.type }))} />
      <InsightCard title="Riskli şubeler" icon={Building2} items={riskyBranches} />
      <InsightCard title="Son başarısız girişler" icon={LockKeyhole} items={failed.map((log) => ({ label: log.user, value: log.ipAddress }))} />
      <InsightCard title="Device mismatch listesi" icon={MonitorSmartphone} items={mismatch.map((log) => ({ label: log.deviceId, value: log.user }))} />
    </div>
  )
}

function InsightCard({ title, icon: Icon, items }: any) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Icon className="h-4 w-4 text-accent" />{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? <p className="text-xs font-medium text-muted-foreground">Kayıt yok</p> : items.map((item: any, index: number) => (
          <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <span className="truncate text-xs font-bold text-slate-700">{item.label || "-"}</span>
            <span className="ml-3 text-xs font-semibold text-slate-500">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function MiniChart({ title, icon: Icon, data }: any) {
  const max = Math.max(1, ...data.map((item: any) => item.value))
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Icon className="h-4 w-4 text-accent" />{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? <p className="text-xs font-medium text-muted-foreground">Grafik için log verisi bekleniyor.</p> : data.slice(0, 7).map((item: any) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500"><span className="truncate">{item.label}</span><span>{item.value}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500 shadow-[0_0_16px_rgba(124,58,237,0.35)] transition-all" style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border border-slate-100 bg-white rounded-xl px-4 py-3"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span><span className="text-sm font-semibold text-slate-700 text-right break-all">{value}</span></div>
}

function HistoryIcon() {
  return <Activity className="h-12 w-12 text-muted-foreground" />
}

function topList(logs: any[], key: string) {
  const counts = new Map<string, number>()
  logs.forEach((log) => {
    const value = log[key] || "-"
    if (value === "-") return
    counts.set(value, (counts.get(value) || 0) + 1)
  })
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }))
}

function buildGroupChart(logs: any[], key: string) {
  return topList(logs, key).map((item) => ({ label: item.label, value: item.value }))
}

function buildDateChart(logs: any[]) {
  const counts = new Map<string, number>()
  logs.forEach((log) => {
    const date = getLogTime(log).date
    if (date === "-") return
    counts.set(date, (counts.get(date) || 0) + 1)
  })
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-7).map(([label, value]) => ({ label, value }))
}

function buildHourlyChart(logs: any[]) {
  const counts = new Map<string, number>()
  logs.forEach((log) => {
    const hour = getLogTime(log).time.slice(0, 2)
    if (!hour) return
    counts.set(`${hour}:00`, (counts.get(`${hour}:00`) || 0) + 1)
  })
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value }))
}

