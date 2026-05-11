"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  Gauge,
  LineChart,
  Loader2,
  MapPin,
  MonitorSmartphone,
  Moon,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  Zap,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const AI_KEY = "app_ai_insights"
const AUDIT_KEY = "app_audit_logs"
const ALL = "__all__"

const readArray = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readObject = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
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

const toDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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
const scoreClamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const riskLabel = (score: number) => score >= 75 ? "Kritik" : score >= 55 ? "Yüksek" : score >= 30 ? "Orta" : "Düşük"

export default function AIInsightsPage() {
  const { toast } = useToast()
  const [data, setData] = React.useState({
    personnel: [] as any[],
    branches: [] as any[],
    departments: [] as any[],
    shifts: [] as any[],
    leaves: [] as any[],
    breaks: [] as any[],
    absence: [] as any[],
    audit: [] as any[],
    devices: [] as any[],
    attendance: [] as any[],
    qrPoints: [] as any[],
  })
  const [aiState, setAiState] = React.useState<any>({ analyses: {}, activity: [] })
  const [selectedId, setSelectedId] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [loadingStage, setLoadingStage] = React.useState("")
  const [filters, setFilters] = React.useState({
    search: "",
    branchId: ALL,
    departmentId: ALL,
    risk: ALL,
    status: ALL,
    lateOnly: "all",
    overtimeOnly: "all",
  })

  const loadData = React.useCallback(() => {
    const personnel = readArray("app_personnel").filter((person: any) => !person?.isDeleted)
    setData({
      personnel,
      branches: readArray("app_branches"),
      departments: readArray("app_departments"),
      shifts: readArray("app_shifts"),
      leaves: readArray("app_leave_requests"),
      breaks: readArray("app_break_records"),
      absence: readArray("app_absence_reports"),
      audit: readArray("app_audit_logs"),
      devices: readArray("app_device_ids"),
      attendance: readArray("app_attendance_logs"),
      qrPoints: readArray("app_qr_points"),
    })
    setAiState({ analyses: {}, activity: [], ...readObject(AI_KEY) })
    if (!selectedId && personnel[0]) setSelectedId(getPersonId(personnel[0]))
  }, [selectedId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const branchById = React.useMemo(() => new Map(data.branches.map((branch) => [getBranchId(branch), branch])), [data.branches])
  const deptById = React.useMemo(() => new Map(data.departments.map((department) => [getDepartmentId(department), department])), [data.departments])
  const deviceByPerson = React.useMemo(() => new Map(data.devices.map((device) => [device.personnelId, device])), [data.devices])

  const personnelAnalyses = React.useMemo(() => {
    return data.personnel.map((person) => buildAnalysis(person, data, branchById, deptById, deviceByPerson))
  }, [branchById, data, deptById, deviceByPerson])

  const selectedAnalysis = React.useMemo(() => personnelAnalyses.find((item) => item.personnelId === selectedId) || personnelAnalyses[0], [personnelAnalyses, selectedId])

  const filteredAnalyses = React.useMemo(() => {
    return personnelAnalyses.filter((analysis) => {
      const person = analysis.person
      const term = filters.search.toLowerCase()
      const target = `${getPersonnelName(person)} ${person?.registryNo || ""} ${person?.personnelCode || ""}`.toLowerCase()
      return (!term || target.includes(term))
        && (filters.branchId === ALL || person?.branchId === filters.branchId)
        && (filters.departmentId === ALL || person?.departmentId === filters.departmentId)
        && (filters.risk === ALL || analysis.riskLevel === filters.risk)
        && (filters.status === ALL || person?.status === filters.status)
        && (filters.lateOnly === "all" || analysis.metrics.lateCount > 0)
        && (filters.overtimeOnly === "all" || analysis.metrics.overtimeMinutes > 0)
    })
  }, [filters, personnelAnalyses])

  const kpis = React.useMemo(() => {
    const avg = (items: number[]) => items.length ? Math.round(items.reduce((a, b) => a + b, 0) / items.length) : 0
    return {
      risk: avg(personnelAnalyses.map((a) => a.scores.aiRisk)),
      suspicious: personnelAnalyses.filter((a) => a.metrics.suspiciousCount > 0).length,
      late: personnelAnalyses.reduce((sum, a) => sum + a.metrics.lateCount, 0),
      absence: personnelAnalyses.filter((a) => a.metrics.absenceCount > 0).length,
      overtime: Math.round(personnelAnalyses.reduce((sum, a) => sum + a.metrics.overtimeMinutes, 0) / 60),
      critical: personnelAnalyses.filter((a) => a.riskLevel === "Kritik" || a.riskLevel === "Yüksek").length,
      performance: avg(personnelAnalyses.map((a) => a.scores.performance)),
      device: avg(personnelAnalyses.map((a) => a.scores.security)),
    }
  }, [personnelAnalyses])

  const runAnalysis = async () => {
    if (!selectedAnalysis) return
    setLoading(true)
    for (const stage of ["veriler analiz ediliyor", "attendance patterns scanning", "anomaly detection", "overtime evaluation", "behavioral scoring", "risk calculation"]) {
      setLoadingStage(stage)
      await new Promise((resolve) => setTimeout(resolve, 420))
    }
    const next = {
      ...aiState,
      analyses: {
        ...(aiState.analyses || {}),
        [selectedAnalysis.personnelId]: { ...selectedAnalysis, analyzedAt: Date.now() },
      },
      activity: [
        { id: `ai-${Date.now()}`, text: `${getPersonnelName(selectedAnalysis.person)} için ${selectedAnalysis.riskLevel} risk analizi tamamlandı`, createdAt: Date.now() },
        ...(aiState.activity || []),
      ].slice(0, 20),
    }
    localStorage.setItem(AI_KEY, JSON.stringify(next))
    writeAudit(selectedAnalysis)
    setAiState(next)
    setLoading(false)
    toast({ title: "Analiz tamamlandı", description: `${getPersonnelName(selectedAnalysis.person)} için AI skorları güncellendi.` })
  }

  const exportReport = () => {
    const payload = selectedAnalysis || {}
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "ai-workforce-analysis.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const charts = React.useMemo(() => ({
    weekly: selectedAnalysis?.charts.weekly || [],
    late: selectedAnalysis?.charts.late || [],
    overtime: selectedAnalysis?.charts.overtime || [],
    risk: buildRiskDistribution(personnelAnalyses),
    absence: buildAbsenceChart(personnelAnalyses),
    device: personnelAnalyses.map((a) => ({ label: getPersonnelName(a.person), value: a.scores.security })).slice(0, 8),
    branch: buildGroupPerformance(personnelAnalyses, "branch"),
    department: buildGroupPerformance(personnelAnalyses, "department"),
  }), [personnelAnalyses, selectedAnalysis])

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_12%_20%,rgba(168,85,247,0.28),transparent_28rem),radial-gradient(circle_at_82%_10%,rgba(59,130,246,0.2),transparent_26rem),linear-gradient(135deg,rgba(5,8,22,0.98),rgba(20,14,45,0.96)_56%,rgba(44,24,85,0.92))] p-8 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-fuchsia-100">
              <BrainCircuit className="h-3.5 w-3.5" />
              Enterprise Workforce Intelligence
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-fuchsia-300" />
              AI Attendance Insights
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              Personel davranışları, mesai yoğunluğu, risk sinyalleri ve güvenlik anomalilerini localStorage verileriyle analiz edin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={exportReport}><Download className="mr-2 h-4 w-4" />AI raporu indir</Button>
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Yazdır</Button>
            <Button className="h-11 rounded-2xl bg-white text-primary hover:bg-slate-100 shadow-xl" onClick={runAnalysis} disabled={!selectedAnalysis || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
              Yapay Zeka Analizini Başlat
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AiKpi title="AI Risk Skoru" value={`${kpis.risk}/100`} icon={Gauge} gradient="from-slate-900 to-purple-950" />
        <AiKpi title="Şüpheli Davranış" value={kpis.suspicious} icon={ShieldAlert} gradient="from-rose-500 to-slate-950" />
        <AiKpi title="Geç Kalma Trendleri" value={kpis.late} icon={Clock3} gradient="from-orange-500 to-slate-950" />
        <AiKpi title="Devamsızlık Riski" value={kpis.absence} icon={UserX} gradient="from-red-500 to-zinc-950" />
        <AiKpi title="Fazla Mesai Yoğunluğu" value={`${kpis.overtime} sa`} icon={Timer} gradient="from-violet-500 to-fuchsia-950" />
        <AiKpi title="Kritik Personeller" value={kpis.critical} icon={AlertTriangle} gradient="from-amber-500 to-orange-950" />
        <AiKpi title="Performans Skoru" value={`${kpis.performance}/100`} icon={TrendingUp} gradient="from-emerald-500 to-teal-950" />
        <AiKpi title="Device Güven Skoru" value={`${kpis.device}/100`} icon={MonitorSmartphone} gradient="from-blue-500 to-violet-950" />
      </div>

      {loading && (
        <Card className="overflow-hidden rounded-2xl border border-fuchsia-200/60 bg-[#100a24] text-white shadow-2xl shadow-violet-950/30">
          <CardContent className="relative p-8 text-center">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] animate-pulse" />
            <BrainCircuit className="mx-auto h-16 w-16 text-fuchsia-300 animate-pulse" />
            <h3 className="mt-6 text-xl font-extrabold">AI Workforce Engine çalışıyor</h3>
            <p className="mt-2 text-sm font-semibold text-fuchsia-100">{loadingStage}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_340px]">
        <PersonnelPanel analyses={filteredAnalyses} selectedId={selectedAnalysis?.personnelId} setSelectedId={setSelectedId} filters={filters} setFilters={setFilters} branches={data.branches} departments={data.departments} />

        <div className="space-y-6">
          {selectedAnalysis ? (
            <>
              <AnalysisResults analysis={selectedAnalysis} />
              <div className="grid gap-4 lg:grid-cols-2">
                <MiniChart title="Haftalık giriş düzeni" icon={LineChart} data={charts.weekly} />
                <MiniChart title="Geç kalma trendi" icon={Clock3} data={charts.late} />
                <MiniChart title="Fazla mesai yoğunluğu" icon={Timer} data={charts.overtime} />
                <MiniChart title="Risk dağılımı" icon={PieChartIcon} data={charts.risk} />
                <MiniChart title="Devamsızlık analizi" icon={UserX} data={charts.absence} />
                <MiniChart title="Device güven grafiği" icon={MonitorSmartphone} data={charts.device} />
                <MiniChart title="Şube bazlı performans" icon={Building2} data={charts.branch} />
                <MiniChart title="Departman yoğunluğu" icon={BarChart3} data={charts.department} />
              </div>
              <Timeline analysis={selectedAnalysis} />
              <Anomalies analysis={selectedAnalysis} />
            </>
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="space-y-4">
          <LiveAiFeed aiState={aiState} analysis={selectedAnalysis} />
          <InsightCards analyses={personnelAnalyses} selected={selectedAnalysis} />
        </div>
      </div>
    </div>
  )
}

function buildAnalysis(person: any, data: any, branchById: Map<string, any>, deptById: Map<string, any>, deviceByPerson: Map<string, any>) {
  const personnelId = getPersonId(person)
  const logs = data.attendance.filter((log: any) => (log?.personnelId || log?.personId || "").toString() === personnelId)
  const shifts = data.shifts.filter((shift: any) => Array.isArray(shift?.personnelIds) && shift.personnelIds.includes(personnelId))
  const leaves = data.leaves.filter((leave: any) => (leave?.personnelId || leave?.personId || "").toString() === personnelId)
  const breaks = data.breaks.filter((item: any) => (item?.personnelId || item?.personId || "").toString() === personnelId)
  const audit = data.audit.filter((item: any) => `${item.user || item.actor || ""} ${item.target || ""}`.includes(getPersonnelName(person)))
  const device = deviceByPerson.get(personnelId)
  const branch = branchById.get(person?.branchId || "")
  const department = deptById.get(person?.departmentId || "")

  let lateCount = 0
  let overtimeMinutes = 0
  let irregularity = 0
  let nightEntries = 0
  const entryMinutes: number[] = []
  const timeline: any[] = []
  logs.forEach((log: any) => {
    const date = getLogDate(log)
    const entry = getTime(log?.entryTime || log?.checkInTime)
    const exit = getTime(log?.exitTime || log?.checkOutTime)
    const entryMinute = toMinutes(entry)
    const exitMinute = toMinutes(exit)
    if (entryMinute !== null) entryMinutes.push(entryMinute)
    if (entryMinute !== null && entryMinute > 9 * 60) lateCount += 1
    if (entryMinute !== null && (entryMinute < 6 * 60 || entryMinute > 22 * 60)) nightEntries += 1
    if (entryMinute !== null && exitMinute !== null) overtimeMinutes += Math.max(0, exitMinute - entryMinute - 9 * 60)
    timeline.push({ type: entryMinute !== null && entryMinute > 9 * 60 ? "Geç giriş" : "Giriş", date, detail: `${entry || "-"} / ${exit || "-"}`, risk: entryMinute !== null && entryMinute > 9 * 60 ? "Orta" : "Düşük" })
  })
  entryMinutes.forEach((minute) => {
    const avg = entryMinutes.reduce((a, b) => a + b, 0) / Math.max(1, entryMinutes.length)
    if (Math.abs(minute - avg) > 90) irregularity += 1
  })
  leaves.forEach((leave: any) => timeline.push({ type: "İzin", date: leave.startDate || "-", detail: leave.status || "İzin kaydı", risk: "Düşük" }))
  audit.slice(0, 5).forEach((item: any) => timeline.push({ type: item.type || "Audit", date: getDate(item.timestamp || item.createdAt), detail: item.detail || item.message || "-", risk: item.risk || "Orta" }))

  const suspiciousCount = audit.filter((item: any) => /şüpheli|suspicious|device|gps|kritik/i.test(`${item.type || ""} ${item.detail || item.message || ""}`) || item.risk === "Kritik").length
  const deviceChanges = new Set([device?.deviceId, ...audit.map((item: any) => item.deviceId).filter(Boolean)]).size
  const absenceCount = data.absence.filter((item: any) => (item?.personnelId || item?.personId || "").toString() === personnelId).length
  const breakMinutes = breaks.reduce((sum: number, item: any) => sum + Number(item.durationMinutes || item.duration || 0), 0)
  const qrCount = logs.filter((log: any) => /qr/i.test(`${log.verificationMethod || log.channel || ""}`)).length
  const gpsCount = logs.filter((log: any) => log.location || log.gps).length

  const attendanceScore = scoreClamp(100 - lateCount * 8 - absenceCount * 15 - irregularity * 4)
  const stabilityScore = scoreClamp(100 - irregularity * 10 - lateCount * 5)
  const securityScore = scoreClamp(100 - suspiciousCount * 20 - Math.max(0, deviceChanges - 1) * 18 + qrCount * 2 + gpsCount * 2)
  const overtimeScore = scoreClamp(100 - Math.round(overtimeMinutes / 30))
  const burnoutRisk = scoreClamp(Math.round(overtimeMinutes / 12) + lateCount * 5 + nightEntries * 8)
  const reliabilityScore = scoreClamp((attendanceScore + stabilityScore + securityScore + overtimeScore + (100 - burnoutRisk)) / 5)
  const aiRisk = scoreClamp(100 - reliabilityScore + suspiciousCount * 8 + absenceCount * 8)
  const performance = scoreClamp((attendanceScore + stabilityScore + overtimeScore + reliabilityScore) / 4)

  const anomalies = [
    lateCount >= 3 && { text: "Son dönemde geç giriş artışı tespit edildi", risk: "Yüksek" },
    breakMinutes > 240 && { text: "Normalden uzun mola süresi", risk: "Orta" },
    nightEntries > 0 && { text: "Gece saatinde giriş", risk: "Orta" },
    deviceChanges > 1 && { text: "Farklı cihaz kullanımı", risk: "Kritik" },
    suspiciousCount > 0 && { text: "Şüpheli aktivite izi bulundu", risk: "Kritik" },
    absenceCount > 0 && { text: "Devamsızlık riski tespit edildi", risk: "Yüksek" },
  ].filter(Boolean) as any[]

  const recommendations = [
    overtimeMinutes > 180 && "Fazla mesai yoğunluğu yüksek",
    burnoutRisk > 60 && "Burnout riski tespit edildi",
    lateCount >= 3 && "Geç kalma eğilimi artıyor",
    gpsCount === 0 && logs.length > 0 && "GPS doğrulama problemi mevcut",
    securityScore < 60 && "Device ve giriş güvenliği gözden geçirilmeli",
  ].filter(Boolean) as string[]

  const weekly = groupByDate(logs).map((item) => ({ label: item.label, value: item.value }))
  return {
    personnelId,
    person,
    branch,
    department,
    device,
    metrics: { lateCount, overtimeMinutes, suspiciousCount, absenceCount, breakMinutes, qrCount, gpsCount, deviceChanges, nightEntries },
    scores: { attendance: attendanceScore, stability: stabilityScore, security: securityScore, overtime: overtimeScore, burnout: burnoutRisk, reliability: reliabilityScore, aiRisk, performance },
    riskLevel: riskLabel(aiRisk),
    online: logs.some((log: any) => getTime(log.entryTime) && !getTime(log.exitTime)),
    lastEntry: logs.map((log: any) => getLogDate(log)).sort().at(-1) || "-",
    anomalies,
    recommendations: recommendations.length ? recommendations : ["Personel için kritik AI önerisi oluşmadı; düzenli izlemeye devam edin."],
    timeline: timeline.sort((a, b) => `${b.date}`.localeCompare(`${a.date}`)).slice(0, 12),
    charts: {
      weekly,
      late: groupByDate(logs.filter((log: any) => {
        const minute = toMinutes(getTime(log.entryTime || log.checkInTime))
        return minute !== null && minute > 9 * 60
      })),
      overtime: groupByDate(logs).map((item) => ({ label: item.label, value: Math.round(overtimeMinutes / Math.max(1, logs.length) / 60 * 10) / 10 || item.value })),
    },
  }
}

function writeAudit(analysis: any) {
  const log = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "AI Analizi Çalıştırıldı",
    user: "İK Yöneticisi",
    role: "Admin",
    module: "AI Insights",
    category: "Sistem",
    risk: analysis.riskLevel,
    status: "Başarılı",
    detail: `${getPersonnelName(analysis.person)} analiz edildi. Risk sonucu: ${analysis.riskLevel}`,
    timestamp: Date.now(),
    ipAddress: "local",
    deviceId: "ai-insights-panel",
  }
  localStorage.setItem(AUDIT_KEY, JSON.stringify([log, ...readArray(AUDIT_KEY)]))
}

function groupByDate(logs: any[]) {
  const counts = new Map<string, number>()
  logs.forEach((log) => {
    const date = getLogDate(log)
    if (!date) return
    counts.set(date, (counts.get(date) || 0) + 1)
  })
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-7).map(([label, value]) => ({ label, value }))
}

function buildRiskDistribution(analyses: any[]) {
  return ["Düşük", "Orta", "Yüksek", "Kritik"].map((risk) => ({ label: risk, value: analyses.filter((a) => a.riskLevel === risk).length }))
}
function buildAbsenceChart(analyses: any[]) {
  return analyses.map((a) => ({ label: getPersonnelName(a.person), value: a.metrics.absenceCount })).filter((i) => i.value > 0).slice(0, 8)
}
function buildGroupPerformance(analyses: any[], group: "branch" | "department") {
  const map = new Map<string, { total: number; count: number }>()
  analyses.forEach((analysis) => {
    const label = group === "branch" ? (analysis.branch ? getBranchName(analysis.branch) : "Bilinmeyen") : (analysis.department ? getDepartmentName(analysis.department) : "Bilinmeyen")
    const current = map.get(label) || { total: 0, count: 0 }
    map.set(label, { total: current.total + analysis.scores.performance, count: current.count + 1 })
  })
  return Array.from(map.entries()).map(([label, item]) => ({ label, value: Math.round(item.total / Math.max(1, item.count)) }))
}

function AiKpi({ title, value, icon: Icon, gradient }: any) {
  return <Card className="group overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl shadow-slate-200/70 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl"><CardContent className={cn("relative min-h-[132px] p-5 text-white bg-gradient-to-br", gradient)}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform group-hover:scale-150" /><Icon className="relative z-10 h-6 w-6 text-white/85" /><div className="relative z-10 mt-5 text-2xl font-extrabold">{value}</div><p className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-widest text-white/75">{title}</p><div className="relative z-10 mt-3 flex h-5 items-end gap-1">{[42, 66, 50, 78, 58, 92].map((h, i) => <span key={i} className="w-full rounded-full bg-white/35" style={{ height: `${h}%` }} />)}</div></CardContent></Card>
}

function PersonnelPanel({ analyses, selectedId, setSelectedId, filters, setFilters, branches, departments }: any) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader className="border-b bg-slate-50/40"><CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Personel Analiz Paneli</CardTitle></CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input value={filters.search} onChange={(e) => setFilters((p: any) => ({ ...p, search: e.target.value }))} className="h-10 rounded-xl pl-10" placeholder="Personel adı veya sicil no" /></div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={filters.branchId} onValueChange={(v) => setFilters((p: any) => ({ ...p, branchId: v }))}><SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Şube</SelectItem>{branches.map((b: any) => <SelectItem key={getBranchId(b)} value={getBranchId(b)}>{getBranchName(b)}</SelectItem>)}</SelectContent></Select>
          <Select value={filters.departmentId} onValueChange={(v) => setFilters((p: any) => ({ ...p, departmentId: v }))}><SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Departman</SelectItem>{departments.map((d: any) => <SelectItem key={getDepartmentId(d)} value={getDepartmentId(d)}>{getDepartmentName(d)}</SelectItem>)}</SelectContent></Select>
          <Select value={filters.risk} onValueChange={(v) => setFilters((p: any) => ({ ...p, risk: v }))}><SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Risk</SelectItem>{["Düşük", "Orta", "Yüksek", "Kritik"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
          <Select value={filters.status} onValueChange={(v) => setFilters((p: any) => ({ ...p, status: v }))}><SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Durum</SelectItem><SelectItem value="Active">Aktif</SelectItem><SelectItem value="Inactive">Pasif</SelectItem></SelectContent></Select>
          <Select value={filters.lateOnly} onValueChange={(v) => setFilters((p: any) => ({ ...p, lateOnly: v }))}><SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tümü</SelectItem><SelectItem value="late">Geç kalanlar</SelectItem></SelectContent></Select>
          <Select value={filters.overtimeOnly} onValueChange={(v) => setFilters((p: any) => ({ ...p, overtimeOnly: v }))}><SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tümü</SelectItem><SelectItem value="overtime">Fazla mesai</SelectItem></SelectContent></Select>
        </div>
        <div className="max-h-[720px] overflow-y-auto space-y-2 pr-1">
          {analyses.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Analiz edilecek personel bulunamadı.</p> : analyses.map((analysis: any) => (
            <button key={analysis.personnelId} onClick={() => setSelectedId(analysis.personnelId)} className={cn("w-full rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5", selectedId === analysis.personnelId ? "border-primary bg-primary text-white shadow-xl" : "border-slate-100 bg-white/80 hover:bg-slate-50")}>
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11"><AvatarImage src={analysis.person?.avatarUrl} /><AvatarFallback className="text-xs font-bold">{getPersonnelName(analysis.person).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold">{getPersonnelName(analysis.person)}</div>
                  <div className={cn("truncate text-xs", selectedId === analysis.personnelId ? "text-white/75" : "text-slate-500")}>{analysis.person?.registryNo || analysis.person?.personnelCode || analysis.personnelId} · {analysis.branch ? getBranchName(analysis.branch) : "-"}</div>
                </div>
                <RiskBadge risk={analysis.riskLevel} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={analysis.online ? "text-green-400" : selectedId === analysis.personnelId ? "text-white/60" : "text-slate-400"}>{analysis.online ? "online" : "offline"}</span>
                <span>Son giriş: {analysis.lastEntry}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AnalysisResults({ analysis }: { analysis: any }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ScoreCard title="Attendance Score" icon={CheckCircle2} items={[["Giriş düzeni", analysis.scores.attendance], ["Vardiya uyumu", analysis.scores.stability], ["Devamlılık oranı", analysis.scores.reliability]]} />
      <ScoreCard title="Risk Analysis" icon={ShieldAlert} items={[["Geç kalma riski", 100 - analysis.scores.attendance], ["Devamsızlık riski", analysis.metrics.absenceCount * 25], ["Burnout riski", analysis.scores.burnout], ["Şüpheli davranış riski", analysis.metrics.suspiciousCount * 25]]} />
      <ScoreCard title="Performance Insights" icon={TrendingUp} items={[["Çalışma yoğunluğu", analysis.scores.performance], ["Fazla mesai trendi", 100 - analysis.scores.overtime], ["Mola alışkanlığı", scoreClamp(100 - analysis.metrics.breakMinutes / 4)], ["Çalışma stabilitesi", analysis.scores.stability]]} />
      <ScoreCard title="Security Insights" icon={Fingerprint} items={[["Device güven skoru", analysis.scores.security], ["QR giriş güveni", scoreClamp(analysis.metrics.qrCount * 12)], ["GPS doğrulama güveni", scoreClamp(analysis.metrics.gpsCount * 12)], ["Şüpheli giriş analizi", scoreClamp(100 - analysis.metrics.suspiciousCount * 25)]]} />
      <Card className="lg:col-span-2 overflow-hidden rounded-2xl border border-violet-200/60 bg-[#100a24] text-white shadow-2xl">
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold"><BrainCircuit className="h-5 w-5 text-fuchsia-300" />AI Recommendation</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">{analysis.recommendations.map((rec: string) => <div key={rec} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold">{rec}</div>)}</CardContent>
      </Card>
    </div>
  )
}

function ScoreCard({ title, icon: Icon, items }: any) {
  return <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Icon className="h-4 w-4 text-accent" />{title}</CardTitle></CardHeader><CardContent className="space-y-3">{items.map(([label, value]: any) => <div key={label} className="space-y-1"><div className="flex justify-between text-xs font-bold text-slate-500"><span>{label}</span><span>{scoreClamp(value)}/100</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500" style={{ width: `${scoreClamp(value)}%` }} /></div></div>)}</CardContent></Card>
}

function MiniChart({ title, icon: Icon, data }: any) {
  const max = Math.max(1, ...data.map((item: any) => item.value))
  return <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Icon className="h-4 w-4 text-accent" />{title}</CardTitle></CardHeader><CardContent className="space-y-3">{data.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">Grafik için veri bekleniyor.</p> : data.map((item: any) => <div key={item.label} className="space-y-1"><div className="flex justify-between text-[11px] font-bold text-slate-500"><span className="truncate">{item.label}</span><span>{item.value}</span></div><div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500 shadow-[0_0_16px_rgba(124,58,237,0.35)]" style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} /></div></div>)}</CardContent></Card>
}

function Timeline({ analysis }: { analysis: any }) {
  return <Card className="premium-card overflow-hidden"><CardHeader className="border-b bg-slate-50/40"><CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">AI Timeline</CardTitle></CardHeader><CardContent className="p-5 space-y-3">{analysis.timeline.length === 0 ? <p className="text-sm text-muted-foreground">Zaman çizelgesi için kayıt yok.</p> : analysis.timeline.map((item: any, index: number) => <div key={index} className="flex gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3"><div className={cn("mt-1 h-3 w-3 rounded-full", item.risk === "Kritik" ? "bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.8)]" : "bg-violet-500")} /><div><div className="font-bold text-primary">{item.type} · {item.date}</div><p className="text-sm text-slate-500">{item.detail}</p></div></div>)}</CardContent></Card>
}

function Anomalies({ analysis }: { analysis: any }) {
  return <Card className="premium-card overflow-hidden"><CardHeader className="border-b bg-slate-50/40"><CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Anomaly Detection</CardTitle></CardHeader><CardContent className="p-5 grid gap-3 md:grid-cols-2">{analysis.anomalies.length === 0 ? <p className="text-sm text-muted-foreground">Kritik anomali bulunmadı.</p> : analysis.anomalies.map((anomaly: any) => <div key={anomaly.text} className={cn("rounded-2xl border p-4 font-semibold", anomaly.risk === "Kritik" ? "border-red-200 bg-red-50 text-red-700 shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-pulse" : "border-amber-200 bg-amber-50 text-amber-800")}><AlertTriangle className="mb-2 h-5 w-5" />{anomaly.text}</div>)}</CardContent></Card>
}

function LiveAiFeed({ aiState, analysis }: any) {
  const feed = [
    ...(aiState.activity || []),
    analysis && { id: "burnout", text: "Burnout riski hesaplandı", createdAt: Date.now() },
    analysis?.metrics.deviceChanges > 1 && { id: "device", text: "Device mismatch detected", createdAt: Date.now() },
    analysis?.anomalies?.length > 0 && { id: "anom", text: "Yeni anomali tespit edildi", createdAt: Date.now() },
    analysis && { id: "pattern", text: "Attendance pattern updated", createdAt: Date.now() },
  ].filter(Boolean).slice(0, 8)
  return <Card className="overflow-hidden rounded-2xl border border-fuchsia-200/60 bg-[#100a24] text-white shadow-2xl"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold"><Activity className="h-5 w-5 text-fuchsia-300" />Canlı AI Aktivite</CardTitle></CardHeader><CardContent className="space-y-3">{feed.length === 0 ? <p className="text-sm text-slate-300">AI activity feed analiz bekliyor.</p> : feed.map((item: any) => <div key={item.id} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm font-semibold"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_14px_rgba(217,70,239,0.9)] animate-pulse" />{item.text}</div>)}</CardContent></Card>
}

function InsightCards({ analyses, selected }: any) {
  const topDept = buildGroupPerformance(analyses, "department")[0]
  const topBranch = buildGroupPerformance(analyses, "branch")[0]
  const insights = [
    topDept && `${topDept.label} departmanında yoğun mesai yükü var`,
    topBranch && `${topBranch.label} şubesinde performans skoru ${topBranch.value}`,
    analyses.some((a: any) => a.scores.security < 60) && "Mobil giriş güvenliği düşük",
    analyses.reduce((sum: number, a: any) => sum + a.metrics.qrCount, 0) > 0 && "QR doğrulama başarısı yüksek",
    selected?.scores.burnout > 60 && "Seçili personelde burnout riski tespit edildi",
  ].filter(Boolean)
  return <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl backdrop-blur-xl"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-extrabold text-primary"><Zap className="h-4 w-4 text-accent" />AI Insight Cards</CardTitle></CardHeader><CardContent className="space-y-3">{insights.length === 0 ? <p className="text-sm text-muted-foreground">Insight için daha fazla veri bekleniyor.</p> : insights.map((item: any) => <div key={item} className="rounded-2xl border border-violet-100 bg-violet-50/70 p-3 text-sm font-bold text-violet-800">{item}</div>)}</CardContent></Card>
}

function RiskBadge({ risk }: { risk: string }) {
  const cls = risk === "Kritik" ? "bg-red-50 text-accent border-red-100 shadow-[0_0_18px_rgba(239,68,68,0.35)]" : risk === "Yüksek" ? "bg-orange-50 text-orange-700 border-orange-100" : risk === "Orta" ? "bg-yellow-50 text-yellow-700 border-yellow-100" : "bg-green-50 text-green-700 border-green-100"
  return <Badge className={cn("font-bold px-2 py-1", cls)}>{risk}</Badge>
}

function EmptyState() {
  return <Card className="grid min-h-[520px] place-items-center rounded-2xl border-2 border-dashed bg-white/70 text-center"><div><BrainCircuit className="mx-auto mb-4 h-14 w-14 text-primary/40" /><h3 className="text-xl font-extrabold text-primary">Analiz için personel bekleniyor</h3><p className="mt-2 text-sm text-muted-foreground">Personel kayıtları oluştuğunda AI analiz motoru çalışmaya hazır olacak.</p></div></Card>
}

function PieChartIcon(props: any) {
  return <Database {...props} />
}
