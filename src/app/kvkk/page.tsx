"use client"

import * as React from "react"
import { collection, onSnapshot } from "firebase/firestore"
import {
  Activity,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Edit2,
  Eye,
  FileLock2,
  FileText,
  Fingerprint,
  Globe2,
  History,
  Laptop,
  Layers3,
  MapPin,
  MoreHorizontal,
  Plus,
  Radar,
  RefreshCw,
  ScanFace,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Smartphone,
  TimerReset,
  UserCheck,
  Users,
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
import { useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { DATE_INPUT_PROPS, formatDateTimeTR } from "@/lib/date-time"
import { cn } from "@/lib/utils"

const KVKK_KEY = "app_kvkk_consents"
const PERSONNEL_KEY = "app_personnel"
const BRANCHES_KEY = "app_branches"
const DEPARTMENTS_KEY = "app_departments"
const DEVICES_KEY = "app_device_ids"

const ALL = "__all__"

const DOCUMENT_TEMPLATES = [
  { id: "kvkk-open-consent", title: "KVKK Açık Rıza Metni", required: true },
  { id: "camera-monitoring", title: "Kamera İzleme Onayı", required: false },
  { id: "gps-tracking", title: "GPS Takip Onayı", required: false },
  { id: "device-tracking", title: "Device Tracking Onayı", required: false },
  { id: "biometric-consent", title: "Biyometrik Veri Onayı", required: false },
  { id: "attendance-contract", title: "Mesai Takip Sözleşmesi", required: true },
]

const PROCESSING_ROWS = [
  { id: "location", name: "Konum Verisi", dataType: "Kişisel veri", department: "İnsan Kaynakları", retention: "12 ay", risk: "Yüksek" },
  { id: "camera", name: "Kamera Verisi", dataType: "Görsel kayıt", department: "Güvenlik", retention: "30 gün", risk: "Orta" },
  { id: "attendance", name: "Giriş/Çıkış Verisi", dataType: "PDKS kaydı", department: "İnsan Kaynakları", retention: "10 yıl", risk: "Orta" },
  { id: "device", name: "Device ID", dataType: "Teknik tanımlayıcı", department: "Bilgi Teknolojileri", retention: "24 ay", risk: "Orta" },
  { id: "ip", name: "IP Logları", dataType: "Erişim logu", department: "Bilgi Teknolojileri", retention: "24 ay", risk: "Düşük" },
  { id: "overtime", name: "Fazla Mesai Verileri", dataType: "Çalışma kaydı", department: "İnsan Kaynakları", retention: "10 yıl", risk: "Düşük" },
  { id: "biometric", name: "Biyometrik Veriler", dataType: "Özel nitelikli veri", department: "Uyum", retention: "Rıza süresince", risk: "Kritik" },
]

const RETENTION_ROWS = [
  { id: "personnel", dataType: "Personel özlük verileri", duration: "10 yıl", autoDelete: false, archive: "Şifreli arşiv", legal: "İş Kanunu / KVKK m.5", owner: "İnsan Kaynakları" },
  { id: "attendance", dataType: "PDKS giriş/çıkış verileri", duration: "10 yıl", autoDelete: false, archive: "Yıllık arşiv", legal: "İş Kanunu", owner: "İnsan Kaynakları" },
  { id: "gps", dataType: "GPS konum verileri", duration: "12 ay", autoDelete: true, archive: "Kısıtlı erişim", legal: "Açık rıza", owner: "Uyum" },
  { id: "camera", dataType: "Kamera kayıtları", duration: "30 gün", autoDelete: true, archive: "Güvenlik kasası", legal: "Meşru menfaat", owner: "Güvenlik" },
  { id: "biometric", dataType: "Biyometrik doğrulama verileri", duration: "Rıza süresince", autoDelete: true, archive: "Ayrıştırılmış kasa", legal: "Açık rıza", owner: "Uyum" },
]

const emptyState = {
  consents: [],
  documents: [],
  processing: {},
  retention: {},
  auditLogs: [],
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

const readKvkkState = () => {
  try {
    const raw = localStorage.getItem(KVKK_KEY)
    const parsed = raw ? JSON.parse(raw) : emptyState
    if (Array.isArray(parsed)) return { ...emptyState, consents: parsed }
    return { ...emptyState, ...(parsed || {}) }
  } catch {
    return emptyState
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

const boolField = (...values: any[]) => values.some((value) => value === true || value === "true" || value === "granted" || value === "Granted" || value === "approved" || value === "Approved")

const timestampValue = (value: any) => {
  if (!value) return ""
  if (typeof value?.toDate === "function") return value.toDate().toISOString()
  return value
}

const consentFromPersonnel = (person: any, legacyConsent: any = {}) => {
  const kvkkAccepted = person?.kvkkAccepted === true
  const locationPermissionGranted = boolField(
    person?.locationPermissionGranted,
    person?.gpsPermissionGranted,
    person?.gpsConsent,
    person?.locationConsent,
    person?.locationPermission,
    person?.permissions?.locationPermissionGranted,
    legacyConsent?.gpsConsent
  )
  return {
    ...legacyConsent,
    status: kvkkAccepted ? "Approved" : "Pending",
    signedAt: kvkkAccepted ? timestampValue(person?.kvkkAcceptedAt || legacyConsent?.signedAt) : "",
    updatedAt: timestampValue(person?.kvkkAcceptedAt || person?.updatedAt || legacyConsent?.updatedAt),
    gpsConsent: locationPermissionGranted,
    cameraConsent: boolField(person?.cameraConsent, person?.cameraPermissionGranted, legacyConsent?.cameraConsent),
    faceConsent: boolField(person?.faceConsent, person?.facePermissionGranted, legacyConsent?.faceConsent),
    deviceTrackingConsent: boolField(person?.deviceTrackingConsent, person?.devicePermissionGranted, legacyConsent?.deviceTrackingConsent),
    deviceId: person?.deviceId || legacyConsent?.deviceId || "",
    ipAddress: person?.lastIpAddress || legacyConsent?.ipAddress || "",
    digitalSignature: legacyConsent?.digitalSignature || (kvkkAccepted ? person?.kvkkVersion || "v1" : ""),
  }
}

const normalizeAuditLog = (log: any) => ({
  id: log?.id || `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type: log?.type || log?.action || "audit",
  actor: log?.actor || log?.actorName || log?.actorId || "-",
  target: log?.target || log?.targetPersonnelName || log?.targetPersonnelId || log?.fileName || "-",
  detail: log?.detail || [log?.fileCategory, log?.fileName].filter(Boolean).join(" - ") || log?.source || "-",
  ipAddress: log?.ipAddress || "-",
  deviceId: log?.deviceId || "-",
  createdAt: timestampValue(log?.createdAt || log?.timestamp),
})

const getStatusLabel = (status: string) => {
  if (status === "Approved") return "Onaylandı"
  if (status === "Rejected") return "Reddedildi"
  if (status === "Expired") return "Süresi Doldu"
  return "Bekliyor"
}

const createAudit = (type: string, actor: string, target: string, detail: string) => ({
  id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type,
  actor,
  target,
  detail,
  ipAddress: "local",
  deviceId: "panel",
  createdAt: Date.now(),
})

export default function KvkkPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const [personnel, setPersonnel] = React.useState<any[]>([])
  const [branches, setBranches] = React.useState<any[]>([])
  const [departments, setDepartments] = React.useState<any[]>([])
  const [devices, setDevices] = React.useState<any[]>([])
  const [kvkkState, setKvkkState] = React.useState<any>(emptyState)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState(ALL)
  const [selectedRow, setSelectedRow] = React.useState<any | null>(null)
  const [isConsentOpen, setIsConsentOpen] = React.useState(false)
  const [isDocumentOpen, setIsDocumentOpen] = React.useState(false)
  const [documentForm, setDocumentForm] = React.useState({
    title: "",
    description: "",
    content: "",
    version: "1.0",
    required: true,
    active: true,
  })
  const [consentForm, setConsentForm] = React.useState({
    status: "Pending",
    gpsConsent: false,
    cameraConsent: false,
    faceConsent: false,
    deviceTrackingConsent: false,
    ipAddress: "",
    deviceId: "",
    digitalSignature: "",
    expiresAt: "",
  })

  const loadData = React.useCallback(() => {
    setPersonnel(readArray(PERSONNEL_KEY).filter((person: any) => !person?.isDeleted))
    setBranches(readArray(BRANCHES_KEY))
    setDepartments(readArray(DEPARTMENTS_KEY))
    setDevices(readArray(DEVICES_KEY))
    setKvkkState(readKvkkState())
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  React.useEffect(() => {
    if (!db) return
    const unsubscribers = [
      onSnapshot(collection(db, "personnel"), (snapshot) => {
        const docs = snapshot.docs.map((item) => ({ ...item.data(), id: item.id })).filter((person: any) => !person?.isDeleted)
        setPersonnel(docs)
        try {
          localStorage.setItem(PERSONNEL_KEY, JSON.stringify(docs))
        } catch {
          // Firestore remains the visible source
        }
      }, (error) => {
        console.warn("Firestore personnel listener failed for KVKK page; localStorage fallback active.", error)
      }),
      onSnapshot(collection(db, "auditLogs"), (snapshot) => {
        const logs = snapshot.docs.map((item) => normalizeAuditLog({ ...item.data(), id: item.id }))
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        setKvkkState((current: any) => ({ ...current, auditLogs: logs }))
      }, (error) => {
        console.warn("Firestore auditLogs listener failed for KVKK page.", error)
      }),
    ]
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [db])

  const persistKvkk = React.useCallback((next: any) => {
    localStorage.setItem(KVKK_KEY, JSON.stringify(next))
    setKvkkState(next)
  }, [])

  const branchById = React.useMemo(() => new Map(branches.map((branch) => [getBranchId(branch), branch])), [branches])
  const departmentById = React.useMemo(() => new Map(departments.map((department) => [getDepartmentId(department), department])), [departments])
  const consentByPerson = React.useMemo(() => new Map((kvkkState.consents || []).map((consent: any) => [consent.personnelId, consent])), [kvkkState.consents])
  const deviceByPerson = React.useMemo(() => new Map(devices.map((device) => [device.personnelId, device])), [devices])

  const consentRows = React.useMemo(() => {
    return personnel.map((person) => {
      const personnelId = getPersonId(person)
      const consent = consentFromPersonnel(person, (consentByPerson.get(personnelId) as any) || {})
      const branch = branchById.get(person?.branchId || "")
      const department = departmentById.get(person?.departmentId || "")
      const status = consent.status
      return {
        person,
        personnelId,
        branch,
        department,
        device: deviceByPerson.get(personnelId),
        consent,
        status,
      }
    }).filter((row) => {
      const term = searchTerm.toLowerCase()
      const searchable = `${getPersonnelName(row.person)} ${row.person?.registryNo || ""} ${row.person?.personnelCode || ""}`.toLowerCase()
      return (!term || searchable.includes(term)) && (statusFilter === ALL || row.status === statusFilter)
    })
  }, [branchById, consentByPerson, departmentById, deviceByPerson, personnel, searchTerm, statusFilter])

  const documents = React.useMemo(() => {
    return DOCUMENT_TEMPLATES.map((template) => {
      const stored = (kvkkState.documents || []).find((document: any) => document.templateId === template.id)
      return {
        ...template,
        ...stored,
        templateId: template.id,
        title: stored?.title || template.title,
        version: stored?.version || "1.0",
        publishedAt: stored?.publishedAt || "",
        active: stored?.active !== false,
      }
    })
  }, [kvkkState.documents])

  const stats = React.useMemo(() => {
    return {
      total: personnel.length,
      approved: personnel.filter((person) => person?.kvkkAccepted === true).length,
      pending: personnel.filter((person) => person?.kvkkAccepted !== true).length,
      gps: consentRows.filter((row) => row.consent?.gpsConsent).length,
      camera: consentRows.filter((row) => row.consent?.cameraConsent || row.consent?.faceConsent).length,
      device: consentRows.filter((row) => row.consent?.deviceTrackingConsent).length,
      expired: consentRows.filter((row) => row.status === "Expired").length,
    }
  }, [consentRows, personnel.length])

  const upsertConsent = () => {
    if (!selectedRow) return
    const now = Date.now()
    const existing = selectedRow.consent || {}
    const signedAt = consentForm.status === "Approved" ? existing.signedAt || now : existing.signedAt || ""
    const nextConsent = {
      id: existing.id || `consent-${now}-${Math.random().toString(16).slice(2)}`,
      personnelId: selectedRow.personnelId,
      ...consentForm,
      signedAt,
      updatedAt: now,
    }
    const consents = existing.id
      ? kvkkState.consents.map((item: any) => item.id === existing.id ? nextConsent : item)
      : [nextConsent, ...(kvkkState.consents || [])]
    const next = {
      ...kvkkState,
      consents,
      auditLogs: [
        createAudit("KVKK güncelleme", "İK Yöneticisi", getPersonnelName(selectedRow.person), `${getStatusLabel(consentForm.status)} durumuna alındı.`),
        ...(kvkkState.auditLogs || []),
      ],
    }
    persistKvkk(next)
    setIsConsentOpen(false)
    toast({ title: "Başarılı", description: "KVKK onayı güncellendi." })
  }

  const openConsentEdit = (row: any) => {
    setSelectedRow(row)
    setConsentForm({
      status: row.consent?.status || "Pending",
      gpsConsent: Boolean(row.consent?.gpsConsent),
      cameraConsent: Boolean(row.consent?.cameraConsent),
      faceConsent: Boolean(row.consent?.faceConsent),
      deviceTrackingConsent: Boolean(row.consent?.deviceTrackingConsent),
      ipAddress: row.consent?.ipAddress || "",
      deviceId: row.consent?.deviceId || row.device?.deviceId || "",
      digitalSignature: row.consent?.digitalSignature || "",
      expiresAt: row.consent?.expiresAt || "",
    })
    setIsConsentOpen(true)
  }

  const sendRenewal = (row: any) => {
    const next = {
      ...kvkkState,
      auditLogs: [
        createAudit("Yeniden onay gönderildi", "İK Yöneticisi", getPersonnelName(row.person), "KVKK onay yenileme bildirimi hazırlandı."),
        ...(kvkkState.auditLogs || []),
      ],
    }
    persistKvkk(next)
    toast({ title: "Başarılı", description: "Yeniden onay gönderme işlemi kaydedildi." })
  }

  const saveDocument = () => {
    if (!documentForm.title.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Belge adı zorunludur." })
      return
    }
    const now = Date.now()
    const document = {
      id: `doc-${now}-${Math.random().toString(16).slice(2)}`,
      templateId: documentForm.title.toLowerCase().replace(/\s+/g, "-"),
      ...documentForm,
      publishedAt: now,
      createdAt: now,
    }
    const next = {
      ...kvkkState,
      documents: [document, ...(kvkkState.documents || [])],
      auditLogs: [
        createAudit("Belge oluşturuldu", "İK Yöneticisi", document.title, `${document.version} versiyonu yayınlandı.`),
        ...(kvkkState.auditLogs || []),
      ],
    }
    persistKvkk(next)
    setIsDocumentOpen(false)
    setDocumentForm({ title: "", description: "", content: "", version: "1.0", required: true, active: true })
    toast({ title: "Başarılı", description: "Belge oluşturuldu." })
  }

  const exportKvkk = () => {
    const blob = new Blob([JSON.stringify(kvkkState, null, 2)], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "kvkk-uyum-raporu.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const openDetailAfterMenuClose = React.useCallback((row: any) => {
    window.setTimeout(() => setSelectedRow(row), 0)
  }, [])

  const openConsentAfterMenuClose = React.useCallback((row: any) => {
    window.setTimeout(() => openConsentEdit(row), 0)
  }, [openConsentEdit])

  React.useEffect(() => {
    if (selectedRow || isConsentOpen || isDocumentOpen || typeof document === "undefined") return
    const cleanup = window.setTimeout(() => {
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""
      document.body.removeAttribute("data-scroll-locked")
      document.body.removeAttribute("inert")
    }, 50)
    return () => window.clearTimeout(cleanup)
  }, [selectedRow, isConsentOpen, isDocumentOpen])

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_15%_15%,rgba(124,58,237,0.18),transparent_28rem),linear-gradient(135deg,rgba(6,18,36,0.98),rgba(13,30,58,0.94)_55%,rgba(52,33,98,0.92))] p-8 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Enterprise Compliance Center
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Fingerprint className="h-8 w-8 text-sky-300" />
              KVKK Yönetim Merkezi
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              Kişisel veri işleme izinleri, açık rıza süreçleri, konum ve biyometrik onayları merkezi olarak yönetin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={exportKvkk}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="h-11 rounded-2xl bg-white text-primary hover:bg-slate-100 shadow-xl" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Senkronize Et
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <ComplianceKpi title="Toplam Personel" value={stats.total} icon={Users} gradient="from-slate-900 to-blue-900" />
        <ComplianceKpi title="KVKK Onaylayan" value={stats.approved} icon={BadgeCheck} gradient="from-emerald-600 to-teal-900" />
        <ComplianceKpi title="Onay Bekleyen" value={stats.pending} icon={Clock3} gradient="from-amber-500 to-orange-900" />
        <ComplianceKpi title="GPS İzni Veren" value={stats.gps} icon={MapPin} gradient="from-sky-500 to-blue-950" />
        <ComplianceKpi title="Kamera/Yüz Doğrulama Onayı" value={stats.camera} icon={ScanFace} gradient="from-purple-500 to-fuchsia-950" />
        <ComplianceKpi title="Device Tracking Onayı" value={stats.device} icon={Smartphone} gradient="from-indigo-500 to-slate-950" />
        <ComplianceKpi title="Süresi Dolan Onaylar" value={stats.expired} icon={TimerReset} gradient="from-rose-500 to-slate-950" />
      </div>

      <Tabs defaultValue="consents" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            <KvkkTab value="consents" icon={UserCheck} label="KVKK Onayları" />
            <KvkkTab value="documents" icon={FileLock2} label="Açık Rıza Belgeleri" />
            <KvkkTab value="processing" icon={Database} label="Veri İşleme İzinleri" />
            <KvkkTab value="gps" icon={MapPin} label="GPS & Konum Onayları" />
            <KvkkTab value="camera" icon={Camera} label="Kamera / Yüz Tanıma" />
            <KvkkTab value="retention" icon={Layers3} label="Veri Saklama Politikası" />
            <KvkkTab value="audit" icon={History} label="Denetim Logları" />
          </TabsList>
        </div>

        <TabsContent value="consents" className="space-y-5">
          <Card className="premium-card overflow-hidden">
            <CardHeader className="border-b bg-slate-50/40">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Personel KVKK Onayları</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Personel veya sicil ara..." className="h-10 rounded-xl border-slate-200 bg-white pl-10" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Tüm Durumlar</SelectItem>
                      <SelectItem value="Approved">Onaylandı</SelectItem>
                      <SelectItem value="Pending">Bekliyor</SelectItem>
                      <SelectItem value="Rejected">Reddedildi</SelectItem>
                      <SelectItem value="Expired">Süresi Doldu</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={exportKvkk}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="enterprise-table-header">
                  <TableRow>
                    <TableHead className="pl-6">Personel</TableHead>
                    <TableHead>Sicil No</TableHead>
                    <TableHead>Şube</TableHead>
                    <TableHead>Pozisyon</TableHead>
                    <TableHead>KVKK Durumu</TableHead>
                    <TableHead>Onay Tarihi</TableHead>
                    <TableHead>IP Adresi</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Dijital İmza</TableHead>
                    <TableHead>Son Güncelleme</TableHead>
                    <TableHead className="text-right pr-6">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consentRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-72 text-center text-muted-foreground">Kriterlere uygun personel veya KVKK kaydı bulunmuyor.</TableCell>
                    </TableRow>
                  ) : consentRows.map((row) => (
                    <TableRow key={row.personnelId} className="group hover:bg-slate-50/80 transition-all">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={row.person?.avatarUrl} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{getPersonnelName(row.person).slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-primary">{getPersonnelName(row.person)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{row.person?.registryNo || row.person?.personnelCode || row.personnelId}</TableCell>
                      <TableCell className="text-sm">{row.branch ? getBranchName(row.branch) : row.person?.branchId || "-"}</TableCell>
                      <TableCell className="text-sm">{row.person?.position || "-"}</TableCell>
                      <TableCell><ConsentStatusBadge status={row.status} /></TableCell>
                      <TableCell className="text-xs">{row.consent?.signedAt ? formatDateTimeTR(row.consent.signedAt) : "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{row.consent?.ipAddress || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{row.consent?.deviceId || row.device?.deviceId || "-"}</TableCell>
                      <TableCell className="text-xs">{row.consent?.digitalSignature ? "Var" : "-"}</TableCell>
                      <TableCell className="text-xs">{row.consent?.updatedAt ? formatDateTimeTR(row.consent.updatedAt) : "-"}</TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><MoreHorizontal className="h-5 w-5 text-slate-500" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => openDetailAfterMenuClose(row)}><Eye className="mr-3 h-4 w-4 text-slate-400" />Detay Modalı</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openConsentAfterMenuClose(row)}><Edit2 className="mr-3 h-4 w-4 text-slate-400" />Düzenle</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendRenewal(row)}><RefreshCw className="mr-3 h-4 w-4 text-slate-400" />Yeniden Onay Gönder</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-5">
          <div className="flex justify-end">
            <Button className="h-11 rounded-2xl bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20" onClick={() => setIsDocumentOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Belge Oluştur
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((document) => (
              <DocumentCard key={document.templateId} document={document} approvedCount={consentRows.filter((row) => row.status === "Approved").length} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="processing">
          <ProcessingMatrix rows={PROCESSING_ROWS} kvkkState={kvkkState} persistKvkk={persistKvkk} />
        </TabsContent>

        <TabsContent value="gps">
          <GpsPanel rows={consentRows} branchById={branchById} />
        </TabsContent>

        <TabsContent value="camera">
          <CameraPanel rows={consentRows} />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionPolicy rows={RETENTION_ROWS} kvkkState={kvkkState} persistKvkk={persistKvkk} />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogs logs={kvkkState.auditLogs || []} />
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedRow) && !isConsentOpen} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="sm:max-w-[620px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">KVKK Detayı</DialogTitle>
            <DialogDescription className="text-white/80">Personel açık rıza ve veri işleme onay özeti.</DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="p-8 space-y-4">
              <InfoRow label="Personel" value={getPersonnelName(selectedRow.person)} />
              <InfoRow label="KVKK Durumu" value={getStatusLabel(selectedRow.status)} />
              <InfoRow label="GPS İzni" value={selectedRow.consent?.gpsConsent ? "Verildi" : "Yok"} />
              <InfoRow label="Kamera İzni" value={selectedRow.consent?.cameraConsent ? "Verildi" : "Yok"} />
              <InfoRow label="Yüz Doğrulama" value={selectedRow.consent?.faceConsent ? "Aktif" : "Pasif"} />
              <InfoRow label="Device Tracking" value={selectedRow.consent?.deviceTrackingConsent ? "Onaylı" : "Yok"} />
              <InfoRow label="IP Adresi" value={selectedRow.consent?.ipAddress || "-"} />
              <InfoRow label="Dijital İmza" value={selectedRow.consent?.digitalSignature || "-"} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConsentOpen} onOpenChange={setIsConsentOpen}>
        <DialogContent className="sm:max-w-[680px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">KVKK Onayı Düzenle</DialogTitle>
            <DialogDescription className="text-white/80">Personel rıza ve veri işleme izinlerini güncelleyin.</DialogDescription>
          </DialogHeader>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormSelect label="Durum" value={consentForm.status} onChange={(value) => setConsentForm((prev) => ({ ...prev, status: value }))}>
              <SelectItem value="Approved">Onaylandı</SelectItem>
              <SelectItem value="Pending">Bekliyor</SelectItem>
              <SelectItem value="Rejected">Reddedildi</SelectItem>
              <SelectItem value="Expired">Süresi Doldu</SelectItem>
            </FormSelect>
            <FormInput label="IP Adresi" value={consentForm.ipAddress} onChange={(value) => setConsentForm((prev) => ({ ...prev, ipAddress: value }))} />
            <FormInput label="Device ID" value={consentForm.deviceId} onChange={(value) => setConsentForm((prev) => ({ ...prev, deviceId: value }))} />
            <FormInput label="Geçerlilik Bitişi" type="date" value={consentForm.expiresAt} onChange={(value) => setConsentForm((prev) => ({ ...prev, expiresAt: value }))} />
            <div className="md:col-span-2">
              <FormInput label="Dijital İmza" value={consentForm.digitalSignature} onChange={(value) => setConsentForm((prev) => ({ ...prev, digitalSignature: value }))} />
            </div>
            <div className="md:col-span-2 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <ToggleRow title="GPS & Konum Onayı" checked={consentForm.gpsConsent} onCheckedChange={(checked) => setConsentForm((prev) => ({ ...prev, gpsConsent: checked }))} />
              <ToggleRow title="Kamera İzleme Onayı" checked={consentForm.cameraConsent} onCheckedChange={(checked) => setConsentForm((prev) => ({ ...prev, cameraConsent: checked }))} />
              <ToggleRow title="Kamera/Yüz Doğrulama Onayı" checked={consentForm.faceConsent} onCheckedChange={(checked) => setConsentForm((prev) => ({ ...prev, faceConsent: checked }))} />
              <ToggleRow title="Device Tracking Onayı" checked={consentForm.deviceTrackingConsent} onCheckedChange={(checked) => setConsentForm((prev) => ({ ...prev, deviceTrackingConsent: checked }))} />
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsConsentOpen(false)}>Vazgeç</Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={upsertConsent}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDocumentOpen} onOpenChange={setIsDocumentOpen}>
        <DialogContent className="sm:max-w-[760px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">Yeni Belge Oluştur</DialogTitle>
            <DialogDescription className="text-white/80">Açık rıza belgesi ve versiyon bilgisini yayınlayın.</DialogDescription>
          </DialogHeader>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Belge adı" value={documentForm.title} onChange={(value) => setDocumentForm((prev) => ({ ...prev, title: value }))} />
            <FormInput label="Versiyon no" value={documentForm.version} onChange={(value) => setDocumentForm((prev) => ({ ...prev, version: value }))} />
            <div className="md:col-span-2">
              <FormInput label="Açıklama" value={documentForm.description} onChange={(value) => setDocumentForm((prev) => ({ ...prev, description: value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">İçerik editorü</Label>
              <Textarea value={documentForm.content} onChange={(event) => setDocumentForm((prev) => ({ ...prev, content: event.target.value }))} className="min-h-[180px] rounded-2xl border-slate-200" />
            </div>
            <ToggleRow title="Zorunlu mu" checked={documentForm.required} onCheckedChange={(checked) => setDocumentForm((prev) => ({ ...prev, required: checked }))} />
            <ToggleRow title="Aktif/Pasif" checked={documentForm.active} onCheckedChange={(checked) => setDocumentForm((prev) => ({ ...prev, active: checked }))} />
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsDocumentOpen(false)}>Vazgeç</Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={saveDocument}>Yayınla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ComplianceKpi({ title, value, icon: Icon, gradient }: any) {
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

function KvkkTab({ value, icon: Icon, label }: any) {
  return (
    <TabsTrigger value={value} className="rounded-xl px-4 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg">
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </TabsTrigger>
  )
}

function ConsentStatusBadge({ status }: { status: string }) {
  const style = {
    Approved: "bg-green-50 text-green-700 border-green-100",
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
    Rejected: "bg-red-50 text-accent border-red-100",
    Expired: "bg-slate-50 text-slate-600 border-slate-200",
  }[status] || "bg-yellow-50 text-yellow-700 border-yellow-100"
  const Icon = status === "Approved" ? CheckCircle2 : status === "Rejected" ? ShieldX : status === "Expired" ? TimerReset : Clock3
  return <Badge className={cn("font-bold px-3 py-1 rounded-lg", style)}><Icon className="mr-1.5 h-3.5 w-3.5" />{getStatusLabel(status)}</Badge>
}

function DocumentCard({ document, approvedCount }: { document: any; approvedCount: number }) {
  return (
    <Card className="group overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/70 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
      <CardHeader className="border-b bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_16rem)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-lg font-extrabold text-primary">{document.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="font-bold">v{document.version}</Badge>
              <Badge className={document.required ? "bg-red-50 text-accent border-red-100" : "bg-blue-50 text-blue-700 border-blue-100"}>
                {document.required ? "Zorunlu" : "Opsiyonel"}
              </Badge>
            </div>
          </div>
          <FileLock2 className="h-7 w-7 text-violet-500" />
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <InfoCompact label="Yayın tarihi" value={document.publishedAt ? formatDateTimeTR(document.publishedAt) : "-"} />
        <InfoCompact label="Onaylayan personel" value={approvedCount.toString()} />
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" className="rounded-xl">PDF görüntüle</Button>
          <Button variant="outline" className="rounded-xl">Düzenle</Button>
          <Button variant="outline" className="rounded-xl">Yeni versiyon yayınla</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProcessingMatrix({ rows, kvkkState, persistKvkk }: any) {
  const toggleProcessing = (id: string, enabled: boolean) => {
    persistKvkk({ ...kvkkState, processing: { ...(kvkkState.processing || {}), [id]: { enabled } } })
  }
  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="border-b bg-slate-50/40"><CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Veri İşleme Yetki Matrisi</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="enterprise-table-header"><TableRow><TableHead className="pl-6">Veri Başlığı</TableHead><TableHead>İşleniyor mu</TableHead><TableHead>Saklama Süresi</TableHead><TableHead>Yetkili Departman</TableHead><TableHead>Veri Türü</TableHead><TableHead>Risk Seviyesi</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell className="pl-6 font-bold text-primary">{row.name}</TableCell>
                <TableCell><Switch checked={kvkkState.processing?.[row.id]?.enabled !== false} onCheckedChange={(checked) => toggleProcessing(row.id, checked)} /></TableCell>
                <TableCell>{row.retention}</TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.dataType}</TableCell>
                <TableCell><RiskBadge risk={row.risk} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function GpsPanel({ rows }: any) {
  const gpsRows = rows.filter((row: any) => row.consent?.gpsConsent)
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-xl backdrop-blur-xl">
        <CardHeader className="border-b bg-slate-50/40"><CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">GPS & Konum Onayları</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="enterprise-table-header"><TableRow><TableHead className="pl-6">Personel</TableHead><TableHead>GPS İzin Durumu</TableHead><TableHead>Son Konum Paylaşımı</TableHead><TableHead>Aktif Cihaz</TableHead><TableHead>Şube Bağlantısı</TableHead><TableHead>Konum Doğruluğu</TableHead><TableHead>Mobil Giriş Yetkisi</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((row: any) => (
                <TableRow key={row.personnelId}>
                  <TableCell className="pl-6 font-bold text-primary">{getPersonnelName(row.person)}</TableCell>
                  <TableCell>{row.consent?.gpsConsent ? <Badge className="bg-green-50 text-green-700">Aktif</Badge> : <Badge className="bg-slate-50 text-slate-500">Yok</Badge>}</TableCell>
                  <TableCell>{row.consent?.updatedAt ? formatDateTimeTR(row.consent.updatedAt) : "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{row.consent?.deviceId || row.device?.deviceId || "-"}</TableCell>
                  <TableCell>{row.branch ? getBranchName(row.branch) : "-"}</TableCell>
                  <TableCell>{row.consent?.gpsConsent ? "Yüksek" : "-"}</TableCell>
                  <TableCell>{row.consent?.gpsConsent ? "Açık" : "Kapalı"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/70 bg-[#061224] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.28),transparent_16rem),radial-gradient(circle_at_70%_70%,rgba(124,58,237,0.22),transparent_18rem)]" />
        <div className="absolute inset-6 rounded-[28px] border border-cyan-300/20 bg-white/5 backdrop-blur-sm" />
        <div className="relative z-10 p-8 text-white">
          <div className="flex items-center gap-3"><Radar className="h-7 w-7 text-cyan-300" /><h3 className="text-xl font-extrabold">Konum Uyumluluk Haritası</h3></div>
          <p className="mt-2 text-sm text-slate-300">Aktif GPS rızası bulunan personel: {gpsRows.length}</p>
          <div className="mt-14 grid grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-20 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 shadow-lg shadow-cyan-500/10" />)}
          </div>
        </div>
      </Card>
    </div>
  )
}

function CameraPanel({ rows }: any) {
  const camera = rows.filter((row: any) => row.consent?.cameraConsent)
  const face = rows.filter((row: any) => row.consent?.faceConsent)
  const biometric = rows.filter((row: any) => row.consent?.faceConsent || row.consent?.cameraConsent)
  const rejected = rows.filter((row: any) => row.status === "Rejected")
  const expired = rows.filter((row: any) => row.status === "Expired")
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SecurityCard title="Kamera izni verenler" value={camera.length} icon={Camera} />
        <SecurityCard title="Yüz doğrulama aktif kullanıcılar" value={face.length} icon={ScanFace} />
        <SecurityCard title="Biyometrik veri izinleri" value={biometric.length} icon={Fingerprint} />
        <SecurityCard title="Şüpheli reddetmeler" value={rejected.length} icon={ShieldAlert} />
        <SecurityCard title="Expired permissions" value={expired.length} icon={TimerReset} />
      </div>
      <Card className="overflow-hidden rounded-2xl border border-red-200/40 bg-[#130817] shadow-2xl">
        <CardContent className="relative p-8 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)] animate-pulse" />
          <div className="relative z-10 flex items-center gap-4"><Activity className="h-8 w-8 text-fuchsia-300" /><div><h3 className="text-xl font-extrabold">AI Security Consent Monitor</h3><p className="text-sm text-slate-300">Kamera ve biyometrik izinleri yüksek hassasiyetli veri sınıfında izlenir.</p></div></div>
        </CardContent>
      </Card>
    </div>
  )
}

function RetentionPolicy({ rows, kvkkState, persistKvkk }: any) {
  const toggleRetention = (id: string, enabled: boolean) => {
    persistKvkk({ ...kvkkState, retention: { ...(kvkkState.retention || {}), [id]: { autoDelete: enabled } } })
  }
  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="border-b bg-slate-50/40"><CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Veri Saklama Politikası</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="enterprise-table-header"><TableRow><TableHead className="pl-6">Veri tipi</TableHead><TableHead>Saklama süresi</TableHead><TableHead>Otomatik silme</TableHead><TableHead>Arşiv politikası</TableHead><TableHead>Yasal dayanak</TableHead><TableHead>Sorumlu departman</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((row: any) => <TableRow key={row.id}><TableCell className="pl-6 font-bold text-primary">{row.dataType}</TableCell><TableCell>{row.duration}</TableCell><TableCell><Switch checked={kvkkState.retention?.[row.id]?.autoDelete ?? row.autoDelete} onCheckedChange={(checked) => toggleRetention(row.id, checked)} /></TableCell><TableCell>{row.archive}</TableCell><TableCell>{row.legal}</TableCell><TableCell>{row.owner}</TableCell></TableRow>)}</TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function AuditLogs({ logs }: { logs: any[] }) {
  const [dateFilter, setDateFilter] = React.useState("")
  const [userFilter, setUserFilter] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState(ALL)
  const [branchFilter, setBranchFilter] = React.useState("")
  const normalizedLogs = React.useMemo(() => logs.map((log) => normalizeAuditLog(log)), [logs])
  const types = Array.from(new Set(normalizedLogs.map((log) => log.type).filter(Boolean)))
  const filteredLogs = normalizedLogs.filter((log) => {
    const parsedDate = new Date(log.createdAt || 0)
    const logDate = log.createdAt && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : ""
    const userMatch = !userFilter || `${log.actor} ${log.target}`.toLowerCase().includes(userFilter.toLowerCase())
    const dateMatch = !dateFilter || logDate === dateFilter
    const typeMatch = typeFilter === ALL || log.type === typeFilter
    const branchMatch = !branchFilter || `${log.detail} ${log.target}`.toLowerCase().includes(branchFilter.toLowerCase())
    return userMatch && dateMatch && typeMatch && branchMatch
  })

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="border-b bg-slate-50/40">
        <div className="flex flex-col gap-4">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Enterprise Audit Log</CardTitle>
          <div className="grid gap-3 md:grid-cols-4">
            <Input {...DATE_INPUT_PROPS} value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-10 rounded-xl border-slate-200 bg-white" />
            <Input value={userFilter} onChange={(event) => setUserFilter(event.target.value)} placeholder="Kullanıcı ara..." className="h-10 rounded-xl border-slate-200 bg-white" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="İşlem türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tüm İşlemler</SelectItem>
                {types.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} placeholder="Şube filtresi..." className="h-10 rounded-xl border-slate-200 bg-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="enterprise-table-header"><TableRow><TableHead className="pl-6">İşlem Tipi</TableHead><TableHead>Kullanıcı</TableHead><TableHead>Hedef</TableHead><TableHead>IP Adresi</TableHead><TableHead>Device ID</TableHead><TableHead>Tarih/Saat</TableHead><TableHead>Detay</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? <TableRow><TableCell colSpan={7} className="h-72 text-center text-muted-foreground">Henüz denetim logu bulunmuyor.</TableCell></TableRow> : filteredLogs.map((log) => <TableRow key={log.id}><TableCell className="pl-6 font-bold text-primary">{log.type}</TableCell><TableCell>{log.actor}</TableCell><TableCell>{log.target}</TableCell><TableCell className="font-mono text-xs">{log.ipAddress}</TableCell><TableCell className="font-mono text-xs">{log.deviceId}</TableCell><TableCell>{formatDateTimeTR(log.createdAt)}</TableCell><TableCell>{log.detail}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SecurityCard({ title, value, icon: Icon }: any) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#27112f] to-[#050816] text-white shadow-2xl shadow-purple-950/20">
      <CardContent className="relative p-5">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-2xl" />
        <Icon className="relative z-10 h-6 w-6 text-fuchsia-300" />
        <div className="relative z-10 mt-5 text-3xl font-extrabold">{value}</div>
        <p className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-widest text-white/65">{title}</p>
      </CardContent>
    </Card>
  )
}

function RiskBadge({ risk }: { risk: string }) {
  const style = risk === "Kritik" ? "bg-red-50 text-accent" : risk === "Yüksek" ? "bg-orange-50 text-orange-700" : risk === "Orta" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"
  return <Badge className={cn("font-bold", style)}>{risk}</Badge>
}

function FormInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  const inputProps = type === "date" ? DATE_INPUT_PROPS : { type }
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Input {...inputProps} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border-slate-200" /></div>
}

function FormSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>
}

function ToggleRow({ title, checked, onCheckedChange }: { title: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4"><Label className="text-sm font-bold text-slate-700">{title}</Label><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>
}

function InfoCompact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"><span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span><span className="text-sm font-bold text-primary">{value}</span></div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border border-slate-100 bg-white rounded-xl px-4 py-3"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span><span className="text-sm font-semibold text-slate-700 text-right break-all">{value}</span></div>
}
