"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Coffee,
  FileText,
  LayoutDashboard,
  MapPin,
  QrCode,
  Radar,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { collection, doc, limit, onSnapshot, query, setDoc } from "firebase/firestore"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFirestore } from "@/firebase"
import { firebaseConfig } from "@/firebase/config"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

const d = translations.dashboard
const t = translations.common

const STORAGE_KEYS = [
  "app_personnel",
  "app_branches",
  "app_departments",
  "app_positions",
  "app_shifts",
  "app_leave_requests",
  "app_break_records",
  "app_live_presence",
  "app_attendance_records",
  "app_mobile_attendance_preview",
  "app_qr_points",
  "app_device_ids",
  "app_audit_logs",
]

const CHART_COLORS = ["#6366F1", "#0EA5E9", "#10B981", "#F97316", "#EC4899", "#14B8A6"]

function readArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getId(item: any) {
  return (item?.id || item?.uid || item?.code || item?.branchCode || item?.personnelCode || "").toString()
}

function branchName(branch: any) {
  return (branch?.branchName || branch?.name || branch?.title || branch?.branchCode || "Şube").toString()
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function getRecordDate(record: any) {
  const value = record?.tarih || record?.date || record?.entryDate || record?.createdAt || record?.timestamp
  if (!value) return ""
  if (typeof value === "number") return dateKey(new Date(value))
  if (typeof value === "string") return value.slice(0, 10)
  return ""
}

function getRecordTime(record: any) {
  return (record?.saat || record?.time || record?.entryTime || record?.startTime || "").toString().slice(0, 5)
}

function timeToMinutes(value: any) {
  const text = (value || "").toString().slice(0, 5)
  const [hour, minute] = text.split(":").map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  return hour * 60 + minute
}

function attendanceType(record: any) {
  return (record?.işlemTipi || record?.islemTipi || record?.type || record?.action || "").toString().toLowerCase()
}

function attendancePersonId(record: any) {
  return (record?.personelId || record?.personnelId || record?.personId || record?.employeeId || "").toString()
}

function matchesPerson(record: any, personId: string) {
  return attendancePersonId(record) === personId || [record?.personnelId, record?.personId, record?.employeeId].map((v) => (v || "").toString()).includes(personId) || (Array.isArray(record?.personnelIds) && record.personnelIds.map(String).includes(personId))
}

function matchesBranch(record: any, branchId: string) {
  return [record?.branchId, record?.branchCode, record?.locationId].map((v) => (v || "").toString()).includes(branchId)
}

function isEntry(record: any) {
  const type = attendanceType(record)
  return type.includes("giriş") || type.includes("giris") || type.includes("entry") || type.includes("in")
}

function isExit(record: any) {
  const type = attendanceType(record)
  return type.includes("çıkış") || type.includes("cikis") || type.includes("exit") || type.includes("out")
}

function statusText(value: any) {
  return (value || "").toString().toLowerCase()
}

function isApproved(value: any) {
  const raw = statusText(value)
  return raw.includes("approved") || raw.includes("onay") || raw.includes("accepted")
}

function isTodayInRange(item: any, today: string) {
  const start = (item?.startDate || item?.date || "").toString().slice(0, 10)
  const end = (item?.endDate || item?.date || start || "").toString().slice(0, 10)
  return start && start <= today && today <= end
}

function getShiftForPerson(shifts: any[], person: any, branchId: string, today: string) {
  const personId = getId(person)
  return shifts.find((shift) => {
    const shiftDate = (shift?.startDate || shift?.date || "").toString().slice(0, 10)
    const dateMatches = !shiftDate || shiftDate === today
    return dateMatches && (matchesPerson(shift, personId) || matchesBranch(shift, branchId))
  })
}

function isLateEntry(record: any, shift: any) {
  const entryMinutes = timeToMinutes(getRecordTime(record))
  const shiftMinutes = timeToMinutes(shift?.startTime || shift?.entryTime)
  if (entryMinutes === null || shiftMinutes === null) return statusText(record?.status).includes("late") || statusText(record?.status).includes("geç")
  return entryMinutes > shiftMinutes + 5
}

function formatDateTime(value: any) {
  if (!value) return "-"
  const date = typeof value === "number" ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  return date.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

type FirestoreDebugState = {
  firestore: "checking" | "connected" | "error"
  lastWrite: "checking" | "success" | "error"
  lastRead: "checking" | "success" | "error"
  errorMessage: string
}

const FIRESTORE_DEBUG_COLLECTIONS = ["branches", "personnel", "leaveRequests"]

function getFirebaseConfigIssue() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value || value === "env-placeholder")
    .map(([key]) => key)

  return missing.length ? `Firebase config eksik/placeholder: ${missing.join(", ")}` : ""
}

function getErrorMessage(error: unknown) {
  if (!error) return ""
  if (error instanceof Error) return error.message
  return String(error)
}

function debugStatusLabel(value: FirestoreDebugState["firestore"] | FirestoreDebugState["lastWrite"] | FirestoreDebugState["lastRead"]) {
  if (value === "success") return "success"
  if (value === "connected") return "connected"
  if (value === "error") return "error"
  return "checking"
}

function debugStatusClass(value: FirestoreDebugState["firestore"] | FirestoreDebugState["lastWrite"] | FirestoreDebugState["lastRead"]) {
  if (value === "success" || value === "connected") return "bg-emerald-50 text-emerald-700 border-emerald-100"
  if (value === "error") return "bg-red-50 text-red-700 border-red-100"
  return "bg-amber-50 text-amber-700 border-amber-100"
}

export default function DashboardPage() {
  const db = useFirestore()
  const [loading, setLoading] = React.useState(true)
  const [firestoreDebug, setFirestoreDebug] = React.useState<FirestoreDebugState>({
    firestore: "checking",
    lastWrite: "checking",
    lastRead: "checking",
    errorMessage: "",
  })
  const [data, setData] = React.useState<any>({
    personnel: [],
    branches: [],
    departments: [],
    positions: [],
    shifts: [],
    leaves: [],
    breaks: [],
    livePresence: [],
    attendance: [],
    qrPoints: [],
    devices: [],
    auditLogs: [],
  })

  const load = React.useCallback(() => {
    setData({
      personnel: readArray("app_personnel").filter((person: any) => !person?.isDeleted),
      branches: readArray("app_branches"),
      departments: readArray("app_departments"),
      positions: readArray("app_positions"),
      shifts: readArray("app_shifts"),
      leaves: readArray("app_leave_requests"),
      breaks: readArray("app_break_records"),
      livePresence: readArray("app_live_presence"),
      attendance: readArray("app_attendance_records"),
      qrPoints: readArray("app_qr_points"),
      devices: readArray("app_device_ids"),
      auditLogs: readArray("app_audit_logs"),
    })
    setLoading(false)
  }, [])

  React.useEffect(() => {
    load()
    const onStorage = (event: StorageEvent) => {
      if (!event.key || STORAGE_KEYS.includes(event.key)) load()
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("app-live-presence-updated", load)
    window.addEventListener("app-break-records-updated", load)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("app-live-presence-updated", load)
      window.removeEventListener("app-break-records-updated", load)
    }
  }, [load])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    let cancelled = false
    const unsubscribers: Array<() => void> = []
    const configIssue = getFirebaseConfigIssue()

    const updateDebug = (patch: Partial<FirestoreDebugState>) => {
      if (!cancelled) {
        setFirestoreDebug((current) => ({ ...current, ...patch }))
      }
    }

    if (!db) {
      updateDebug({
        firestore: "error",
        lastWrite: "error",
        lastRead: "error",
        errorMessage: configIssue || "Firestore init basarisiz: db instance yok.",
      })
      return
    }

    updateDebug({
      firestore: configIssue ? "error" : "connected",
      errorMessage: configIssue,
    })

    setDoc(doc(db, "__sync_debug", "admin-panel"), {
      checkedAt: new Date().toISOString(),
      source: "dashboard",
      collections: FIRESTORE_DEBUG_COLLECTIONS,
    }, { merge: true })
      .then(() => updateDebug({ lastWrite: "success" }))
      .catch((error) => updateDebug({ lastWrite: "error", errorMessage: getErrorMessage(error) }))

    FIRESTORE_DEBUG_COLLECTIONS.forEach((collectionName) => {
      try {
        const unsubscribe = onSnapshot(
          query(collection(db, collectionName), limit(1)),
          () => updateDebug({ lastRead: "success" }),
          (error) => updateDebug({ lastRead: "error", errorMessage: getErrorMessage(error) })
        )
        unsubscribers.push(unsubscribe)
      } catch (error) {
        updateDebug({ lastRead: "error", errorMessage: getErrorMessage(error) })
      }
    })

    return () => {
      cancelled = true
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [db])

  const today = React.useMemo(() => dateKey(new Date()), [])
  const todayEntries = React.useMemo(() => data.attendance.filter((record: any) => getRecordDate(record) === today && isEntry(record)), [data.attendance, today])
  const todayEntryPersonIds = React.useMemo(() => new Set(todayEntries.map(attendancePersonId).filter(Boolean)), [todayEntries])

  const latestAttendanceByPerson = React.useMemo(() => {
    const map = new Map<string, any>()
    data.attendance.forEach((record: any) => {
      const personId = attendancePersonId(record)
      if (!personId) return
      const previous = map.get(personId)
      const currentStamp = `${getRecordDate(record)} ${getRecordTime(record)}`
      const previousStamp = previous ? `${getRecordDate(previous)} ${getRecordTime(previous)}` : ""
      if (!previous || currentStamp >= previousStamp) map.set(personId, record)
    })
    return map
  }, [data.attendance])

  const latePersonIds = React.useMemo(() => {
    return new Set(todayEntries.filter((record: any) => {
      const person = data.personnel.find((item: any) => getId(item) === attendancePersonId(record))
      const branchId = (person?.branchId || record?.branchId || "").toString()
      const shift = person ? getShiftForPerson(data.shifts, person, branchId, today) : null
      return record?.isLate === true || isLateEntry(record, shift)
    }).map(attendancePersonId))
  }, [data.personnel, data.shifts, today, todayEntries])

  const insidePersonIds = React.useMemo(() => {
    const liveInside = data.livePresence.filter((item: any) => statusText(item?.status) === "inside").map(attendancePersonId).filter(Boolean)
    return new Set(liveInside)
  }, [data.livePresence])

  const activeBreaks = React.useMemo(() => data.livePresence.filter((item: any) => statusText(item?.status) === "on_break"), [data.livePresence])
  const leaveToday = React.useMemo(() => data.leaves.filter((leave: any) => isTodayInRange(leave, today) && (isApproved(leave?.status) || statusText(leave?.status).includes("bekliyor"))), [data.leaves, today])

  const qrStats = React.useMemo(() => {
    const records = data.attendance.filter((record: any) => record?.qrStatus)
    const success = records.filter((record: any) => statusText(record.qrStatus).includes("başar") || statusText(record.qrStatus).includes("basar") || statusText(record.qrStatus).includes("success")).length
    return { total: records.length, success, rate: records.length ? Math.round((success / records.length) * 100) : 0 }
  }, [data.attendance])

  const gpsStats = React.useMemo(() => {
    const records = data.attendance.filter((record: any) => record?.gpsStatus)
    const success = records.filter((record: any) => statusText(record.gpsStatus).includes("doğrul") || statusText(record.gpsStatus).includes("dogrul") || statusText(record.gpsStatus).includes("valid")).length
    return { total: records.length, success, rate: records.length ? Math.round((success / records.length) * 100) : 0 }
  }, [data.attendance])

  const overtimeRisk = React.useMemo(() => {
    return data.attendance.filter((record: any) => getRecordDate(record) === today && Number(record?.overtimeMinutes || 0) > 0).length
  }, [data.attendance, today])

  const kpis = React.useMemo(() => {
    const totalStaff = data.personnel.length
    const activeToday = todayEntryPersonIds.size
    const absenteeism = Math.max(0, totalStaff - activeToday - leaveToday.length)
    return [
      { title: d.totalStaff || "Toplam Personel", value: totalStaff, sub: totalStaff ? `${totalStaff} kayıtlı personel` : "Henüz personel kaydı bulunmuyor", icon: Users, trend: "up", percentage: totalStaff ? "canlı" : "boş", color: "text-primary" },
      { title: d.activeToday || "Bugün Aktif", value: activeToday, sub: totalStaff ? `%${Math.round((activeToday / totalStaff) * 100)} katılım` : "Giriş verisi için personel bekleniyor", icon: UserCheck, trend: "up", percentage: `${activeToday} kişi`, color: "text-green-600" },
      { title: d.lateArrivals || "Geç Gelenler", value: latePersonIds.size, sub: todayEntries.length ? `%${Math.round((latePersonIds.size / todayEntries.length) * 100)} gecikme` : "Bugün giriş kaydı yok", icon: Clock, trend: "down", percentage: `${latePersonIds.size}`, color: "text-accent" },
      { title: d.absenteeism || "Devamsızlık", value: absenteeism, sub: totalStaff ? "Bugün giriş kaydı olmayanlar" : "Personel kaydı bulunmuyor", icon: UserX, trend: "down", percentage: `${absenteeism}`, color: "text-slate-400" },
    ]
  }, [data.personnel.length, d.absenteeism, d.activeToday, d.lateArrivals, d.totalStaff, latePersonIds.size, leaveToday.length, todayEntries.length, todayEntryPersonIds.size])

  const weeklyFlow = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(new Date(), index - 6)
      const key = dateKey(day)
      const entries = data.attendance.filter((record: any) => getRecordDate(record) === key && isEntry(record))
      const active = new Set(entries.map(attendancePersonId).filter(Boolean)).size
      const late = entries.filter((record: any) => {
        const person = data.personnel.find((item: any) => getId(item) === attendancePersonId(record))
        const branchId = (person?.branchId || record?.branchId || "").toString()
        const shift = person ? getShiftForPerson(data.shifts, person, branchId, key) : null
        return record?.isLate === true || isLateEntry(record, shift)
      }).length
      return {
        day: day.toLocaleDateString("tr-TR", { weekday: "short" }),
        date: key,
        present: active,
        entries: entries.length,
        late,
      }
    })
  }, [data.attendance, data.personnel, data.shifts])

  const hasAttendanceData = data.attendance.length > 0

  const branchDistribution = React.useMemo(() => {
    return data.branches.map((branch: any, index: number) => {
      const branchId = getId(branch)
      const staff = data.personnel.filter((person: any) => (person?.branchId || "").toString() === branchId)
      const active = staff.filter((person: any) => insidePersonIds.has(getId(person))).length
      return {
        id: branchId || `branch-${index}`,
        name: branchName(branch),
        value: staff.length,
        active,
        rate: staff.length ? Math.round((active / staff.length) * 100) : 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    })
  }, [data.branches, data.personnel, insidePersonIds])

  const liveStats = [
    { label: "İçeride", value: insidePersonIds.size, icon: UserCheck, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Molada", value: activeBreaks.length, icon: Coffee, tone: "text-orange-600 bg-orange-50" },
    { label: "Geç", value: latePersonIds.size, icon: Clock, tone: "text-red-600 bg-red-50" },
    { label: "İzinli", value: leaveToday.length, icon: CalendarPlus, tone: "text-indigo-600 bg-indigo-50" },
    { label: "QR Başarı", value: `%${qrStats.rate}`, icon: QrCode, tone: "text-sky-600 bg-sky-50" },
    { label: "GPS Oranı", value: `%${gpsStats.rate}`, icon: MapPin, tone: "text-teal-600 bg-teal-50" },
    { label: "Fazla Mesai Riski", value: overtimeRisk, icon: Radar, tone: "text-amber-600 bg-amber-50" },
  ]

  const recentActivities = React.useMemo(() => {
    return [...data.auditLogs].sort((a: any, b: any) => (b?.timestamp || new Date(b?.createdAt || 0).getTime()) - (a?.timestamp || new Date(a?.createdAt || 0).getTime())).slice(0, 6)
  }, [data.auditLogs])

  const quickActions = [
    { title: "Personel Ekle", href: "/personnel", icon: UserPlus, tone: "from-indigo-600 to-sky-500" },
    { title: "Vardiya Planla", href: "/shifts", icon: CalendarPlus, tone: "from-violet-600 to-fuchsia-500" },
    { title: "Mola Başlat", href: "/breaks", icon: Coffee, tone: "from-orange-500 to-amber-400" },
    { title: "Erişim Yönet", href: "/access-management", icon: ShieldCheck, tone: "from-emerald-500 to-teal-400" },
  ]

  const totalRecords = data.personnel.length + data.branches.length + data.attendance.length + data.auditLogs.length

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight premium-gradient-text">{t.dashboard}</h2>
          <p className="text-muted-foreground mt-1 text-base">{d.kpiSummary}</p>
        </div>
        <Badge variant="outline" className="px-5 py-2.5 rounded-2xl bg-white/90 shadow-sm font-bold border-white animate-pulse text-xs tracking-wider">
          <Activity className="w-4 h-4 mr-2.5 text-accent" />
          CANLI İZLEME AKTİF · LOCAL
        </Badge>
      </div>

      <Card className="premium-card">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Firestore Sync Debug</p>
            <p className="mt-1 text-sm font-bold text-primary">branches / personnel / leaveRequests baglanti kontrolu</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
            <div className={cn("rounded-2xl border px-3 py-2 text-xs font-extrabold", debugStatusClass(firestoreDebug.firestore))}>
              Firestore: {debugStatusLabel(firestoreDebug.firestore)}
            </div>
            <div className={cn("rounded-2xl border px-3 py-2 text-xs font-extrabold", debugStatusClass(firestoreDebug.lastWrite))}>
              Last write: {debugStatusLabel(firestoreDebug.lastWrite)}
            </div>
            <div className={cn("rounded-2xl border px-3 py-2 text-xs font-extrabold", debugStatusClass(firestoreDebug.lastRead))}>
              Last read: {debugStatusLabel(firestoreDebug.lastRead)}
            </div>
          </div>
          <div className="min-w-0 lg:max-w-sm">
            <p className="truncate rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
              Error message: {firestoreDebug.errorMessage || "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            href={action.href}
            key={action.title}
            className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-[0_18px_55px_-36px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(79,70,229,0.45)] focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <div className={`absolute inset-y-0 right-0 w-28 bg-gradient-to-br ${action.tone} opacity-10 transition-opacity group-hover:opacity-25`} />
            <div className="relative flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${action.tone} text-white shadow-lg shadow-slate-900/10 transition-transform group-hover:scale-105`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-primary">{action.title}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Hızlı işlem</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-6">
        {liveStats.map((item) => (
          <Card key={item.label} className="premium-card overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", item.tone)}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-primary">{item.value}</div>
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">{item.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item, i) => (
          <Card key={i} className="premium-card relative overflow-hidden group">
            <div className="mini-sparkline" />
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">{item.title}</CardTitle>
              <div className="p-2.5 rounded-xl premium-icon-bg group-hover:scale-105 transition-transform">
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
            </CardHeader>
            <CardContent className="relative">
              {loading ? (
                <Skeleton className="h-10 w-24 mb-2" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-extrabold text-primary tracking-tight">{item.value}</div>
                  <div className={cn("flex items-center text-[11px] font-bold", item.trend === "up" ? "text-green-600" : "text-accent")}>
                    {item.trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {item.percentage}
                  </div>
                </div>
              )}
              <p className="text-[12px] mt-2 font-medium text-slate-500">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalRecords === 0 && !loading ? (
        <EmptyState
          icon={Users}
          title="Henüz dashboard verisi bulunmuyor."
          description="Personel, şube ve mobil giriş kayıtları oluştuğunda ana panel otomatik olarak dolacaktır."
          href="/personnel"
          action="Personel Oluştur"
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 premium-card min-w-0">
          <CardHeader className="border-b bg-slate-50/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-primary">{d.weeklyFlow}</CardTitle>
                <CardDescription className="text-xs font-medium">Son 7 gün giriş yoğunluğu, aktif personel ve geç kalanlar</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200">
                <Link href="/reports">Detaylı Rapor</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {!hasAttendanceData ? (
              <ChartEmpty icon={BarChart3} title="Henüz attendance verisi bulunamadı" description="Mobil giriş/çıkış simülasyonları veya PDKS kayıtları oluştuğunda haftalık akış burada görünür." href="/mobile-preview" action="Mobil Önizleme" />
            ) : (
              <div className="h-[350px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "#94A3B8" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                    <RechartsTooltip cursor={{ fill: "rgba(99,102,241,0.06)" }} contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 18px 45px rgba(15,23,42,.12)" }} />
                    <defs>
                      <linearGradient id="attendanceGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.55} />
                      </linearGradient>
                      <linearGradient id="lateGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#F97316" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity={0.55} />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="present" name="Aktif personel" fill="url(#attendanceGradient)" radius={[10, 10, 0, 0]} barSize={30} />
                    <Bar dataKey="late" name="Geç kalan" fill="url(#lateGradient)" radius={[10, 10, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 premium-card min-w-0">
          <CardHeader className="border-b bg-slate-50/10">
            <CardTitle className="text-lg font-bold text-primary">{d.branchDist}</CardTitle>
            <CardDescription className="text-xs font-medium">Şube bazlı personel dağılımı ve aktiflik oranı</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {branchDistribution.length === 0 ? (
              <ChartEmpty icon={MapPin} title="Henüz şube kaydı bulunmuyor." description="Şube oluşturulduğunda personel dağılımı bu panelde hesaplanır." href="/branches" action="Şube Oluştur" />
            ) : (
              <>
                <div className="h-[250px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={branchDistribution} cx="50%" cy="50%" innerRadius={68} outerRadius={92} paddingAngle={6} dataKey="value" nameKey="name" strokeWidth={0}>
                        {branchDistribution.map((entry: any) => (
                          <Cell key={entry.id} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 18px 45px rgba(15,23,42,.12)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3.5 mt-5">
                  {branchDistribution.slice(0, 5).map((branch: any) => (
                    <div key={branch.id} className="rounded-2xl border border-slate-100 bg-white/70 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center">
                          <div className="w-3.5 h-3.5 rounded-full mr-3.5 shadow-sm ring-2 ring-white" style={{ backgroundColor: branch.color }} />
                          <span className="truncate font-bold text-slate-700">{branch.name}</span>
                        </div>
                        <Badge variant="secondary" className="font-extrabold px-3 bg-white border border-slate-100 shadow-sm text-primary">{branch.value}</Badge>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400" style={{ width: `${branch.rate}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] font-bold text-slate-400">{branch.active} içeride · %{branch.rate} aktiflik</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 premium-card">
          <CardHeader className="border-b bg-slate-50/10">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary"><Radar className="h-5 w-5 text-accent" />Canlı Workforce Durumu</CardTitle>
            <CardDescription className="text-xs font-medium">Mobil giriş, mola, izin, QR/GPS ve cihaz verilerinden özet</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <SignalCard title="Mobil Giriş Kapsamı" value={`${todayEntryPersonIds.size}/${data.personnel.length}`} description="Bugün giriş yapan tekil personel" icon={Smartphone} />
            <SignalCard title="QR Noktaları" value={`${data.qrPoints.length}`} description={`${qrStats.success}/${qrStats.total} başarılı doğrulama`} icon={QrCode} />
            <SignalCard title="Device ID" value={`${data.devices.length}`} description="Tanımlı mobil cihaz kaydı" icon={ShieldCheck} />
            <SignalCard title="Şube & Organizasyon" value={`${data.branches.length}/${data.departments.length}`} description="Şube ve departman kapsamı" icon={LayoutDashboard} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 premium-card">
          <CardHeader className="border-b bg-slate-50/10">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary"><FileText className="h-5 w-5 text-accent" />Son Aktiviteler</CardTitle>
            <CardDescription className="text-xs font-medium">app_audit_logs üzerinden canlı aktivite akışı</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {recentActivities.length === 0 ? (
              <ChartEmpty icon={FileText} title="Henüz audit log bulunmuyor." description="Panel veya mobil önizleme işlemleri yapıldığında son aktiviteler burada listelenir." href="/audit" action="Audit Sayfası" compact />
            ) : (
              <div className="space-y-3">
                {recentActivities.map((log: any) => (
                  <div key={log?.id || `${log?.action}-${log?.createdAt}`} className="flex gap-3 rounded-2xl border border-slate-100 bg-white/70 p-3">
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-primary">{log?.action || log?.title || "Aktivite"}</p>
                      <p className="line-clamp-2 text-xs font-medium text-slate-500">{log?.detail || log?.description || log?.category || "Detay yok"}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{formatDateTime(log?.createdAt || log?.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, href, action }: any) {
  return (
    <Card className="premium-card overflow-hidden">
      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-primary">{title}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
          </div>
        </div>
        <Button asChild className="rounded-2xl bg-primary">
          <Link href={href}>{action}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function ChartEmpty({ icon: Icon, title, description, href, action, compact }: any) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center", compact ? "min-h-[220px]" : "h-[350px]")}>
      <Icon className="mb-4 h-11 w-11 text-primary/35" />
      <p className="text-sm font-extrabold text-primary">{title}</p>
      <p className="mt-2 max-w-sm text-xs font-medium text-slate-500">{description}</p>
      <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl border-slate-200 bg-white">
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  )
}

function SignalCard({ title, value, description, icon: Icon }: any) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white/70 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-extrabold text-primary">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{description}</p>
    </div>
  )
}
