"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Briefcase,
  Building2,
  CalendarClock,
  Clock3,
  Coffee,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  LineChart,
  MonitorSmartphone,
  MoreHorizontal,
  Moon,
  PieChart,
  Printer,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Sun,
  Timer,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  Zap,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { DATE_INPUT_PROPS } from "@/lib/date-time"
import { cn } from "@/lib/utils"

const OVERTIME_KEY = "app_overtime_reports"
const ALL = "__all__"

const STORAGE_KEYS = {
  personnel: "app_personnel",
  branches: "app_branches",
  departments: "app_departments",
  positions: "app_positions",
  shifts: "app_shifts",
  breaks: "app_break_records",
  leaves: "app_leave_requests",
  absence: "app_absence_reports",
  audit: "app_audit_logs",
  attendance: "app_attendance_logs",
  qrPoints: "app_qr_points",
  devices: "app_device_ids",
}

const AUTO_REPORTS = [
  { title: "Günlük mesai özeti", description: "Bugünün çalışma ve fazla mesai görünümü.", icon: Activity },
  { title: "Haftalık çalışma raporu", description: "Haftalık yoğunluk ve denge analizi.", icon: LineChart },
  { title: "Aylık fazla mesai", description: "Aylık toplam mesai ve uyarı kırılımı.", icon: BarChart3 },
  { title: "Kritik yoğunluk raporu", description: "Aşırı mesai ve riskli çalışan listesi.", icon: ShieldAlert },
  { title: "Gece vardiyası raporu", description: "Gece mesaisi dağılımı ve uyarı etkisi.", icon: Moon },
  { title: "Hafta sonu raporu", description: "Hafta sonu çalışma ve uyarı özeti.", icon: Sun },
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

const readState = () => {
  try {
    const raw = localStorage.getItem(OVERTIME_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const writeState = (state: any) => localStorage.setItem(OVERTIME_KEY, JSON.stringify(state))

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
const getDate = (value: any) => {
  if (!value) return ""
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? "" : toDateInput(date)
}
const getLogDate = (log: any) => log?.date?.toString().slice(0, 10) || getDate(log?.entryTime || log?.exitTime || log?.createdAt)
const getTime = (value: any) => {
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
const formatHours = (minutes: number) => `${Math.round((minutes / 60) * 10) / 10} sa`
const isWeekendDate = (dateText: string) => {
  const day = new Date(`${dateText}T12:00:00`).getDay()
  return day === 0 || day === 6
}

export default function OvertimeReportsPage() {
  const { toast } = useToast()
  const [data, setData] = React.useState({
    personnel: [] as any[],
    branches: [] as any[],
    departments: [] as any[],
    positions: [] as any[],
    shifts: [] as any[],
    breaks: [] as any[],
    leaves: [] as any[],
    absence: [] as any[],
    audit: [] as any[],
    attendance: [] as any[],
    qrPoints: [] as any[],
    devices: [] as any[],
  })
  const [state, setState] = React.useState<any>({ savedReports: [], approvals: {} })
  const [selectedRow, setSelectedRow] = React.useState<any | null>(null)
  const [filters, setFilters] = React.useState({
    startDate: addDaysInput(todayInput(), -30),
    endDate: todayInput(),
    branchId: ALL,
    departmentId: ALL,
    positionId: ALL,
    personnelId: ALL,
    shiftType: ALL,
    nightOnly: "all",
    weekendOnly: "all",
    overtimeStatus: ALL,
    missingOnly: "all",
    criticalOnly: "all",
    mobileOnly: "all",
    qrOnly: "all",
  })

  const loadData = React.useCallback(() => {
    setData({
      personnel: readArray(STORAGE_KEYS.personnel).filter((person: any) => !person?.isDeleted),
      branches: readArray(STORAGE_KEYS.branches),
      departments: readArray(STORAGE_KEYS.departments),
      positions: readArray(STORAGE_KEYS.positions),
      shifts: readArray(STORAGE_KEYS.shifts),
      breaks: readArray(STORAGE_KEYS.breaks),
      leaves: readArray(STORAGE_KEYS.leaves),
      absence: readArray(STORAGE_KEYS.absence),
      audit: readArray(STORAGE_KEYS.audit),
      attendance: readArray(STORAGE_KEYS.attendance),
      qrPoints: readArray(STORAGE_KEYS.qrPoints),
      devices: readArray(STORAGE_KEYS.devices),
    })
    setState({ savedReports: [], approvals: {}, ...readState() })
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const branchById = React.useMemo(() => new Map(data.branches.map((branch) => [getBranchId(branch), branch])), [data.branches])
  const deptById = React.useMemo(() => new Map(data.departments.map((department) => [getDepartmentId(department), department])), [data.departments])
  const positionById = React.useMemo(() => new Map(data.positions.map((position) => [getPositionId(position), position])), [data.positions])
  const personById = React.useMemo(() => new Map(data.personnel.map((person) => [getPersonId(person), person])), [data.personnel])
  const deviceByPerson = React.useMemo(() => new Map(data.devices.map((device) => [device.personnelId, device])), [data.devices])

  const rows = React.useMemo(() => {
    const generated: any[] = []
    data.attendance.forEach((log) => {
      const date = getLogDate(log)
      const personnelId = (log?.personnelId || log?.personId || "").toString()
      const person = personById.get(personnelId)
      if (!person || !date || date < filters.startDate || date > filters.endDate) return

      const shift = findShiftForPerson(data.shifts, personnelId, date)
      const branchId = (person?.branchId || shift?.branchId || "").toString()
      const departmentId = (person?.departmentId || "").toString()
      const positionId = (person?.positionId || person?.position || "").toString()
      const entry = getTime(log?.entryTime || log?.checkInTime || log?.inTime)
      const exit = getTime(log?.exitTime || log?.checkOutTime || log?.outTime)
      const entryMinutes = toMinutes(entry)
      const exitMinutes = toMinutes(exit)
      const shiftStart = shift?.startTime || "09:00"
      const shiftEnd = shift?.endTime || "18:00"
      const shiftStartMinutes = toMinutes(shiftStart) ?? 9 * 60
      const shiftEndMinutes = toMinutes(shiftEnd) ?? 18 * 60
      const scheduledMinutes = Math.max(0, shiftEndMinutes - shiftStartMinutes)
      const totalMinutes = entryMinutes !== null && exitMinutes !== null ? Math.max(0, exitMinutes - entryMinutes) : 0
      const breakMinutes = getBreakMinutes(data.breaks, personnelId, date)
      const netMinutes = Math.max(0, totalMinutes - breakMinutes)
      const storedOvertime = Number(log?.overtimeMinutes || 0)
      const overtimeMinutes = storedOvertime > 0 ? storedOvertime : Math.max(0, netMinutes - scheduledMinutes)
      const missingMinutes = Math.max(0, scheduledMinutes - netMinutes)
      const lateExit = exitMinutes !== null && exitMinutes > shiftEndMinutes
      const nightMinutes = calculateNightMinutes(entryMinutes, exitMinutes)
      const weekend = isWeekendDate(date)
      const channel = (log?.verificationMethod || log?.channel || log?.platform || "").toString()
      const mobile = /mobil|mobile/i.test(channel)
      const qr = /qr/i.test(channel)
      const risk = getRisk(overtimeMinutes, netMinutes, lateExit)
      const auditHistory = data.audit.filter((item) => `${item.user || item.actor || ""} ${item.target || ""}`.includes(getPersonnelName(person))).slice(0, 5)
      const leave = data.leaves.find((item) => (item?.personnelId || item?.personId || "").toString() === personnelId && date >= (item?.startDate || "") && date <= (item?.endDate || item?.startDate || ""))

      generated.push({
        id: `${personnelId}-${date}-${log?.id || generated.length}`,
        person,
        personnelId,
        branch: branchById.get(branchId),
        department: deptById.get(departmentId),
        position: positionById.get(positionId),
        shift,
        date,
        entry,
        exit,
        totalMinutes,
        netMinutes,
        overtimeMinutes,
        missingMinutes,
        lateExit,
        nightMinutes,
        weekend,
        breakMinutes,
        risk,
        channel,
        mobile,
        qr,
        log,
        device: deviceByPerson.get(personnelId),
        leave,
        auditHistory,
      })
    })

    return generated.filter((row) => {
      const shiftName = (row.shift?.name || "").toLowerCase()
      return (filters.branchId === ALL || getBranchId(row.branch) === filters.branchId)
        && (filters.departmentId === ALL || getDepartmentId(row.department) === filters.departmentId)
        && (filters.positionId === ALL || getPositionId(row.position) === filters.positionId || row.person?.position === filters.positionId)
        && (filters.personnelId === ALL || row.personnelId === filters.personnelId)
        && (filters.shiftType === ALL || shiftName.includes(filters.shiftType.toLowerCase()))
        && (filters.nightOnly === "all" || row.nightMinutes > 0)
        && (filters.weekendOnly === "all" || row.weekend)
        && (filters.overtimeStatus === ALL || (filters.overtimeStatus === "with" ? row.overtimeMinutes > 0 : row.overtimeMinutes === 0))
        && (filters.missingOnly === "all" || row.missingMinutes > 0)
        && (filters.criticalOnly === "all" || row.risk === "Kritik" || row.risk === "Aşırı Mesai")
        && (filters.mobileOnly === "all" || row.mobile)
        && (filters.qrOnly === "all" || row.qr)
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [branchById, data.audit, data.breaks, data.attendance, data.leaves, data.shifts, deptById, deviceByPerson, filters, personById, positionById])

  const stats = React.useMemo(() => {
    const today = todayInput()
    const month = today.slice(0, 7)
    const totalOvertime = rows.reduce((sum, row) => sum + row.overtimeMinutes, 0)
    const todayOvertime = rows.filter((row) => row.date === today).reduce((sum, row) => sum + row.overtimeMinutes, 0)
    const monthOvertime = rows.filter((row) => row.date.startsWith(month)).reduce((sum, row) => sum + row.overtimeMinutes, 0)
    const byPerson = topBy(rows, (row) => getPersonnelName(row.person), (row) => row.overtimeMinutes)[0]
    const avgDaily = rows.length ? rows.reduce((sum, row) => sum + row.netMinutes, 0) / rows.length : 0
    return {
      totalOvertime,
      todayOvertime,
      monthOvertime,
      topPerson: byPerson?.label || "-",
      avgDaily,
      missing: rows.reduce((sum, row) => sum + row.missingMinutes, 0),
      lateExit: rows.filter((row) => row.lateExit).length,
      critical: rows.filter((row) => row.risk === "Kritik" || row.risk === "Aşırı Mesai").length,
      warningCount: rows.filter((row) => row.overtimeMinutes > 0).length,
      night: rows.reduce((sum, row) => sum + row.nightMinutes, 0),
      weekend: rows.filter((row) => row.weekend).reduce((sum, row) => sum + row.overtimeMinutes, 0),
      active: rows.filter((row) => row.entry && !row.exit).length,
    }
  }, [rows])

  const charts = React.useMemo(() => ({
    daily: topByDate(rows, "overtimeMinutes"),
    department: topBy(rows, (row) => row.department ? getDepartmentName(row.department) : "Bilinmeyen", (row) => row.overtimeMinutes),
    branch: topBy(rows, (row) => row.branch ? getBranchName(row.branch) : "Bilinmeyen", (row) => row.netMinutes),
    weekly: topByWeek(rows),
    night: [{ label: "Gece", value: Math.round(stats.night / 60) }, { label: "Gündüz", value: Math.max(0, Math.round((rows.reduce((sum, row) => sum + row.netMinutes, 0) - stats.night) / 60)) }],
    person: topBy(rows, (row) => getPersonnelName(row.person), (row) => row.netMinutes),
    shift: topBy(rows, (row) => row.shift?.name || "Vardiya yok", (row) => row.netMinutes),
  }), [rows, stats.night])

  const insights = React.useMemo(() => buildInsights(rows, charts, stats), [charts, rows, stats])

  const approveOvertime = (row: any) => {
    const next = {
      ...state,
      approvals: {
        ...(state.approvals || {}),
        [row.id]: { approved: true, approvedAt: Date.now(), reason: "Yönetici onayı beklenmeden raporda işaretlendi." },
      },
    }
    writeState(next)
    setState(next)
    toast({ title: "Başarılı", description: "Mesai onayı rapora işlendi." })
  }

  const exportCsv = () => {
    const header = ["Personel", "Sicil No", "Şube", "Departman", "Vardiya", "Giriş", "Çıkış", "Toplam Çalışma", "Fazla Mesai", "Eksik Mesai", "Geç Çıkış", "Gece Mesaisi", "Hafta Sonu", "Mola Süresi", "Fazla Mesai Uyarısı", "Risk Durumu"]
    const lines = rows.map((row) => [
      getPersonnelName(row.person),
      row.person?.registryNo || row.person?.personnelCode || row.personnelId,
      row.branch ? getBranchName(row.branch) : "-",
      row.department ? getDepartmentName(row.department) : "-",
      row.shift?.name || "-",
      row.entry || "-",
      row.exit || "-",
      formatHours(row.netMinutes),
      formatHours(row.overtimeMinutes),
      formatHours(row.missingMinutes),
      row.lateExit ? "Evet" : "Hayır",
      formatHours(row.nightMinutes),
      row.weekend ? "Evet" : "Hayır",
      formatHours(row.breakMinutes),
      row.overtimeMinutes > 0 ? "uyarı" : "-",
      row.risk,
    ])
    const csv = [header, ...lines].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n")
    downloadBlob(`\uFEFF${csv}`, "mesai-raporu.csv", "text/csv;charset=utf-8")
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_12%_20%,rgba(59,130,246,0.22),transparent_28rem),radial-gradient(circle_at_82%_10%,rgba(124,58,237,0.2),transparent_26rem),linear-gradient(135deg,rgba(5,8,22,0.98),rgba(8,25,49,0.96)_56%,rgba(44,24,85,0.92))] p-8 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-100">
              <Timer className="h-3.5 w-3.5" />
              Workforce Overtime Analytics
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Clock3 className="h-8 w-8 text-sky-300" />
              Mesai Raporu
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              Fazla mesai, eksik mesai, gece çalışması ve uyarı analizlerini kurumsal workforce analytics seviyesinde izleyin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Yazdır</Button>
            <Button className="h-11 rounded-2xl bg-white text-primary hover:bg-slate-100 shadow-xl" onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" />Yenile</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        <OvertimeKpi title="Toplam Fazla Mesai" value={formatHours(stats.totalOvertime)} icon={Timer} gradient="from-slate-900 to-blue-900" />
        <OvertimeKpi title="Bugünkü Fazla Mesai" value={formatHours(stats.todayOvertime)} icon={Clock3} gradient="from-sky-500 to-blue-950" />
        <OvertimeKpi title="Bu Ayki Mesai Saati" value={formatHours(stats.monthOvertime)} icon={CalendarClock} gradient="from-indigo-500 to-slate-950" />
        <OvertimeKpi title="En Fazla Mesai Yapan Personel" value={stats.topPerson} icon={UserCheck} gradient="from-purple-500 to-fuchsia-950" />
        <OvertimeKpi title="Ortalama Günlük Çalışma" value={formatHours(stats.avgDaily)} icon={Activity} gradient="from-cyan-500 to-slate-950" />
        <OvertimeKpi title="Eksik Mesai" value={formatHours(stats.missing)} icon={AlertTriangle} gradient="from-amber-500 to-orange-950" />
        <OvertimeKpi title="Geç Çıkış Sayısı" value={stats.lateExit} icon={Zap} gradient="from-orange-500 to-slate-950" />
        <OvertimeKpi title="Kritik Mesai Yoğunluğu" value={stats.critical} icon={ShieldAlert} gradient="from-rose-500 to-slate-950" />
        <OvertimeKpi title="Fazla Mesai Uyarısı" value={stats.warningCount} icon={ShieldAlert} gradient="from-emerald-500 to-teal-950" />
        <OvertimeKpi title="Gece Mesaisi" value={formatHours(stats.night)} icon={Moon} gradient="from-violet-500 to-slate-950" />
        <OvertimeKpi title="Hafta Sonu Mesaisi" value={formatHours(stats.weekend)} icon={Sun} gradient="from-yellow-500 to-slate-950" />
        <OvertimeKpi title="Aktif Mesai Durumu" value={stats.active} icon={Users} gradient="from-blue-500 to-violet-950" />
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="border-b bg-slate-50/40"><CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest"><Filter className="h-4 w-4" />Filtre Paneli</CardTitle></CardHeader>
        <CardContent className="p-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <FilterInput label="Başlangıç" type="date" value={filters.startDate} onChange={(value) => setFilters((prev) => ({ ...prev, startDate: value }))} />
          <FilterInput label="Bitiş" type="date" value={filters.endDate} onChange={(value) => setFilters((prev) => ({ ...prev, endDate: value }))} />
          <FilterSelect label="Şube" value={filters.branchId} onChange={(value) => setFilters((prev) => ({ ...prev, branchId: value }))}><SelectItem value={ALL}>Tüm Şubeler</SelectItem>{data.branches.map((branch) => <SelectItem key={getBranchId(branch)} value={getBranchId(branch)}>{getBranchName(branch)}</SelectItem>)}</FilterSelect>
          <FilterSelect label="Departman" value={filters.departmentId} onChange={(value) => setFilters((prev) => ({ ...prev, departmentId: value }))}><SelectItem value={ALL}>Tüm Departmanlar</SelectItem>{data.departments.map((department) => <SelectItem key={getDepartmentId(department)} value={getDepartmentId(department)}>{getDepartmentName(department)}</SelectItem>)}</FilterSelect>
          <FilterSelect label="Pozisyon" value={filters.positionId} onChange={(value) => setFilters((prev) => ({ ...prev, positionId: value }))}><SelectItem value={ALL}>Tüm Pozisyonlar</SelectItem>{data.positions.map((position) => <SelectItem key={getPositionId(position)} value={getPositionId(position)}>{getPositionName(position)}</SelectItem>)}</FilterSelect>
          <FilterSelect label="Personel" value={filters.personnelId} onChange={(value) => setFilters((prev) => ({ ...prev, personnelId: value }))}><SelectItem value={ALL}>Tüm Personeller</SelectItem>{data.personnel.map((person) => <SelectItem key={getPersonId(person)} value={getPersonId(person)}>{getPersonnelName(person)}</SelectItem>)}</FilterSelect>
          <FilterSelect label="Vardiya tipi" value={filters.shiftType} onChange={(value) => setFilters((prev) => ({ ...prev, shiftType: value }))}><SelectItem value={ALL}>Tümü</SelectItem><SelectItem value="gündüz">Gündüz</SelectItem><SelectItem value="akşam">Akşam</SelectItem><SelectItem value="gece">Gece</SelectItem></FilterSelect>
          <ToggleFilter label="Gece vardiyası" value={filters.nightOnly} onChange={(value) => setFilters((prev) => ({ ...prev, nightOnly: value }))} />
          <ToggleFilter label="Hafta sonu" value={filters.weekendOnly} onChange={(value) => setFilters((prev) => ({ ...prev, weekendOnly: value }))} />
          <FilterSelect label="Fazla mesai durumu" value={filters.overtimeStatus} onChange={(value) => setFilters((prev) => ({ ...prev, overtimeStatus: value }))}><SelectItem value={ALL}>Tümü</SelectItem><SelectItem value="with">Fazla Mesai Var</SelectItem><SelectItem value="without">Fazla Mesai Yok</SelectItem></FilterSelect>
          <ToggleFilter label="Eksik mesai" value={filters.missingOnly} onChange={(value) => setFilters((prev) => ({ ...prev, missingOnly: value }))} />
          <ToggleFilter label="Kritik yoğunluk" value={filters.criticalOnly} onChange={(value) => setFilters((prev) => ({ ...prev, criticalOnly: value }))} />
          <ToggleFilter label="Mobil giriş" value={filters.mobileOnly} onChange={(value) => setFilters((prev) => ({ ...prev, mobileOnly: value }))} />
          <ToggleFilter label="QR giriş" value={filters.qrOnly} onChange={(value) => setFilters((prev) => ({ ...prev, qrOnly: value }))} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <AnalyticsChart title="Günlük Fazla Mesai Trend Grafiği" subtitle="Günlük yoğunluk" icon={LineChart} data={charts.daily} unit="sa" />
            <AnalyticsChart title="Departman Bazlı Fazla Mesai" subtitle="Departman kırılımı" icon={Briefcase} data={charts.department} unit="sa" />
            <HeatmapChart title="Şube Bazlı Çalışma Yoğunluğu" data={charts.branch} />
            <AnalyticsChart title="Haftalık Çalışma Süreleri" subtitle="Stacked görünüm" icon={BarChart3} data={charts.weekly} unit="sa" />
            <DonutChart title="Gece Mesaisi Analizi" data={charts.night} />
            <AnalyticsChart title="Fazla Mesai Uyarısı" subtitle="Uyarı trendi" icon={ShieldAlert} data={charts.daily} unit="sa" />
            <AnalyticsChart title="Personel Bazlı Çalışma Süresi" subtitle="Çalışma süresi liderleri" icon={UserRound} data={charts.person} unit="sa" />
            <AnalyticsChart title="Vardiya Yoğunluğu" subtitle="Vardiya karşılaştırması" icon={CalendarClock} data={charts.shift} unit="sa" />
          </div>

          <WarningCards rows={rows} />

          <Card className="premium-card overflow-hidden">
            <CardHeader className="border-b bg-slate-50/40">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Mesai Analiz Tablosu</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => window.print()}><FileText className="mr-2 h-4 w-4" />PDF export</Button>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={exportCsv}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel export</Button>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV export</Button>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Mesai özeti indir</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {rows.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center p-16 text-center">
                  <div className="rounded-full bg-secondary/50 p-6 mb-6"><Timer className="h-12 w-12 text-muted-foreground" /></div>
                  <h3 className="text-xl font-bold text-primary">Seçilen kriterlere uygun mesai kaydı bulunmuyor.</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">Giriş/çıkış ve vardiya kayıtları oluştuğunda fazla mesai analizi otomatik hesaplanır.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[1500px]">
                    <TableHeader className="enterprise-table-header">
                      <TableRow>
                        {["Personel", "Sicil No", "Şube", "Departman", "Vardiya", "Giriş", "Çıkış", "Toplam Çalışma", "Fazla Mesai", "Eksik Mesai", "Geç Çıkış", "Gece Mesaisi", "Hafta Sonu", "Mola Süresi", "Fazla Mesai Uyarısı", "Risk Durumu", "İşlemler"].map((column, index) => <TableHead key={column} className={index === 0 ? "pl-6" : index === 16 ? "text-right pr-6" : ""}>{column}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/80">
                          <TableCell className="pl-6"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={row.person?.avatarUrl} /><AvatarFallback className="text-xs font-bold">{getPersonnelName(row.person).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="font-bold text-primary">{getPersonnelName(row.person)}</span></div></TableCell>
                          <TableCell className="font-mono text-xs">{row.person?.registryNo || row.person?.personnelCode || row.personnelId}</TableCell>
                          <TableCell>{row.branch ? getBranchName(row.branch) : "-"}</TableCell>
                          <TableCell>{row.department ? getDepartmentName(row.department) : "-"}</TableCell>
                          <TableCell>{row.shift?.name || "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{row.entry || "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{row.exit || "-"}</TableCell>
                          <TableCell>{formatHours(row.netMinutes)}</TableCell>
                          <TableCell className="font-bold text-primary">{formatHours(row.overtimeMinutes)}</TableCell>
                          <TableCell>{formatHours(row.missingMinutes)}</TableCell>
                          <TableCell>{row.lateExit ? <Badge className="bg-orange-50 text-orange-700">Evet</Badge> : "-"}</TableCell>
                          <TableCell>{formatHours(row.nightMinutes)}</TableCell>
                          <TableCell>{row.weekend ? "Evet" : "-"}</TableCell>
                          <TableCell>{formatHours(row.breakMinutes)}</TableCell>
                          <TableCell>{row.overtimeMinutes > 0 ? <Badge className="bg-amber-50 text-amber-700">uyarı</Badge> : "-"}</TableCell>
                          <TableCell><RiskBadge risk={row.risk} /></TableCell>
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><MoreHorizontal className="h-5 w-5 text-slate-500" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSelectedRow(row)}><Eye className="mr-3 h-4 w-4 text-slate-400" />Detay Görüntüle</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => approveOvertime(row)}><CheckIcon />Yönetici onayı işle</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
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
          <LiveOpsPanel rows={rows} />
          <AiInsights insights={insights} />
          <AutoReports reports={AUTO_REPORTS} savedReports={state.savedReports || []} />
        </div>
      </div>

      <Dialog open={Boolean(selectedRow)} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="sm:max-w-[760px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">Mesai Detayı</DialogTitle>
            <DialogDescription className="text-white/80">Çalışma geçmişi, doğrulama, mola, onay ve audit detayları.</DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Personel" value={getPersonnelName(selectedRow.person)} />
              <InfoRow label="Vardiya bilgisi" value={`${selectedRow.shift?.name || "-"} · ${selectedRow.shift?.startTime || "-"} / ${selectedRow.shift?.endTime || "-"}`} />
              <InfoRow label="Giriş/Çıkış kayıtları" value={`${selectedRow.entry || "-"} / ${selectedRow.exit || "-"}`} />
              <InfoRow label="QR doğrulama geçmişi" value={selectedRow.qr ? "QR kanalı kullanıldı" : "QR kaydı yok"} />
              <InfoRow label="Device ID bilgisi" value={selectedRow.device?.deviceId || "-"} />
              <InfoRow label="GPS doğrulama" value={selectedRow.log?.location || "-"} />
              <InfoRow label="Mola geçmişi" value={formatHours(selectedRow.breakMinutes)} />
              <InfoRow label="Fazla mesai nedeni" value={selectedRow.lateExit ? "Vardiya bitişinden sonra çıkış" : selectedRow.overtimeMinutes > 0 ? "Planlanan sürenin üzerinde çalışma" : "-"} />
              <InfoRow label="Yönetici onayı" value={state.approvals?.[selectedRow.id]?.approved ? "Onaylandı" : "Bekliyor"} />
              <InfoRow label="Audit geçmişi" value={selectedRow.auditHistory?.length ? `${selectedRow.auditHistory.length} kayıt` : "-"} />
              <div className="md:col-span-2"><InfoRow label="Tam çalışma geçmişi" value={`${selectedRow.date} tarihinde net ${formatHours(selectedRow.netMinutes)}, fazla mesai ${formatHours(selectedRow.overtimeMinutes)}, eksik mesai ${formatHours(selectedRow.missingMinutes)}.`} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OvertimeKpi({ title, value, icon: Icon, gradient }: any) {
  return (
    <Card className="group overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/70 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
      <CardContent className={cn("relative min-h-[138px] p-5 text-white bg-gradient-to-br", gradient)}>
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform group-hover:scale-150" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-4">
          <div className="flex items-center justify-between"><Icon className="h-6 w-6 text-white/85" /><span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold">live</span></div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight leading-tight">{value}</div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/75">{title}</p>
            <div className="mt-3 flex h-6 items-end gap-1">{[42, 66, 50, 78, 58, 92].map((height, index) => <span key={index} className="w-full rounded-full bg-white/35" style={{ height: `${height}%` }} />)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  const inputProps = type === "date" ? DATE_INPUT_PROPS : { type }
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Input {...inputProps} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border-slate-200 bg-white" /></div>
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>
}

function ToggleFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <FilterSelect label={label} value={value} onChange={onChange}><SelectItem value="all">Tümü</SelectItem><SelectItem value="only">Sadece</SelectItem></FilterSelect>
}

function AnalyticsChart({ title, subtitle, icon: Icon, data, unit = "" }: any) {
  const max = Math.max(1, ...data.map((item: any) => item.value))
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Icon className="h-4 w-4 text-accent" />{title}</CardTitle><p className="text-xs font-medium text-slate-500">{subtitle}</p></CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? <p className="py-8 text-center text-xs font-medium text-muted-foreground">Grafik için veri bekleniyor.</p> : data.slice(0, 8).map((item: any) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500"><span className="truncate">{item.label}</span><span>{item.value} {unit}</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500 shadow-[0_0_16px_rgba(124,58,237,0.35)]" style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} /></div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function HeatmapChart({ title, data }: { title: string; data: any[] }) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Building2 className="h-4 w-4 text-accent" />{title}</CardTitle></CardHeader>
      <CardContent>{data.length === 0 ? <p className="py-8 text-center text-xs font-medium text-muted-foreground">Heatmap için veri bekleniyor.</p> : <div className="grid grid-cols-6 gap-2">{data.slice(0, 24).map((item, index) => <div key={`${item.label}-${index}`} title={`${item.label}: ${item.value}`} className={cn("h-12 rounded-xl border border-white/70 shadow-sm", item.value > 600 ? "bg-red-400" : item.value > 300 ? "bg-orange-300" : "bg-sky-100")} />)}</div>}</CardContent>
    </Card>
  )
}

function DonutChart({ title, data }: { title: string; data: any[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><PieChart className="h-4 w-4 text-accent" />{title}</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(#8b5cf6_0_45%,#38bdf8_45%_76%,#fb7185_76%_100%)] shadow-xl"><div className="grid h-20 w-20 place-items-center rounded-full bg-white text-lg font-extrabold text-primary">{total}</div></div>
        <div className="flex-1 space-y-2">{data.map((item) => <div key={item.label} className="flex justify-between text-xs font-bold text-slate-600"><span>{item.label}</span><span>{item.value}</span></div>)}</div>
      </CardContent>
    </Card>
  )
}

function WarningCards({ rows }: { rows: any[] }) {
  const total = rows.filter((row) => row.overtimeMinutes > 0).length
  const lateExit = rows.filter((row) => row.lateExit).length
  const weekend = rows.filter((row) => row.weekend).reduce((sum, row) => sum + row.overtimeMinutes, 0)
  const dept = topBy(rows, (row) => row.department ? getDepartmentName(row.department) : "Bilinmeyen", (row) => row.overtimeMinutes)[0]
  const branch = topBy(rows, (row) => row.branch ? getBranchName(row.branch) : "Bilinmeyen", (row) => row.overtimeMinutes)[0]
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <WarningCard title="Toplam uyarı" value={String(total)} />
      <WarningCard title="Departman bazlı uyarı" value={dept ? `${dept.label}: ${dept.value} sa` : "-"} />
      <WarningCard title="Şube bazlı uyarı" value={branch ? `${branch.label}: ${branch.value} sa` : "-"} />
      <WarningCard title="Geç çıkış uyarısı" value={String(lateExit)} />
      <WarningCard title="Hafta sonu mesaisi" value={formatHours(weekend)} />
    </div>
  )
}

function WarningCard({ title, value }: { title: string; value: string }) {
  return <Card className="rounded-2xl border border-emerald-100 bg-white/80 shadow-xl"><CardContent className="p-5"><ShieldAlert className="h-5 w-5 text-emerald-600" /><div className="mt-4 text-lg font-extrabold text-primary">{value}</div><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p></CardContent></Card>
}

function LiveOpsPanel({ rows }: { rows: any[] }) {
  const active = rows.filter((row) => row.entry && !row.exit).slice(0, 5)
  const lateExit = rows.filter((row) => row.lateExit).slice(0, 5)
  const night = rows.filter((row) => row.nightMinutes > 0).slice(0, 5)
  const critical = rows.filter((row) => row.risk === "Kritik" || row.risk === "Aşırı Mesai").slice(0, 5)
  const dept = topBy(rows, (row) => row.department ? getDepartmentName(row.department) : "Bilinmeyen", (row) => row.overtimeMinutes).slice(0, 5)
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader className="border-b bg-slate-50/40"><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Activity className="h-4 w-4 text-accent" />Canlı Operasyon Paneli</CardTitle></CardHeader>
      <CardContent className="p-4 space-y-4">
        <MiniList title="Şu an fazla mesai yapanlar" items={active.map((row) => ({ label: getPersonnelName(row.person), value: row.entry }))} />
        <MiniList title="Aktif vardiyalar" items={rows.filter((row) => row.shift).slice(0, 5).map((row) => ({ label: row.shift.name || "Vardiya", value: row.date }))} />
        <MiniList title="Geç çıkış yapanlar" items={lateExit.map((row) => ({ label: getPersonnelName(row.person), value: row.exit }))} />
        <MiniList title="Gece vardiyaları" items={night.map((row) => ({ label: getPersonnelName(row.person), value: formatHours(row.nightMinutes) }))} />
        <MiniList title="Yoğun departmanlar" items={dept.map((item) => ({ label: item.label, value: formatHours(item.value) }))} />
        <MiniList title="Kritik çalışma süreleri" items={critical.map((row) => ({ label: getPersonnelName(row.person), value: row.risk }))} />
      </CardContent>
    </Card>
  )
}

function AiInsights({ insights }: { insights: string[] }) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-[#100a24] text-white shadow-2xl shadow-violet-950/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(168,85,247,0.3),transparent_18rem)]" />
      <CardHeader className="relative z-10"><CardTitle className="flex items-center gap-2 text-sm font-extrabold"><BrainCircuit className="h-5 w-5 text-fuchsia-300" />AI Analiz Kartları</CardTitle></CardHeader>
      <CardContent className="relative z-10 space-y-3">{insights.map((insight) => <div key={insight} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm font-semibold shadow-xl">{insight}</div>)}</CardContent>
    </Card>
  )
}

function AutoReports({ reports, savedReports }: any) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><FileSpreadsheet className="h-4 w-4 text-accent" />Otomatik Raporlar</CardTitle></CardHeader>
      <CardContent className="space-y-2">{reports.map((report: any) => { const Icon = report.icon; return <div key={report.title} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"><Icon className="h-4 w-4 text-primary" /><div><div className="text-xs font-bold text-primary">{report.title}</div><div className="text-[10px] font-medium text-slate-500">{report.description}</div></div></div> })}<div className="pt-3 border-t"><div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Kaydedilen raporlar</div>{savedReports.length === 0 ? <p className="text-xs text-muted-foreground">Henüz kayıtlı rapor yok.</p> : savedReports.slice(0, 4).map((report: any) => <div key={report.id} className="text-xs font-bold text-primary py-1">{report.name}</div>)}</div></CardContent>
    </Card>
  )
}

function MiniList({ title, items }: { title: string; items: any[] }) {
  return <div><div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</div>{items.length === 0 ? <p className="text-xs text-muted-foreground">Kayıt yok</p> : <div className="space-y-1.5">{items.map((item, index) => <div key={`${item.label}-${index}`} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"><span className="font-bold text-slate-700">{item.label}</span><span className="text-slate-500">{item.value}</span></div>)}</div>}</div>
}

function RiskBadge({ risk }: { risk: string }) {
  const style = risk === "Aşırı Mesai" ? "bg-red-50 text-accent border-red-100 animate-pulse shadow-[0_0_18px_rgba(239,68,68,0.35)]" : risk === "Kritik" ? "bg-red-50 text-accent border-red-100 shadow-[0_0_18px_rgba(239,68,68,0.25)]" : risk === "Yoğun" ? "bg-yellow-50 text-yellow-700 border-yellow-100" : "bg-green-50 text-green-700 border-green-100"
  return <Badge className={cn("font-bold px-3 py-1 rounded-lg", style)}>{risk}</Badge>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border border-slate-100 bg-white rounded-xl px-4 py-3"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span><span className="text-sm font-semibold text-slate-700 text-right break-all">{value}</span></div>
}

function CheckIcon() {
  return <UserCheck className="mr-3 h-4 w-4 text-green-600" />
}

function findShiftForPerson(shifts: any[], personnelId: string, date: string) {
  return shifts.find((shift) => {
    const shiftDate = (shift?.startDate || shift?.date || "").toString().slice(0, 10)
    const personnelIds = Array.isArray(shift?.personnelIds) ? shift.personnelIds : []
    return shiftDate === date && personnelIds.includes(personnelId)
  })
}

function getBreakMinutes(breaks: any[], personnelId: string, date: string) {
  return breaks.filter((item) => (item?.personnelId || item?.personId || "").toString() === personnelId && getLogDate(item) === date).reduce((sum, item) => {
    const start = toMinutes(getTime(item.startTime || item.breakStart || item.entryTime))
    const end = toMinutes(getTime(item.endTime || item.breakEnd || item.exitTime))
    const duration = Number(item.durationMinutes || item.duration || 0)
    return sum + (start !== null && end !== null ? Math.max(0, end - start) : duration)
  }, 0)
}

function calculateNightMinutes(entry: number | null, exit: number | null) {
  if (entry === null || exit === null) return 0
  const nightStart = 22 * 60
  const nightEnd = 6 * 60
  let total = 0
  for (let minute = entry; minute < exit; minute += 1) {
    const normalized = minute % (24 * 60)
    if (normalized >= nightStart || normalized < nightEnd) total += 1
  }
  return total
}

function getRisk(overtimeMinutes: number, netMinutes: number, lateExit: boolean) {
  if (netMinutes >= 13 * 60 || overtimeMinutes >= 5 * 60) return "Aşırı Mesai"
  if (netMinutes >= 11 * 60 || overtimeMinutes >= 3 * 60) return "Kritik"
  if (lateExit || overtimeMinutes >= 60) return "Yoğun"
  return "Normal"
}

function topBy(rows: any[], labeler: (row: any) => string, valuer: (row: any) => number) {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const label = labeler(row)
    map.set(label, (map.get(label) || 0) + valuer(row))
  })
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value: Math.round((value / 60) * 10) / 10 }))
}

function topByDate(rows: any[], key: string) {
  const map = new Map<string, number>()
  rows.forEach((row) => map.set(row.date, (map.get(row.date) || 0) + row[key]))
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-8).map(([label, value]) => ({ label, value: Math.round((value / 60) * 10) / 10 }))
}

function topByWeek(rows: any[]) {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const date = new Date(`${row.date}T12:00:00`)
    const week = `Hafta ${Math.ceil(date.getDate() / 7)}`
    map.set(week, (map.get(week) || 0) + row.netMinutes)
  })
  return Array.from(map.entries()).map(([label, value]) => ({ label, value: Math.round((value / 60) * 10) / 10 }))
}

function buildInsights(rows: any[], charts: any, stats: any) {
  const insights = []
  const topDept = charts.department[0]
  const topPerson = charts.person[0]
  if (topDept) insights.push(`${topDept.label} departmanında fazla mesai artıyor.`)
  if (topPerson && topPerson.value >= 10) insights.push(`${topPerson.label} personelinde aşırı çalışma tespit edildi.`)
  if (stats.weekend > 0) insights.push("Hafta sonu mesaileri yükseldi.")
  if (stats.night > 0) insights.push("Gece vardiyalarında yoğunluk mevcut.")
  const branch = charts.branch[0]
  if (branch) insights.push(`${branch.label} şubesinde iş yükü dengesizliği algılandı.`)
  if (insights.length === 0) insights.push("AI analizleri için daha fazla mesai verisi bekleniyor.")
  return insights.slice(0, 5)
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
