"use client"

import * as React from "react"
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  TimerOff,
  UserCheck,
  UserX,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { DATE_INPUT_PROPS, formatDateTimeTR, formatDateTR, formatTimeTR, formatTimeValueTR } from "@/lib/date-time"
import { cn } from "@/lib/utils"

const PERSONNEL_KEY = "app_personnel"
const BRANCHES_KEY = "app_branches"
const DEPARTMENTS_KEY = "app_departments"
const ATTENDANCE_KEY = "app_attendance_logs"
const LEAVES_KEY = "app_leave_requests"
const SHIFTS_KEY = "app_shifts"
const ANNOTATIONS_KEY = "app_absence_report_annotations"

const ALL = "__all__"

const STATUSES = [
  { value: "Absent", label: "Devamsız" },
  { value: "Late", label: "Geç Geldi" },
  { value: "EarlyExit", label: "Erken Çıktı" },
  { value: "Incomplete", label: "Eksik Mesai" },
  { value: "Leave", label: "İzinli" },
  { value: "Normal", label: "Normal" },
  { value: "Excused", label: "Mazeretli" },
]

const readLocalArray = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readLocalRecord = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const getPersonId = (person: any) => (person?.id || person?.personnelId || person?.personnelCode || "").toString()

const getPersonnelName = (person: any) => {
  return (
    person?.fullName ||
    [person?.name, person?.surname].filter(Boolean).join(" ") ||
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
    person?.personnelCode ||
    "Personel"
  ).toString()
}

const getBranchId = (branch: any) => (branch?.id || branch?.branchCode || branch?.code || "").toString()
const getBranchName = (branch: any) => (branch?.branchName || branch?.name || branch?.branchCode || "Şube").toString()
const getDepartmentId = (department: any) => (department?.id || department?.departmentCode || department?.code || "").toString()
const getDepartmentName = (department: any) => (department?.departmentName || department?.name || department?.departmentCode || "Departman").toString()

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

const dateRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate || endDate < startDate) return []
  const days: string[] = []
  let cursor = startDate
  while (cursor <= endDate) {
    days.push(cursor)
    cursor = addDaysInput(cursor, 1)
  }
  return days
}

const toMinutes = (value?: string) => {
  if (!value) return null
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

const getTimeFromValue = (value: any) => {
  if (!value) return ""
  if (typeof value === "string") {
    const timeOnly = value.match(/^(\d{1,2}):(\d{2})/)
    if (timeOnly) return `${timeOnly[1].padStart(2, "0")}:${timeOnly[2]}`
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        hourCycle: "h23",
        timeZone: "Europe/Istanbul",
      }).format(date)
    }
  }
  if (typeof value?.toDate === "function") return formatTimeTR(value.toDate())
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : formatTimeTR(date)
}

const getDateFromLog = (log: any) => {
  if (log?.date) return log.date.toString().slice(0, 10)
  const value = log?.entryTime || log?.exitTime || log?.createdAt
  if (!value) return ""
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? "" : toDateInput(date)
}

const getLogPersonId = (log: any) => (log?.personnelId || log?.personId || log?.employeeId || log?.userId || "").toString()

const normalizeLeaveStatus = (status: string) => {
  const lower = (status || "").toLowerCase()
  if (lower === "approved" || lower === "active" || lower === "onaylandı" || lower === "onaylandi") return "Approved"
  return status || "Pending"
}

const getLeavePersonId = (leave: any) => (leave?.personnelId || leave?.personId || leave?.employeeId || "").toString()

const isDateInLeave = (date: string, leave: any) => {
  if (normalizeLeaveStatus(leave?.status) !== "Approved") return false
  const start = (leave?.startDate || leave?.date || "").toString().slice(0, 10)
  const end = (leave?.endDate || leave?.startDate || leave?.date || "").toString().slice(0, 10)
  return Boolean(start && end && date >= start && date <= end)
}

const getStatusLabel = (status: string) => STATUSES.find((item) => item.value === status)?.label || status || "-"

const makeRowKey = (personnelId: string, date: string, shiftId: string) => `${personnelId}__${date}__${shiftId}`

export default function AbsenceReportPage() {
  const { toast } = useToast()
  const [personnel, setPersonnel] = React.useState<any[]>([])
  const [branches, setBranches] = React.useState<any[]>([])
  const [departments, setDepartments] = React.useState<any[]>([])
  const [attendanceLogs, setAttendanceLogs] = React.useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = React.useState<any[]>([])
  const [shifts, setShifts] = React.useState<any[]>([])
  const [annotations, setAnnotations] = React.useState<Record<string, any>>({})
  const [selectedRow, setSelectedRow] = React.useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isNoteOpen, setIsNoteOpen] = React.useState(false)
  const [noteText, setNoteText] = React.useState("")
  const [filters, setFilters] = React.useState({
    startDate: addDaysInput(todayInput(), -30),
    endDate: todayInput(),
    personnelId: ALL,
    branchId: ALL,
    departmentId: ALL,
    status: ALL,
  })

  const loadData = React.useCallback(() => {
    setPersonnel(readLocalArray(PERSONNEL_KEY).filter((person: any) => !person?.isDeleted))
    setBranches(readLocalArray(BRANCHES_KEY))
    setDepartments(readLocalArray(DEPARTMENTS_KEY))
    setAttendanceLogs(readLocalArray(ATTENDANCE_KEY))
    setLeaveRequests(readLocalArray(LEAVES_KEY))
    setShifts(readLocalArray(SHIFTS_KEY))
    setAnnotations(readLocalRecord(ANNOTATIONS_KEY))
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const persistAnnotations = React.useCallback((next: Record<string, any>) => {
    localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(next))
    setAnnotations(next)
  }, [])

  const personById = React.useMemo(() => new Map(personnel.map((person) => [getPersonId(person), person])), [personnel])
  const branchById = React.useMemo(() => new Map(branches.map((branch) => [getBranchId(branch), branch])), [branches])
  const departmentById = React.useMemo(() => new Map(departments.map((department) => [getDepartmentId(department), department])), [departments])

  const attendanceByPersonDate = React.useMemo(() => {
    const map = new Map<string, any[]>()
    attendanceLogs.forEach((log) => {
      const personnelId = getLogPersonId(log)
      const date = getDateFromLog(log)
      if (!personnelId || !date) return
      const key = `${personnelId}__${date}`
      map.set(key, [...(map.get(key) || []), log])
    })
    return map
  }, [attendanceLogs])

  const reportRows = React.useMemo(() => {
    const days = dateRange(filters.startDate, filters.endDate)
    const rows: any[] = []

    shifts.forEach((shift) => {
      const shiftDate = (shift?.startDate || shift?.date || "").toString().slice(0, 10)
      const shiftDays = shiftDate ? [shiftDate] : days
      const assignedIds = Array.isArray(shift?.personnelIds) ? shift.personnelIds : []

      shiftDays.forEach((date) => {
        if (!date || date < filters.startDate || date > filters.endDate) return

        assignedIds.forEach((personnelId: string) => {
          const person = personById.get(personnelId)
          if (!person || person?.status === "Inactive") return

          const branchId = (person?.branchId || shift?.branchId || "").toString()
          const departmentId = (person?.departmentId || "").toString()
          const rowKey = makeRowKey(personnelId, date, shift?.id || shift?.name || "shift")
          const annotation = annotations[rowKey] || {}
          const personLogs = attendanceByPersonDate.get(`${personnelId}__${date}`) || []
          const entryTimes = personLogs.map((log) => getTimeFromValue(log?.entryTime || log?.checkInTime || log?.inTime)).filter(Boolean).sort()
          const exitTimes = personLogs.map((log) => getTimeFromValue(log?.exitTime || log?.checkOutTime || log?.outTime)).filter(Boolean).sort()
          const entryTime = entryTimes[0] || ""
          const exitTime = exitTimes[exitTimes.length - 1] || ""
          const leave = leaveRequests.find((item) => getLeavePersonId(item) === personnelId && isDateInLeave(date, item))
          const shiftStart = formatTimeValueTR(shift?.startTime || "08:00")
          const shiftEnd = formatTimeValueTR(shift?.endTime || "17:00")
          const shiftStartMinutes = toMinutes(shiftStart)
          const shiftEndMinutes = toMinutes(shiftEnd)
          const entryMinutes = toMinutes(entryTime)
          const exitMinutes = toMinutes(exitTime)

          let status = "Normal"
          let description = "Vardiya ve giriş/çıkış kayıtları uyumlu."

          if (leave) {
            status = "Leave"
            description = "Onaylı izin kaydı bulundu."
          } else if (!entryTime) {
            status = "Absent"
            description = "Giriş kaydı bulunamadı."
          } else if (entryMinutes !== null && shiftStartMinutes !== null && entryMinutes > shiftStartMinutes) {
            status = "Late"
            description = `Vardiya başlangıcından sonra giriş yaptı.`
          } else if (exitTime && exitMinutes !== null && shiftEndMinutes !== null && exitMinutes < shiftEndMinutes) {
            status = "EarlyExit"
            description = "Vardiya bitişinden önce çıkış yaptı."
          } else if (!exitTime) {
            status = "Incomplete"
            description = "Çıkış kaydı bulunamadı."
          }

          if (annotation.excused) {
            status = "Excused"
            description = annotation.note || "Mazeretli olarak işaretlendi."
          } else if (annotation.note) {
            description = annotation.note
          }

          rows.push({
            key: rowKey,
            person,
            personnelId,
            branchId,
            branch: branchById.get(branchId),
            departmentId,
            department: departmentById.get(departmentId),
            date,
            shift,
            shiftLabel: `${shift?.name || "Vardiya"} · ${shiftStart} - ${shiftEnd}`,
            entryTime,
            exitTime,
            status,
            description,
            leave,
            logs: personLogs,
            annotation,
          })
        })
      })
    })

    return rows
      .filter((row) => filters.personnelId === ALL || row.personnelId === filters.personnelId)
      .filter((row) => filters.branchId === ALL || row.branchId === filters.branchId)
      .filter((row) => filters.departmentId === ALL || row.departmentId === filters.departmentId)
      .filter((row) => filters.status === ALL || row.status === filters.status)
      .sort((a, b) => `${b.date}${getPersonnelName(b.person)}`.localeCompare(`${a.date}${getPersonnelName(a.person)}`))
  }, [annotations, attendanceByPersonDate, branchById, departmentById, filters, leaveRequests, personById, shifts])

  const stats = React.useMemo(() => {
    const reportable = reportRows.filter((row) => row.status !== "Normal" && row.status !== "Leave")
    return {
      absent: reportRows.filter((row) => row.status === "Absent").length,
      late: reportRows.filter((row) => row.status === "Late").length,
      early: reportRows.filter((row) => row.status === "EarlyExit").length,
      incomplete: reportRows.filter((row) => row.status === "Incomplete").length,
      leave: reportRows.filter((row) => row.status === "Leave").length,
      ratio: reportRows.length ? Math.round((reportable.length / reportRows.length) * 100) : 0,
    }
  }, [reportRows])

  const exportCsv = () => {
    const header = ["Personel", "Sicil No", "Şube", "Departman", "Tarih", "Vardiya", "Giriş Saati", "Çıkış Saati", "Durum", "Açıklama"]
    const lines = reportRows.map((row) => [
      getPersonnelName(row.person),
      row.person?.registryNo || row.person?.personnelCode || row.personnelId,
      row.branch ? getBranchName(row.branch) : row.branchId || "-",
      row.department ? getDepartmentName(row.department) : row.departmentId || "-",
      row.date,
      row.shiftLabel,
      row.entryTime || "-",
      row.exitTime || "-",
      getStatusLabel(row.status),
      row.description,
    ])
    const csv = [header, ...lines].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "devamsizlik-raporu.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const openNote = (row: any) => {
    setSelectedRow(row)
    setNoteText(row.annotation?.note || row.description || "")
    setIsNoteOpen(true)
  }

  const openDetailAfterMenuClose = React.useCallback((row: any) => {
    window.setTimeout(() => {
      setSelectedRow(row)
      setIsDetailOpen(true)
    }, 0)
  }, [])

  const openNoteAfterMenuClose = React.useCallback((row: any) => {
    window.setTimeout(() => openNote(row), 0)
  }, [openNote])

  React.useEffect(() => {
    if (isDetailOpen || isNoteOpen || typeof document === "undefined") return
    const cleanup = window.setTimeout(() => {
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""
      document.body.removeAttribute("data-scroll-locked")
      document.body.removeAttribute("inert")
    }, 50)
    return () => window.clearTimeout(cleanup)
  }, [isDetailOpen, isNoteOpen])

  const saveNote = () => {
    if (!selectedRow) return
    const next = {
      ...annotations,
      [selectedRow.key]: {
        ...annotations[selectedRow.key],
        note: noteText.trim(),
        updatedAt: Date.now(),
      },
    }
    persistAnnotations(next)
    setIsNoteOpen(false)
    toast({ title: "Başarılı", description: "Açıklama kaydedildi." })
  }

  const markExcused = (row: any) => {
    const next = {
      ...annotations,
      [row.key]: {
        ...annotations[row.key],
        excused: true,
        note: annotations[row.key]?.note || "Mazeretli olarak işaretlendi.",
        updatedAt: Date.now(),
      },
    }
    persistAnnotations(next)
    toast({ title: "Başarılı", description: "Kayıt mazeretli olarak işaretlendi." })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <UserX className="h-8 w-8 text-accent" />
            Devamsızlık Raporu
          </h2>
          <p className="text-muted-foreground mt-1">Personel devamsızlıklarını, geç girişleri ve eksik mesai durumlarını analiz edin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={exportCsv}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel Dışa Aktar
          </Button>
          <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={() => window.print()}>
            <FileText className="mr-2 h-4 w-4" />
            PDF Raporu
          </Button>
          <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Raporu Yenile
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KPICard title="Toplam Devamsızlık" value={stats.absent} icon={UserX} color="text-accent" bg="bg-red-50" />
        <KPICard title="Geç Girişler" value={stats.late} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
        <KPICard title="Erken Çıkışlar" value={stats.early} icon={TimerOff} color="text-yellow-600" bg="bg-yellow-50" />
        <KPICard title="Eksik Mesai" value={stats.incomplete} icon={AlertTriangle} color="text-purple-600" bg="bg-purple-50" />
        <KPICard title="İzinli Günler" value={stats.leave} icon={UserCheck} color="text-blue-600" bg="bg-blue-50" />
        <KPICard title="Devamsızlık Oranı" value={`${stats.ratio}%`} icon={CalendarDays} color="text-primary" bg="bg-primary/5" />
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
          <FilterDate label="Başlangıç" value={filters.startDate} onChange={(value) => setFilters((prev) => ({ ...prev, startDate: value }))} />
          <FilterDate label="Bitiş" value={filters.endDate} onChange={(value) => setFilters((prev) => ({ ...prev, endDate: value }))} />
          <FilterSelect label="Personel" value={filters.personnelId} onChange={(value) => setFilters((prev) => ({ ...prev, personnelId: value }))}>
            <SelectItem value={ALL}>Tüm Personel</SelectItem>
            {personnel.map((person) => <SelectItem key={getPersonId(person)} value={getPersonId(person)}>{getPersonnelName(person)}</SelectItem>)}
          </FilterSelect>
          <FilterSelect label="Şube" value={filters.branchId} onChange={(value) => setFilters((prev) => ({ ...prev, branchId: value }))}>
            <SelectItem value={ALL}>Tüm Şubeler</SelectItem>
            {branches.map((branch) => <SelectItem key={getBranchId(branch)} value={getBranchId(branch)}>{getBranchName(branch)}</SelectItem>)}
          </FilterSelect>
          <FilterSelect label="Departman" value={filters.departmentId} onChange={(value) => setFilters((prev) => ({ ...prev, departmentId: value }))}>
            <SelectItem value={ALL}>Tüm Departmanlar</SelectItem>
            {departments.map((department) => <SelectItem key={getDepartmentId(department)} value={getDepartmentId(department)}>{getDepartmentName(department)}</SelectItem>)}
          </FilterSelect>
          <FilterSelect label="Durum" value={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectItem value={ALL}>Tüm Durumlar</SelectItem>
            {STATUSES.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
          </FilterSelect>
          <div className="flex items-end">
            <Button className="h-11 w-full rounded-xl bg-primary hover:bg-primary/90" onClick={loadData}>
              <Filter className="mr-2 h-4 w-4" />
              Filtrele
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Devamsızlık Listesi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reportRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[360px]">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <UserX className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Seçilen kriterlere uygun devamsızlık kaydı bulunmuyor.</h3>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">Personel</TableHead>
                  <TableHead>Sicil No</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Vardiya</TableHead>
                  <TableHead>Giriş Saati</TableHead>
                  <TableHead>Çıkış Saati</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right pr-6">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportRows.map((row) => (
                  <TableRow key={row.key} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={row.person?.avatarUrl} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {getPersonnelName(row.person).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-primary">{getPersonnelName(row.person)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{row.person?.registryNo || row.person?.personnelCode || row.personnelId}</TableCell>
                    <TableCell className="text-sm font-semibold text-slate-700">{row.branch ? getBranchName(row.branch) : row.branchId || "-"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{row.department ? getDepartmentName(row.department) : row.departmentId || "-"}</TableCell>
                    <TableCell className="text-sm font-medium">{row.date}</TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-[180px] truncate">{row.shiftLabel}</TableCell>
                    <TableCell className="text-sm font-mono">{row.entryTime || "-"}</TableCell>
                    <TableCell className="text-sm font-mono">{row.exitTime || "-"}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[220px] truncate">{row.description}</TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <MoreHorizontal className="h-5 w-5 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => openDetailAfterMenuClose(row)}>
                            <Eye className="mr-3 h-4 w-4 text-slate-400" />
                            Detay Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openNoteAfterMenuClose(row)}>
                            <FileText className="mr-3 h-4 w-4 text-slate-400" />
                            Açıklama Ekle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-green-600" onClick={() => markExcused(row)}>
                            <ShieldCheck className="mr-3 h-4 w-4" />
                            Mazeretli İşaretle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[560px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">Devamsızlık Detayı</SheetTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="rounded-full h-8 w-8 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription>Seçilen rapor satırına ait vardiya, izin ve giriş/çıkış bilgileri.</SheetDescription>
            </SheetHeader>
            <div className="p-8 space-y-4">
              {selectedRow && (
                <>
                  <InfoRow label="Personel" value={getPersonnelName(selectedRow.person)} />
                  <InfoRow label="Sicil No" value={selectedRow.person?.registryNo || selectedRow.person?.personnelCode || selectedRow.personnelId} />
                  <InfoRow label="Şube" value={selectedRow.branch ? getBranchName(selectedRow.branch) : selectedRow.branchId || "-"} />
                  <InfoRow label="Departman" value={selectedRow.department ? getDepartmentName(selectedRow.department) : selectedRow.departmentId || "-"} />
                  <InfoRow label="Tarih" value={selectedRow.date} />
                  <InfoRow label="Vardiya" value={selectedRow.shiftLabel} />
                  <InfoRow label="Giriş Saati" value={selectedRow.entryTime || "-"} />
                  <InfoRow label="Çıkış Saati" value={selectedRow.exitTime || "-"} />
                  <InfoRow label="Durum" value={getStatusLabel(selectedRow.status)} />
                  <InfoRow label="Açıklama" value={selectedRow.description} />
                  <InfoRow label="İzin Kaydı" value={selectedRow.leave ? `${formatDateTR(selectedRow.leave.startDate)} / ${formatDateTR(selectedRow.leave.endDate)}` : "-"} />
                  <InfoRow label="Son Güncelleme" value={selectedRow.annotation?.updatedAt ? formatDateTimeTR(selectedRow.annotation.updatedAt) : "-"} />
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">Açıklama Ekle</DialogTitle>
            <DialogDescription className="text-white/80">Rapor satırına kalıcı açıklama girin.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-2">
            <Label className="text-[11px] font-bold text-slate-500 uppercase">Açıklama</Label>
            <Textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              className="min-h-[140px] rounded-2xl border-slate-200"
              placeholder="Açıklama girin..."
            />
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsNoteOpen(false)}>Vazgeç</Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={saveNote}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label>
      <Input {...DATE_INPUT_PROPS} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border-slate-200 bg-white" />
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  )
}

function KPICard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="premium-card group hover:scale-[1.02] transition-transform">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl", bg)}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-primary tracking-tight">{value}</div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    Absent: "bg-red-50 text-accent border-red-100",
    Late: "bg-orange-50 text-orange-700 border-orange-100",
    EarlyExit: "bg-yellow-50 text-yellow-700 border-yellow-100",
    Incomplete: "bg-purple-50 text-purple-700 border-purple-100",
    Leave: "bg-blue-50 text-blue-700 border-blue-100",
    Normal: "bg-green-50 text-green-700 border-green-100",
    Excused: "bg-emerald-50 text-emerald-700 border-emerald-100",
  }

  const Icon = status === "Normal" ? CheckCircle2 : status === "Leave" || status === "Excused" ? UserCheck : AlertTriangle

  return (
    <Badge className={cn("font-bold px-3 py-1 rounded-lg", classes[status] || "bg-slate-50 text-slate-600 border-slate-200")}>
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {getStatusLabel(status)}
    </Badge>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-slate-100 bg-white rounded-xl px-4 py-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-slate-700 text-right break-all">{value}</span>
    </div>
  )
}
