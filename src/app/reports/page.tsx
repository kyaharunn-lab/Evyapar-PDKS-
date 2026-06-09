"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Coffee,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Fingerprint,
  Layers3,
  LineChart,
  MapPin,
  MonitorSmartphone,
  MoreHorizontal,
  PieChart,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Smartphone,
  Timer,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  UserX,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { DATE_INPUT_PROPS, formatDateTR } from "@/lib/date-time"
import { cn } from "@/lib/utils"

const SETTINGS_KEY = "app_reports_settings"
const ALL = "__all__"

const STORAGE_KEYS = {
  personnel: "app_personnel",
  branches: "app_branches",
  departments: "app_departments",
  positions: "app_positions",
  shifts: "app_shifts",
  leaves: "app_leave_requests",
  attendance: "app_attendance_records",
  attendanceLegacy: "app_attendance_logs",
  livePresence: "app_live_presence",
  breaks: "app_break_records",
  devices: "app_device_ids",
  access: "app_access_controls",
  accessLegacy: "app_access_control",
  qrPoints: "app_qr_points",
  absence: "app_absence_reports",
  audit: "app_audit_logs",
}

const REPORT_COLUMNS = [
  "Personel",
  "Sicil",
  "Şube",
  "Departman",
  "Giriş",
  "Çıkış",
  "Çalışma süresi",
  "Geç kalma",
  "Fazla mesai",
  "Eksik mesai",
  "İzin",
  "Device",
  "QR",
  "GPS doğrulama",
  "Risk seviyesi",
]

const REPORT_CATEGORIES = [
  { title: "Personel Raporları", description: "Kadro, aktiflik ve organizasyon kırılımları.", icon: Users },
  { title: "Devamsızlık Raporları", description: "Geç kalma, eksik mesai ve yoklama analizi.", icon: UserX },
  { title: "Mesai Raporları", description: "Çalışma süresi ve fazla mesai trendleri.", icon: Timer },
  { title: "Vardiya Raporları", description: "Vardiya doluluk ve planlama yoğunluğu.", icon: CalendarClock },
  { title: "İzin Raporları", description: "Talep, onay ve izinli gün analizleri.", icon: FileText },
  { title: "Güvenlik Raporları", description: "Şüpheli giriş ve risk olayları.", icon: ShieldAlert },
  { title: "Device Raporları", description: "Cihaz eşleşmeleri ve uyuşmazlıkları.", icon: Smartphone },
  { title: "QR Giriş Raporları", description: "QR noktaları ve doğrulama performansı.", icon: QrCode },
  { title: "Şube Performansları", description: "Şube bazlı giriş ve operasyon metrikleri.", icon: Building2 },
  { title: "Departman Analizleri", description: "Departman çalışma süresi ve devamsızlık.", icon: Layers3 },
  { title: "Mobil Kullanım Analizi", description: "Mobil, web, QR ve device kanal dağılımı.", icon: MonitorSmartphone },
  { title: "Audit & Güvenlik", description: "Denetim logları ve SOC görünümü.", icon: Fingerprint },
]

const AUTO_REPORTS = [
  { title: "Günlük rapor", description: "Bugünkü operasyon özeti.", icon: Activity },
  { title: "Haftalık rapor", description: "Son 7 gün KPI karşılaştırması.", icon: LineChart },
  { title: "Aylık rapor", description: "Aylık performans ve trend raporu.", icon: BarChart3 },
  { title: "Kritik olay raporu", description: "Yüksek riskli güvenlik olayları.", icon: ShieldAlert },
  { title: "Devamsızlık özeti", description: "Devamsızlık ve geç kalma kırılımı.", icon: UserX },
  { title: "Mesai özeti", description: "Çalışma süresi ve fazla mesai görünümü.", icon: Clock3 },
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
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const writeSettings = (settings: any) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

const getPersonId = (person: any) => (person?.id || person?.personnelId || person?.personnelCode || "").toString()
const getPersonnelName = (person: any) => (
  person?.fullName ||
  [person?.name, person?.surname].filter(Boolean).join(" ") ||
  [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
  person?.personnelCode ||
  "Personel"
).toString()
const getBranchId = (branch: any) => (branch?.id || branch?.branchCode || branch?.code || "").toString()
const getBranchName = (branch: any) => (branch?.branchName || branch?.name || branch?.branchCode || "Şube").toString()
const getDepartmentId = (department: any) => (department?.id || department?.departmentCode || department?.code || "").toString()
const getDepartmentName = (department: any) => (department?.departmentName || department?.name || department?.departmentCode || "Departman").toString()
const getPositionId = (position: any) => (position?.id || position?.positionCode || position?.code || "").toString()
const getPositionName = (position: any) => (position?.positionName || position?.name || position?.title || position?.positionCode || "Pozisyon").toString()

const getAttendancePersonId = (log: any) => (log?.personnelId || log?.personelId || log?.personId || "").toString()

const hasEntry = (log: any) => Boolean(log?.checkInTime || log?.entryTime || log?.saat)

const isClosedAttendance = (log: any) => Boolean(log?.checkOutTime || log?.exitTime || log?.status === "Çıkış yaptı" || String(log?.status || "").toLowerCase() === "outside")

const isInsideAttendance = (log: any) => !isClosedAttendance(log) && (String(log?.status || "").toLowerCase() === "inside" || log?.status === "Fazla Mesai")

const mergeAttendance = (records: any[], legacy: any[]) => {
  const map = new Map<string, any>()
  ;[...records, ...legacy].forEach((log, index) => {
    const key = log?.id || `${getAttendancePersonId(log)}-${getLogDate(log)}-${log?.checkInTime || log?.entryTime || log?.saat || index}`
    if (!map.has(key)) map.set(key, log)
  })
  return Array.from(map.values())
}

const ddmmyyyy = (date: string) => {
  const value = date.toString().slice(0, 10)
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

const toDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const todayInput = () => toDateInput(new Date())

const addDaysInput = (dateInput: string, days: number) => {
  const date = new Date(`${dateInput}T12:00:00`)
  date.setDate(date.getDate() + days)
  return toDateInput(date)
}

const getLogDate = (log: any) => {
  if (log?.date) {
    const rawDate = log.date.toString().slice(0, 10)
    const trDate = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    return trDate ? `${trDate[3]}-${trDate[2]}-${trDate[1]}` : rawDate
  }
  const value = log?.entryTime || log?.timestamp || log?.createdAt || log?.updatedAt
  if (!value) return ""
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? "" : toDateInput(date)
}

const getTimeFromValue = (value: any) => {
  if (!value) return ""
  if (typeof value === "string") {
    const match = value.match(/^(\d{1,2}):(\d{2})/)
    if (match) return `${match[1].padStart(2, "0")}:${match[2]}`
  }
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", hour12: false, hourCycle: "h23", timeZone: "Europe/Istanbul" }).format(date)
}

const toMinutes = (time?: string) => {
  const match = time?.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [data, setData] = React.useState({
    personnel: [] as any[],
    branches: [] as any[],
    departments: [] as any[],
    positions: [] as any[],
    shifts: [] as any[],
    leaves: [] as any[],
    attendance: [] as any[],
    livePresence: [] as any[],
    breaks: [] as any[],
    devices: [] as any[],
    access: [] as any[],
    qrPoints: [] as any[],
    absence: [] as any[],
    audit: [] as any[],
  })
  const [settings, setSettings] = React.useState<any>({ savedReports: [] })
  const [isReportOpen, setIsReportOpen] = React.useState(false)
  const [reportForm, setReportForm] = React.useState({
    name: "",
    description: "",
    startDate: addDaysInput(todayInput(), -30),
    endDate: todayInput(),
    selectedColumns: ["Personel", "Sicil", "Şube", "Departman", "Giriş", "Çıkış", "Risk seviyesi"] as string[],
  })
  const [filters, setFilters] = React.useState({
    startDate: addDaysInput(todayInput(), -30),
    endDate: todayInput(),
    branchId: ALL,
    departmentId: ALL,
    positionId: ALL,
    shiftId: ALL,
    personnelId: ALL,
    channel: ALL,
    qrOnly: "all",
    deviceId: "",
    lateOnly: "all",
    overtimeOnly: "all",
    leaveStatus: ALL,
  })

  const loadData = React.useCallback(() => {
    setData({
      personnel: readArray(STORAGE_KEYS.personnel).filter((person: any) => !person?.isDeleted),
      branches: readArray(STORAGE_KEYS.branches),
      departments: readArray(STORAGE_KEYS.departments),
      positions: readArray(STORAGE_KEYS.positions),
      shifts: readArray(STORAGE_KEYS.shifts),
      leaves: readArray(STORAGE_KEYS.leaves),
      attendance: mergeAttendance(readArray(STORAGE_KEYS.attendance), [...readArray(STORAGE_KEYS.attendanceLegacy), ...readArray(STORAGE_KEYS.livePresence)]),
      livePresence: readArray(STORAGE_KEYS.livePresence),
      breaks: readArray(STORAGE_KEYS.breaks),
      devices: readArray(STORAGE_KEYS.devices),
      access: [...readArray(STORAGE_KEYS.access), ...readArray(STORAGE_KEYS.accessLegacy)],
      qrPoints: readArray(STORAGE_KEYS.qrPoints),
      absence: readArray(STORAGE_KEYS.absence),
      audit: readArray(STORAGE_KEYS.audit),
    })
    setSettings({ savedReports: [], ...readSettings() })
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const branchById = React.useMemo(() => new Map(data.branches.map((branch) => [getBranchId(branch), branch])), [data.branches])
  const deptById = React.useMemo(() => new Map(data.departments.map((department) => [getDepartmentId(department), department])), [data.departments])
  const positionById = React.useMemo(() => new Map(data.positions.map((position) => [getPositionId(position), position])), [data.positions])
  const deviceByPerson = React.useMemo(() => new Map(data.devices.map((device) => [device.personnelId, device])), [data.devices])

  const filteredPersonnel = React.useMemo(() => {
    return data.personnel.filter((person) => {
      const personId = getPersonId(person)
      return (filters.personnelId === ALL || personId === filters.personnelId)
        && (filters.branchId === ALL || person?.branchId === filters.branchId)
        && (filters.departmentId === ALL || person?.departmentId === filters.departmentId)
        && (filters.positionId === ALL || person?.positionId === filters.positionId || person?.position === filters.positionId)
        && (!filters.deviceId || `${deviceByPerson.get(personId)?.deviceId || ""}`.toLowerCase().includes(filters.deviceId.toLowerCase()))
    })
  }, [data.personnel, deviceByPerson, filters])

  const filteredAttendance = React.useMemo(() => {
    const personnelIds = new Set(filteredPersonnel.map(getPersonId))
    return data.attendance.filter((log) => {
      const date = getLogDate(log)
      const personnelId = getAttendancePersonId(log)
      const channel = (log?.verificationMethod || log?.channel || log?.platform || "").toString()
      const isQr = /qr/i.test(channel)
      return (!date || (date >= filters.startDate && date <= filters.endDate))
        && (!personnelId || personnelIds.has(personnelId))
        && (filters.channel === ALL || channel === filters.channel)
        && (filters.qrOnly === "all" || (filters.qrOnly === "qr" ? isQr : !isQr))
    })
  }, [data.attendance, filteredPersonnel, filters])

  const filteredLeaves = React.useMemo(() => {
    const personnelIds = new Set(filteredPersonnel.map(getPersonId))
    return data.leaves.filter((leave) => {
      const personnelId = (leave?.personnelId || leave?.personId || "").toString()
      const status = (leave?.status || "Pending").toString()
      return (!personnelId || personnelIds.has(personnelId)) && (filters.leaveStatus === ALL || status === filters.leaveStatus)
    })
  }, [data.leaves, filteredPersonnel, filters.leaveStatus])

  const filteredShifts = React.useMemo(() => {
    return data.shifts.filter((shift) => {
      const date = (shift?.startDate || shift?.date || "").toString().slice(0, 10)
      return (filters.shiftId === ALL || shift?.id === filters.shiftId)
        && (!date || (date >= filters.startDate && date <= filters.endDate))
        && (filters.branchId === ALL || shift?.branchId === filters.branchId || shift?.branchId === "__all_branches__")
    })
  }, [data.shifts, filters])

  const tableRows = React.useMemo(() => {
    return filteredPersonnel.map((person) => {
      const personId = getPersonId(person)
      const logs = filteredAttendance.filter((log) => getAttendancePersonId(log) === personId)
      const firstLog = logs[0]
      const entry = getTimeFromValue(firstLog?.entryTime || firstLog?.checkInTime)
      const exit = getTimeFromValue(firstLog?.exitTime || firstLog?.checkOutTime)
      const entryMinutes = toMinutes(entry)
      const exitMinutes = toMinutes(exit)
      const workMinutes = entryMinutes !== null && exitMinutes !== null ? Math.max(0, exitMinutes - entryMinutes) : 0
      const isLate = entryMinutes !== null && entryMinutes > 9 * 60
      const storedOvertime = Number(firstLog?.overtimeMinutes || 0)
      const overtime = storedOvertime > 0 ? storedOvertime : workMinutes > 9 * 60 ? workMinutes - 9 * 60 : 0
      const leave = filteredLeaves.find((item) => (item?.personnelId || item?.personId || "").toString() === personId)
      const branch = branchById.get(person?.branchId || "")
      const department = deptById.get(person?.departmentId || "")
      const device = deviceByPerson.get(personId)
      const channel = (firstLog?.verificationMethod || firstLog?.channel || "-").toString()
      const risk = data.audit.some((log) => `${log.user || log.actor || ""}`.includes(getPersonnelName(person)) && (log.risk === "Kritik" || log.riskLevel === "Kritik")) ? "Kritik" : overtime > 0 || isLate ? "Orta" : "Düşük"
      return {
        person,
        personId,
        branch,
        department,
        entry,
        exit,
        workMinutes,
        isLate,
        overtime,
        leave,
        device,
        channel,
        qr: /qr/i.test(channel),
        gps: firstLog?.location ? "Doğrulandı" : "-",
        risk,
      }
    }).filter((row) => (filters.lateOnly === "all" || row.isLate) && (filters.overtimeOnly === "all" || row.overtime > 0))
  }, [branchById, data.audit, deptById, deviceByPerson, filteredAttendance, filteredLeaves, filteredPersonnel, filters.lateOnly, filters.overtimeOnly])

  const stats = React.useMemo(() => {
    const today = todayInput()
    const todayLogs = filteredAttendance.filter((log) => getLogDate(log) === today && hasEntry(log))
    const todayEntryPersonIds = new Set(todayLogs.map(getAttendancePersonId).filter(Boolean))
    const activePersonnel = filteredPersonnel.filter((person) => person?.status !== "Inactive")
    const todayLeavePersonIds = new Set(filteredLeaves
      .filter((leave) => today >= String(leave?.startDate || "").slice(0, 10) && today <= String(leave?.endDate || leave?.startDate || "").slice(0, 10) && /approved|onay/i.test(String(leave?.status || "")))
      .map((leave) => (leave?.personnelId || leave?.personId || "").toString())
      .filter(Boolean))
    const late = tableRows.filter((row) => row.isLate).length
    const absentCount = activePersonnel.filter((person) => {
      const personId = getPersonId(person)
      return !todayEntryPersonIds.has(personId) && !todayLeavePersonIds.has(personId)
    }).length
    const absenceRate = activePersonnel.length ? Math.round((absentCount / activePersonnel.length) * 100) : 0
    const overtimeMinutes = tableRows.reduce((sum, row) => sum + row.overtime, 0)
    const pendingLeaves = data.leaves.filter((leave) => /pending|bekliyor/i.test(leave?.status || "Pending")).length
    const avgWork = tableRows.length ? Math.round(tableRows.reduce((sum, row) => sum + row.workMinutes, 0) / tableRows.length / 60 * 10) / 10 : 0
    const suspicious = data.audit.filter((log) => /şüpheli|suspicious/i.test(`${log.type || ""} ${log.detail || log.message || ""}`) || log.risk === "Kritik" || log.riskLevel === "Kritik").length
    const mismatch = data.audit.filter((log) => /device|cihaz|uyuşmaz/i.test(`${log.type || ""} ${log.detail || log.message || ""}`)).length
    const mobileLogs = filteredAttendance.filter((log) => /mobil|mobile/i.test(`${log.channel || log.platform || log.verificationMethod || ""}`)).length
    return {
      totalPersonnel: filteredPersonnel.length,
      activePersonnel: activePersonnel.length,
      todayEntries: todayLogs.length,
      late,
      absenceRate,
      overtime: Math.round(overtimeMinutes / 60 * 10) / 10,
      activeShift: filteredShifts.length,
      pendingLeaves,
      avgWork,
      suspicious,
      mismatch,
      mobileRate: filteredAttendance.length ? Math.round((mobileLogs / filteredAttendance.length) * 100) : 0,
    }
  }, [data.audit, data.leaves, filteredAttendance, filteredLeaves, filteredPersonnel, filteredShifts.length, tableRows])

  const charts = React.useMemo(() => {
    return {
      daily: buildDateChart(filteredAttendance),
      branch: buildBranchChart(filteredAttendance, data.personnel, branchById),
      absence: [
        { label: "Normal", value: Math.max(0, tableRows.length - tableRows.filter((row) => row.isLate || row.leave).length) },
        { label: "Geç", value: tableRows.filter((row) => row.isLate).length },
        { label: "İzinli", value: tableRows.filter((row) => row.leave).length },
      ],
      lateHeatmap: buildLateHeatmap(tableRows),
      shiftDensity: buildShiftDensity(filteredShifts),
      channel: buildChannelChart(filteredAttendance),
      overtime: buildOvertimeTrend(tableRows),
      deptWork: buildDepartmentWork(tableRows),
    }
  }, [branchById, data.personnel, filteredAttendance, filteredShifts, tableRows])

  const insights = React.useMemo(() => buildInsights(stats, charts, tableRows), [charts, stats, tableRows])

  const saveCustomReport = () => {
    if (!reportForm.name.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Rapor adı zorunludur." })
      return
    }
    const report = {
      id: `report-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...reportForm,
      filters,
      createdAt: Date.now(),
    }
    const next = { ...settings, savedReports: [report, ...(settings.savedReports || [])] }
    writeSettings(next)
    setSettings(next)
    setIsReportOpen(false)
    toast({ title: "Başarılı", description: "Özel rapor kaydedildi." })
  }

  const exportCsv = (filtered = false) => {
    const rows = filtered ? tableRows : tableRows
    const csv = [
      REPORT_COLUMNS,
      ...rows.map((row) => [
        getPersonnelName(row.person),
        row.person?.registryNo || row.person?.personnelCode || row.personId,
        row.branch ? getBranchName(row.branch) : "-",
        row.department ? getDepartmentName(row.department) : "-",
        row.entry || "-",
        row.exit || "-",
        `${Math.round(row.workMinutes / 60 * 10) / 10} saat`,
        row.isLate ? "Evet" : "Hayır",
        row.overtime ? `${Math.round(row.overtime / 60 * 10) / 10} saat` : "-",
        row.exit ? "-" : "Çıkış yok",
        row.leave ? row.leave.status || "İzin" : "-",
        row.device?.deviceId || "-",
        row.qr ? "Evet" : "Hayır",
        row.gps,
        row.risk,
      ]),
    ].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n")
    downloadBlob(`\uFEFF${csv}`, filtered ? "reports-filtered.csv" : "reports-center.csv", "text/csv;charset=utf-8")
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_12%_20%,rgba(59,130,246,0.22),transparent_28rem),radial-gradient(circle_at_82%_10%,rgba(124,58,237,0.2),transparent_26rem),linear-gradient(135deg,rgba(5,8,22,0.98),rgba(8,25,49,0.96)_56%,rgba(44,24,85,0.92))] p-8 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-100">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics & Reports Center
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <PieChart className="h-8 w-8 text-sky-300" />
              Raporlar Merkezi
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              Personel, vardiya, PDKS, izin, cihaz, QR ve güvenlik operasyonlarını tek kurumsal BI ekranından analiz edin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Yazdır</Button>
            <Button className="h-11 rounded-2xl bg-white text-primary hover:bg-slate-100 shadow-xl" onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" />Verileri Yenile</Button>
          </div>
        </div>
      </div>

      <Tabs value="general" className="space-y-0">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            <ReportCenterTab value="general" label="Genel Raporlar" href="/reports" />
            <ReportCenterTab value="overtime" label="Mesai Analizi" href="/reports/overtime" />
            <ReportCenterTab value="absence" label="Devamsızlık" href="/reports/absence" />
            <ReportCenterTab value="security" label="Güvenlik" href="/audit" />
            <ReportCenterTab value="shift" label="Vardiya Analizi" href="/shifts" />
            <ReportCenterTab value="ai" label="AI Özetleri" href="/ai-insights" />
          </TabsList>
        </div>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        <ReportKpi title="Toplam Personel" value={stats.totalPersonnel} icon={Users} gradient="from-slate-900 to-blue-900" />
        <ReportKpi title="Aktif Personel" value={stats.activePersonnel} icon={UserCheck} gradient="from-emerald-500 to-teal-950" />
        <ReportKpi title="Bugünkü Giriş Sayısı" value={stats.todayEntries} icon={Fingerprint} gradient="from-sky-500 to-blue-950" />
        <ReportKpi title="Geç Kalan Personel" value={stats.late} icon={Clock3} gradient="from-amber-500 to-orange-950" />
        <ReportKpi title="Devamsızlık Oranı" value={`${stats.absenceRate}%`} icon={UserX} gradient="from-rose-500 to-slate-950" />
        <ReportKpi title="Fazla Mesai" value={`${stats.overtime} sa`} icon={Timer} gradient="from-purple-500 to-fuchsia-950" />
        <ReportKpi title="Aktif Vardiya" value={stats.activeShift} icon={CalendarClock} gradient="from-indigo-500 to-slate-950" />
        <ReportKpi title="Bekleyen İzin" value={stats.pendingLeaves} icon={FileText} gradient="from-yellow-500 to-slate-950" />
        <ReportKpi title="Ortalama Çalışma Süresi" value={`${stats.avgWork} sa`} icon={Activity} gradient="from-cyan-500 to-slate-950" />
        <ReportKpi title="Şüpheli Giriş" value={stats.suspicious} icon={ShieldAlert} gradient="from-red-500 to-zinc-950" />
        <ReportKpi title="Device Uyuşmazlığı" value={stats.mismatch} icon={MonitorSmartphone} gradient="from-orange-500 to-slate-950" />
        <ReportKpi title="Mobil Giriş Oranı" value={`${stats.mobileRate}%`} icon={Smartphone} gradient="from-blue-500 to-violet-950" />
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="border-b bg-slate-50/40"><CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest"><Filter className="h-4 w-4" />Akıllı Filtre Bar</CardTitle></CardHeader>
        <CardContent className="p-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <FilterInput label="Başlangıç" type="date" value={filters.startDate} onChange={(value) => setFilters((prev) => ({ ...prev, startDate: value }))} />
          <FilterInput label="Bitiş" type="date" value={filters.endDate} onChange={(value) => setFilters((prev) => ({ ...prev, endDate: value }))} />
          <FilterSelect label="Şube" value={filters.branchId} onChange={(value) => setFilters((prev) => ({ ...prev, branchId: value }))}><SelectItem value={ALL}>Tüm Şubeler</SelectItem>{data.branches.map((branch) => <SelectItem key={getBranchId(branch)} value={getBranchId(branch)}>{getBranchName(branch)}</SelectItem>)}</FilterSelect>
          <FilterSelect label="Departman" value={filters.departmentId} onChange={(value) => setFilters((prev) => ({ ...prev, departmentId: value }))}><SelectItem value={ALL}>Tüm Departmanlar</SelectItem>{data.departments.map((department) => <SelectItem key={getDepartmentId(department)} value={getDepartmentId(department)}>{getDepartmentName(department)}</SelectItem>)}</FilterSelect>
          <FilterSelect label="Pozisyon" value={filters.positionId} onChange={(value) => setFilters((prev) => ({ ...prev, positionId: value }))}><SelectItem value={ALL}>Tüm Pozisyonlar</SelectItem>{data.positions.map((position) => <SelectItem key={getPositionId(position)} value={getPositionId(position)}>{getPositionName(position)}</SelectItem>)}</FilterSelect>
          <FilterSelect label="Vardiya" value={filters.shiftId} onChange={(value) => setFilters((prev) => ({ ...prev, shiftId: value }))}><SelectItem value={ALL}>Tüm Vardiyalar</SelectItem>{data.shifts.map((shift) => <SelectItem key={shift.id} value={shift.id}>{shift.name || shift.id}</SelectItem>)}</FilterSelect>
          <FilterSelect label="Personel" value={filters.personnelId} onChange={(value) => setFilters((prev) => ({ ...prev, personnelId: value }))}><SelectItem value={ALL}>Tüm Personeller</SelectItem>{data.personnel.map((person) => <SelectItem key={getPersonId(person)} value={getPersonId(person)}>{getPersonnelName(person)}</SelectItem>)}</FilterSelect>
          <FilterSelect label="Mobil/Web" value={filters.channel} onChange={(value) => setFilters((prev) => ({ ...prev, channel: value }))}><SelectItem value={ALL}>Tüm Kanallar</SelectItem><SelectItem value="Mobile">Mobil</SelectItem><SelectItem value="Web">Web</SelectItem><SelectItem value="QR">QR</SelectItem></FilterSelect>
          <FilterSelect label="QR girişleri" value={filters.qrOnly} onChange={(value) => setFilters((prev) => ({ ...prev, qrOnly: value }))}><SelectItem value="all">Tümü</SelectItem><SelectItem value="qr">Sadece QR</SelectItem><SelectItem value="non-qr">QR Hariç</SelectItem></FilterSelect>
          <FilterInput label="Device ID" value={filters.deviceId} onChange={(value) => setFilters((prev) => ({ ...prev, deviceId: value }))} />
          <FilterSelect label="Geç giriş" value={filters.lateOnly} onChange={(value) => setFilters((prev) => ({ ...prev, lateOnly: value }))}><SelectItem value="all">Tümü</SelectItem><SelectItem value="late">Sadece Geç</SelectItem></FilterSelect>
          <FilterSelect label="Fazla mesai" value={filters.overtimeOnly} onChange={(value) => setFilters((prev) => ({ ...prev, overtimeOnly: value }))}><SelectItem value="all">Tümü</SelectItem><SelectItem value="overtime">Sadece Fazla Mesai</SelectItem></FilterSelect>
          <FilterSelect label="İzin durumu" value={filters.leaveStatus} onChange={(value) => setFilters((prev) => ({ ...prev, leaveStatus: value }))}><SelectItem value={ALL}>Tüm İzinler</SelectItem><SelectItem value="Pending">Bekliyor</SelectItem><SelectItem value="Approved">Onaylı</SelectItem><SelectItem value="Rejected">Reddedildi</SelectItem></FilterSelect>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {REPORT_CATEGORIES.map((category) => <CategoryCard key={category.title} category={category} />)}
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <AnalyticsChart title="Günlük Giriş/Çıkış Grafiği" subtitle="Saat ve gün bazlı yoğunluk" icon={LineChart} data={charts.daily} />
            <AnalyticsChart title="Şube Performans Grafiği" subtitle="Şube bazlı giriş performansı" icon={Building2} data={charts.branch} />
            <DonutChart title="Devamsızlık Analizi" data={charts.absence} />
            <HeatmapChart title="Geç Kalma Analizi" data={charts.lateHeatmap} />
            <AnalyticsChart title="Vardiya Yoğunluğu" subtitle="Planlanan vardiya dağılımı" icon={CalendarClock} data={charts.shiftDensity} />
            <AnalyticsChart title="Mobil vs QR vs Device Girişleri" subtitle="Kanal karşılaştırması" icon={MonitorSmartphone} data={charts.channel} />
            <AnalyticsChart title="Fazla Mesai Analizi" subtitle="Trend görünümü" icon={TrendingUp} data={charts.overtime} />
            <AnalyticsChart title="Departman Bazlı Çalışma Süresi" subtitle="Ortalama süre kırılımı" icon={Briefcase} data={charts.deptWork} />
          </div>

          <Card className="premium-card overflow-hidden">
            <CardHeader className="border-b bg-slate-50/40">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Detaylı Rapor Tablosu</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => window.print()}><FileText className="mr-2 h-4 w-4" />PDF export</Button>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => exportCsv()}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel export</Button>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => exportCsv()}><Download className="mr-2 h-4 w-4" />CSV export</Button>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Dashboard snapshot</Button>
                  <Button className="h-10 rounded-xl bg-accent hover:bg-accent/90" onClick={() => setIsReportOpen(true)}><Save className="mr-2 h-4 w-4" />Özel Rapor Oluştur</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {tableRows.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center p-16 text-center">
                  <div className="rounded-full bg-secondary/50 p-6 mb-6"><Database className="h-12 w-12 text-muted-foreground" /></div>
                  <h3 className="text-xl font-bold text-primary">Seçilen kriterlere uygun rapor verisi bulunmuyor.</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">Modüllerde kayıt oluştukça BI merkezi canlı verilerle güncellenecek.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[1250px]">
                    <TableHeader className="enterprise-table-header">
                      <TableRow>{REPORT_COLUMNS.map((column, index) => <TableHead key={column} className={index === 0 ? "pl-6" : ""}>{column}</TableHead>)}</TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableRows.map((row) => (
                        <TableRow key={row.personId} className="hover:bg-slate-50/80">
                          <TableCell className="pl-6"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={row.person?.avatarUrl} /><AvatarFallback className="text-xs font-bold">{getPersonnelName(row.person).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="font-bold text-primary">{getPersonnelName(row.person)}</span></div></TableCell>
                          <TableCell className="font-mono text-xs">{row.person?.registryNo || row.person?.personnelCode || row.personId}</TableCell>
                          <TableCell>{row.branch ? getBranchName(row.branch) : "-"}</TableCell>
                          <TableCell>{row.department ? getDepartmentName(row.department) : "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{row.entry || "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{row.exit || "-"}</TableCell>
                          <TableCell>{Math.round(row.workMinutes / 60 * 10) / 10} sa</TableCell>
                          <TableCell>{row.isLate ? <Badge className="bg-orange-50 text-orange-700">Evet</Badge> : "-"}</TableCell>
                          <TableCell>{row.overtime ? `${Math.round(row.overtime / 60 * 10) / 10} sa` : "-"}</TableCell>
                          <TableCell>{row.exit ? "-" : "Çıkış yok"}</TableCell>
                          <TableCell>{row.leave ? row.leave.status || "İzin" : "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{row.device?.deviceId || "-"}</TableCell>
                          <TableCell>{row.qr ? "Evet" : "-"}</TableCell>
                          <TableCell>{row.gps}</TableCell>
                          <TableCell><RiskBadge risk={row.risk} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <LiveOpsPanel tableRows={tableRows} shifts={filteredShifts} audit={data.audit} qrPoints={data.qrPoints} />
          <AiInsights insights={insights} />
          <AutoReports reports={AUTO_REPORTS} savedReports={settings.savedReports || []} />
        </div>
      </div>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[760px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">Özel Rapor Oluştur</DialogTitle>
            <DialogDescription className="text-white/80">Filtreleri, kolonları ve tarih aralığını kaydederek tekrar kullanılabilir rapor oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Rapor adı" value={reportForm.name} onChange={(value) => setReportForm((prev) => ({ ...prev, name: value }))} />
              <FormInput label="Açıklama" value={reportForm.description} onChange={(value) => setReportForm((prev) => ({ ...prev, description: value }))} />
              <FormInput label="Başlangıç" type="date" value={reportForm.startDate} onChange={(value) => setReportForm((prev) => ({ ...prev, startDate: value }))} />
              <FormInput label="Bitiş" type="date" value={reportForm.endDate} onChange={(value) => setReportForm((prev) => ({ ...prev, endDate: value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Kolon seçimi</Label>
              <div className="grid gap-2 md:grid-cols-3">
                {REPORT_COLUMNS.map((column) => (
                  <label key={column} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-700">
                    <Checkbox
                      checked={reportForm.selectedColumns.includes(column)}
                      onCheckedChange={(checked) => setReportForm((prev) => ({
                        ...prev,
                        selectedColumns: checked ? [...prev.selectedColumns, column] : prev.selectedColumns.filter((item) => item !== column),
                      }))}
                    />
                    {column}
                  </label>
                ))}
              </div>
            </div>
            <Textarea className="min-h-[90px] rounded-2xl border-slate-200" value={JSON.stringify(filters, null, 2)} readOnly />
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsReportOpen(false)}>Vazgeç</Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={saveCustomReport}>Raporu Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReportKpi({ title, value, icon: Icon, gradient }: any) {
  return (
    <Card className="group overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/70 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
      <CardContent className={cn("relative min-h-[138px] p-5 text-white bg-gradient-to-br", gradient)}>
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform group-hover:scale-150" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-4">
          <div className="flex items-center justify-between"><Icon className="h-6 w-6 text-white/85" /><span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold">+ canlı</span></div>
          <div>
            <div className="text-3xl font-extrabold tracking-tight">{value}</div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/75">{title}</p>
            <div className="mt-3 flex h-6 items-end gap-1">{[30, 55, 42, 74, 60, 88].map((height, index) => <span key={index} className="w-full rounded-full bg-white/35" style={{ height: `${height}%` }} />)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReportCenterTab({ value, label, href }: { value: string; label: string; href: string }) {
  return (
    <TabsTrigger value={value} asChild className="rounded-xl px-4 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg">
      <Link href={href}>{label}</Link>
    </TabsTrigger>
  )
}

function FilterInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  const inputProps = type === "date" ? DATE_INPUT_PROPS : { type }
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Input {...inputProps} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border-slate-200 bg-white" /></div>
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>
}

function CategoryCard({ category }: any) {
  const Icon = category.icon
  return (
    <Card className="group overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/5 p-2.5 text-primary group-hover:bg-primary group-hover:text-white transition-colors"><Icon className="h-5 w-5" /></div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-primary text-sm">{category.title}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">{category.description}</p>
            <Button variant="ghost" className="mt-2 h-7 px-0 text-xs font-bold text-accent hover:bg-transparent">Hızlı erişim</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AnalyticsChart({ title, subtitle, icon: Icon, data }: any) {
  const max = Math.max(1, ...data.map((item: any) => item.value))
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Icon className="h-4 w-4 text-accent" />{title}</CardTitle><p className="text-xs font-medium text-slate-500">{subtitle}</p></CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? <p className="py-8 text-center text-xs font-medium text-muted-foreground">Grafik için veri bekleniyor.</p> : data.slice(0, 8).map((item: any) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500"><span className="truncate">{item.label}</span><span>{item.value}</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500 shadow-[0_0_16px_rgba(124,58,237,0.35)]" style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} /></div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DonutChart({ title, data }: { title: string; data: any[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><PieChart className="h-4 w-4 text-accent" />{title}</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(#8b5cf6_0_40%,#38bdf8_40%_70%,#fb7185_70%_100%)] shadow-xl"><div className="grid h-20 w-20 place-items-center rounded-full bg-white text-lg font-extrabold text-primary">{total}</div></div>
        <div className="flex-1 space-y-2">{data.map((item) => <div key={item.label} className="flex justify-between text-xs font-bold text-slate-600"><span>{item.label}</span><span>{item.value}</span></div>)}</div>
      </CardContent>
    </Card>
  )
}

function HeatmapChart({ title, data }: { title: string; data: any[] }) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Database className="h-4 w-4 text-accent" />{title}</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? <p className="py-8 text-center text-xs font-medium text-muted-foreground">Heatmap için geç giriş verisi bekleniyor.</p> : <div className="grid grid-cols-7 gap-2">{data.slice(0, 28).map((item, index) => <div key={`${item.label}-${index}`} title={`${item.label}: ${item.value}`} className={cn("h-10 rounded-xl border border-white/70 shadow-sm", item.value > 3 ? "bg-red-400" : item.value > 1 ? "bg-orange-300" : "bg-sky-100")} />)}</div>}
      </CardContent>
    </Card>
  )
}

function LiveOpsPanel({ tableRows, shifts, audit, qrPoints }: any) {
  const inside = tableRows.filter((row: any) => row.entry && !row.exit).slice(0, 5)
  const late = tableRows.filter((row: any) => row.isLate).slice(0, 5)
  const critical = audit.filter((log: any) => log.risk === "Kritik" || log.riskLevel === "Kritik").slice(0, 5)
  const mismatch = audit.filter((log: any) => /device|cihaz|uyuşmaz/i.test(`${log.type || ""} ${log.detail || log.message || ""}`)).slice(0, 5)
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader className="border-b bg-slate-50/40"><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Activity className="h-4 w-4 text-accent" />Canlı Operasyon Paneli</CardTitle></CardHeader>
      <CardContent className="p-4 space-y-4">
        <MiniList title="Şu an içeride olanlar" items={inside.map((row: any) => ({ label: getPersonnelName(row.person), value: row.entry }))} />
        <MiniList title="Geç kalanlar" items={late.map((row: any) => ({ label: getPersonnelName(row.person), value: row.entry }))} />
        <MiniList title="Aktif vardiyalar" items={shifts.slice(0, 5).map((shift: any) => ({ label: shift.name || shift.id, value: formatDateTR(shift.startDate) }))} />
        <MiniList title="Kritik uyarılar / şüpheli girişler" items={critical.map((log: any) => ({ label: log.type || "Uyarı", value: log.user || log.actor || "-" }))} />
        <MiniList title="QR doğrulama hataları" items={qrPoints.filter((qr: any) => qr.status === "Passive").slice(0, 5).map((qr: any) => ({ label: qr.pointName || qr.qrCode, value: "Pasif" }))} />
        <MiniList title="Cihaz uyuşmazlıkları" items={mismatch.map((log: any) => ({ label: log.deviceId || "Device", value: log.user || log.actor || "-" }))} />
      </CardContent>
    </Card>
  )
}

function AiInsights({ insights }: { insights: string[] }) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-[#100a24] text-white shadow-2xl shadow-violet-950/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(168,85,247,0.3),transparent_18rem)]" />
      <CardHeader className="relative z-10"><CardTitle className="flex items-center gap-2 text-sm font-extrabold"><BrainCircuit className="h-5 w-5 text-fuchsia-300" />AI Analiz Kartları</CardTitle></CardHeader>
      <CardContent className="relative z-10 space-y-3">
        {insights.map((insight) => <div key={insight} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm font-semibold shadow-xl">{insight}</div>)}
      </CardContent>
    </Card>
  )
}

function AutoReports({ reports, savedReports }: any) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><FileSpreadsheet className="h-4 w-4 text-accent" />Otomatik Raporlar</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {reports.map((report: any) => { const Icon = report.icon; return <div key={report.title} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"><Icon className="h-4 w-4 text-primary" /><div><div className="text-xs font-bold text-primary">{report.title}</div><div className="text-[10px] font-medium text-slate-500">{report.description}</div></div></div> })}
        <div className="pt-3 border-t"><div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Kaydedilen raporlar</div>{savedReports.length === 0 ? <p className="text-xs text-muted-foreground">Henüz kayıtlı rapor yok.</p> : savedReports.slice(0, 4).map((report: any) => <div key={report.id} className="text-xs font-bold text-primary py-1">{report.name}</div>)}</div>
      </CardContent>
    </Card>
  )
}

function MiniList({ title, items }: { title: string; items: any[] }) {
  return <div><div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</div>{items.length === 0 ? <p className="text-xs text-muted-foreground">Kayıt yok</p> : <div className="space-y-1.5">{items.map((item, index) => <div key={`${item.label}-${index}`} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"><span className="font-bold text-slate-700">{item.label}</span><span className="text-slate-500">{item.value}</span></div>)}</div>}</div>
}

function FormInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  const inputProps = type === "date" ? DATE_INPUT_PROPS : { type }
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Input {...inputProps} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border-slate-200" /></div>
}

function RiskBadge({ risk }: { risk: string }) {
  const style = risk === "Kritik" ? "bg-red-50 text-accent border-red-100" : risk === "Orta" ? "bg-yellow-50 text-yellow-700 border-yellow-100" : "bg-green-50 text-green-700 border-green-100"
  return <Badge className={cn("font-bold", style)}>{risk}</Badge>
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

function buildDateChart(logs: any[]) {
  const counts = new Map<string, number>()
  logs.forEach((log) => {
    const date = getLogDate(log)
    if (!date) return
    counts.set(date, (counts.get(date) || 0) + 1)
  })
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-8).map(([label, value]) => ({ label: ddmmyyyy(label), value }))
}

function buildBranchChart(logs: any[], personnel: any[], branchById: Map<string, any>) {
  const personBranch = new Map(personnel.map((person) => [getPersonId(person), person.branchId]))
  const counts = new Map<string, number>()
  logs.forEach((log) => {
    const branch = branchById.get(personBranch.get((log?.personnelId || log?.personId || "").toString()) || "")
    const label = branch ? getBranchName(branch) : "Bilinmeyen"
    counts.set(label, (counts.get(label) || 0) + 1)
  })
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))
}

function buildLateHeatmap(rows: any[]) {
  const counts = new Map<string, number>()
  rows.filter((row) => row.isLate).forEach((row) => {
    const label = row.branch ? getBranchName(row.branch) : "Bilinmeyen"
    counts.set(label, (counts.get(label) || 0) + 1)
  })
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }))
}

function buildShiftDensity(shifts: any[]) {
  const counts = new Map<string, number>()
  shifts.forEach((shift) => {
    const label = shift.name || "Vardiya"
    counts.set(label, (counts.get(label) || 0) + 1)
  })
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }))
}

function buildChannelChart(logs: any[]) {
  const counts = new Map<string, number>()
  logs.forEach((log) => {
    const label = (log.verificationMethod || log.channel || "Bilinmeyen").toString()
    counts.set(label, (counts.get(label) || 0) + 1)
  })
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }))
}

function buildOvertimeTrend(rows: any[]) {
  return rows.filter((row) => row.overtime > 0).map((row) => ({ label: getPersonnelName(row.person), value: Math.round(row.overtime / 60 * 10) / 10 }))
}

function buildDepartmentWork(rows: any[]) {
  const totals = new Map<string, { total: number; count: number }>()
  rows.forEach((row) => {
    const label = row.department ? getDepartmentName(row.department) : "Bilinmeyen"
    const current = totals.get(label) || { total: 0, count: 0 }
    totals.set(label, { total: current.total + row.workMinutes, count: current.count + 1 })
  })
  return Array.from(totals.entries()).map(([label, item]) => ({ label, value: Math.round((item.total / Math.max(1, item.count)) / 60 * 10) / 10 }))
}

function buildInsights(stats: any, charts: any, rows: any[]) {
  const insights = []
  if (stats.late > 0) insights.push(`Son filtre aralığında ${stats.late} geç giriş tespit edildi.`)
  if (stats.overtime > 0) insights.push(`Fazla mesai yoğunluğu toplam ${stats.overtime} saat seviyesinde.`)
  if (stats.mobileRate < 20 && stats.totalPersonnel > 0) insights.push("Mobil giriş oranı düşük; saha ekipleri için mobil kullanım teşvik edilebilir.")
  const topBranch = charts.branch[0]
  if (topBranch) insights.push(`${topBranch.label} şubesinde giriş yoğunluğu en yüksek seviyede.`)
  const topDept = charts.deptWork[0]
  if (topDept) insights.push(`${topDept.label} departmanında ortalama çalışma süresi ${topDept.value} saat.`)
  if (insights.length === 0) insights.push("AI analizleri için daha fazla operasyon verisi bekleniyor.")
  return insights.slice(0, 5)
}

