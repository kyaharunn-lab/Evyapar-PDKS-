"use client"

import * as React from "react"
import {
  CheckCircle2,
  Download,
  Edit2,
  Eye,
  Filter,
  LogIn,
  LogOut,
  MoreHorizontal,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  X,
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { formatDateTimeTR } from "@/lib/date-time"
import { cn } from "@/lib/utils"

const BRANCHES_KEY = "app_branches"
const QR_POINTS_KEY = "app_qr_points"

const POINT_TYPES = [
  { value: "Entry", label: "Giriş" },
  { value: "Exit", label: "Çıkış" },
  { value: "EntryExit", label: "Giriş / Çıkış" },
  { value: "Warehouse", label: "Depo" },
  { value: "Field", label: "Saha" },
]

const VALIDITY_OPTIONS = [
  { value: "Unlimited", label: "Süresiz" },
  { value: "Daily", label: "Günlük" },
  { value: "Weekly", label: "Haftalık" },
  { value: "Monthly", label: "Aylık" },
]

const STATUS_OPTIONS = [
  { value: "Active", label: "Aktif" },
  { value: "Passive", label: "Pasif" },
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

const getBranchId = (branch: any) => (branch?.id || branch?.branchCode || branch?.code || "").toString()

const getBranchName = (branch: any) => {
  return (branch?.branchName || branch?.name || branch?.title || branch?.branchCode || "Şube").toString()
}

const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  return options.find((option) => option.value === value)?.label || value || "-"
}

const createQrCodeValue = (existing: any[] = []) => {
  const existingValues = new Set(existing.map((item) => item?.qrCode).filter(Boolean))

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase()
    const timePart = Date.now().toString(36).toUpperCase()
    const value = `EVY-QR-${timePart}-${randomPart}`

    if (!existingValues.has(value)) return value
  }

  return `EVY-QR-${crypto.randomUUID().toUpperCase()}`
}

const initialForm = {
  pointName: "",
  branchId: "",
  pointType: "Entry",
  qrCode: "",
  validity: "Unlimited",
  locationRequired: true,
  status: "Active",
}

export default function QrPointsPage() {
  const { toast } = useToast()
  const [branches, setBranches] = React.useState<any[]>([])
  const [qrPoints, setQrPoints] = React.useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [selectedPoint, setSelectedPoint] = React.useState<any | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [typeFilter, setTypeFilter] = React.useState("All")
  const [formData, setFormData] = React.useState(initialForm)

  React.useEffect(() => {
    setBranches(readLocalArray(BRANCHES_KEY))
    setQrPoints(readLocalArray(QR_POINTS_KEY))
  }, [])

  const persistQrPoints = React.useCallback((next: any[]) => {
    localStorage.setItem(QR_POINTS_KEY, JSON.stringify(next))
    setQrPoints(next)
  }, [])

  const branchById = React.useMemo(() => {
    return new Map(branches.map((branch) => [getBranchId(branch), branch]))
  }, [branches])

  const rows = React.useMemo(() => {
    return qrPoints
      .map((point) => ({
        ...point,
        branch: branchById.get(point?.branchId),
      }))
      .filter((point) => statusFilter === "All" || point?.status === statusFilter)
      .filter((point) => typeFilter === "All" || point?.pointType === typeFilter)
      .sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0))
  }, [branchById, qrPoints, statusFilter, typeFilter])

  const stats = React.useMemo(() => {
    return {
      total: qrPoints.length,
      active: qrPoints.filter((point) => point?.status === "Active").length,
      entry: qrPoints.filter((point) => point?.pointType === "Entry" || point?.pointType === "EntryExit").length,
      exit: qrPoints.filter((point) => point?.pointType === "Exit" || point?.pointType === "EntryExit").length,
    }
  }, [qrPoints])

  const resetForm = React.useCallback(() => {
    setEditingId(null)
    setFormData({
      ...initialForm,
      qrCode: createQrCodeValue(qrPoints),
    })
  }, [qrPoints])

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      ...initialForm,
      qrCode: createQrCodeValue(qrPoints),
    })
    setIsFormOpen(true)
  }

  const openEdit = (point: any) => {
    setEditingId(point?.id || null)
    setFormData({
      pointName: point?.pointName || "",
      branchId: point?.branchId || "",
      pointType: point?.pointType || "Entry",
      qrCode: point?.qrCode || createQrCodeValue(qrPoints),
      validity: point?.validity || "Unlimited",
      locationRequired: point?.locationRequired !== false,
      status: point?.status || "Active",
    })
    setIsFormOpen(true)
  }

  const handleSave = () => {
    if (!formData.pointName.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Nokta adı zorunludur." })
      return
    }

    if (!formData.branchId) {
      toast({ variant: "destructive", title: "Hata", description: "Şube seçimi zorunludur." })
      return
    }

    const qrCode = formData.qrCode || createQrCodeValue(qrPoints)
    const duplicate = qrPoints.some((point) => point?.qrCode === qrCode && point?.id !== editingId)

    if (duplicate) {
      toast({ variant: "destructive", title: "Hata", description: "QR kod benzersiz olmalıdır." })
      setFormData((prev) => ({ ...prev, qrCode: createQrCodeValue(qrPoints) }))
      return
    }

    const now = Date.now()
    const record = {
      pointName: formData.pointName.trim(),
      branchId: formData.branchId,
      pointType: formData.pointType,
      qrCode,
      validity: formData.validity,
      locationRequired: formData.locationRequired,
      status: formData.status,
      updatedAt: now,
    }

    const next = editingId
      ? qrPoints.map((point) => point?.id === editingId ? { ...point, ...record } : point)
      : [{ id: `qr-point-${now}-${Math.random().toString(16).slice(2)}`, ...record, createdAt: now, lastUsedAt: "" }, ...qrPoints]

    persistQrPoints(next)
    setIsFormOpen(false)
    resetForm()
    toast({ title: "Başarılı", description: editingId ? "QR noktası güncellendi." : "QR noktası oluşturuldu." })
  }

  const renewQrCode = (pointId: string) => {
    const next = qrPoints.map((point) => {
      if (point?.id !== pointId) return point
      return { ...point, qrCode: createQrCodeValue(qrPoints), updatedAt: Date.now() }
    })
    persistQrPoints(next)
    toast({ title: "Başarılı", description: "QR kod yenilendi." })
  }

  const deactivatePoint = (pointId: string) => {
    const next = qrPoints.map((point) => point?.id === pointId ? { ...point, status: "Passive", updatedAt: Date.now() } : point)
    persistQrPoints(next)
    toast({ title: "Başarılı", description: "QR noktası pasifleştirildi." })
  }

  const deletePoint = (pointId: string) => {
    persistQrPoints(qrPoints.filter((point) => point?.id !== pointId))
    toast({ title: "Başarılı", description: "QR noktası silindi." })
  }

  const exportQrPoints = () => {
    const blob = new Blob([JSON.stringify(qrPoints, null, 2)], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "evyapar-qr-noktalari.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <QrCode className="h-8 w-8 text-accent" />
            QR Noktaları
          </h2>
          <p className="text-muted-foreground mt-1">Şube bazlı QR giriş/çıkış noktalarını yönetin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl border-slate-200">
                <Filter className="mr-2 h-4 w-4" />
                Filtrele
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
              <DropdownMenuLabel>Durum</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter("All")}>Tüm Durumlar</DropdownMenuItem>
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuItem key={status.value} onClick={() => setStatusFilter(status.value)}>
                  {status.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Nokta Türü</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTypeFilter("All")}>Tüm Türler</DropdownMenuItem>
              {POINT_TYPES.map((type) => (
                <DropdownMenuItem key={type.value} onClick={() => setTypeFilter(type.value)}>
                  {type.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="h-10 rounded-xl border-slate-200" onClick={exportQrPoints}>
            <Download className="mr-2 h-4 w-4" />
            QR Dışa Aktar
          </Button>
          <Button className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni QR Noktası
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam QR Noktası" value={stats.total} icon={QrCode} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif QR Noktası" value={stats.active} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Giriş Noktası" value={stats.entry} icon={LogIn} color="text-blue-600" bg="bg-blue-50" />
        <KPICard title="Çıkış Noktası" value={stats.exit} icon={LogOut} color="text-orange-600" bg="bg-orange-50" />
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">QR Noktası Listesi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[360px]">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <QrCode className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">QR noktası bulunmuyor.</h3>
              <p className="text-muted-foreground max-w-xs mb-6">Şube giriş/çıkışları için ilk QR noktasını tanımlayın.</p>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5" onClick={openCreate}>
                İlk QR Noktasını Tanımla
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">QR Noktası Adı</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>Nokta Türü</TableHead>
                  <TableHead>QR Kodu</TableHead>
                  <TableHead>Geçerlilik Süresi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right pr-6">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((point) => (
                  <TableRow key={point.id} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6 font-bold text-primary">{point.pointName}</TableCell>
                    <TableCell className="text-sm font-semibold text-slate-700">{point.branch ? getBranchName(point.branch) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold border-slate-200">
                        {getOptionLabel(POINT_TYPES, point.pointType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600 max-w-[220px] truncate">{point.qrCode}</TableCell>
                    <TableCell className="text-sm text-slate-600">{getOptionLabel(VALIDITY_OPTIONS, point.validity)}</TableCell>
                    <TableCell>
                      <StatusBadge status={point.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <MoreHorizontal className="h-5 w-5 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectedPoint(point); setIsDetailOpen(true) }}>
                            <Eye className="mr-3 h-4 w-4 text-slate-400" />
                            Detay Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(point)}>
                            <Edit2 className="mr-3 h-4 w-4 text-slate-400" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => renewQrCode(point.id)}>
                            <RefreshCw className="mr-3 h-4 w-4 text-slate-400" />
                            QR Yenile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deactivatePoint(point.id)}>
                            <XCircle className="mr-3 h-4 w-4 text-accent" />
                            Pasifleştir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-accent" onClick={() => deletePoint(point.id)}>
                            <Trash2 className="mr-3 h-4 w-4" />
                            Sil
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

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[680px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">{editingId ? "QR Noktasını Düzenle" : "Yeni QR Noktası"}</DialogTitle>
            <DialogDescription className="text-white/80">Şube bazlı QR giriş/çıkış noktasını tanımlayın.</DialogDescription>
          </DialogHeader>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Nokta Adı</Label>
              <Input
                value={formData.pointName}
                onChange={(event) => setFormData((prev) => ({ ...prev, pointName: event.target.value }))}
                placeholder="Örn: Merkez giriş turnikesi"
                className="rounded-xl h-11 border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Şube seç</Label>
              <Select value={formData.branchId} onValueChange={(value) => setFormData((prev) => ({ ...prev, branchId: value }))}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Şube seçin" />
                </SelectTrigger>
                <SelectContent>
                  {branches.length > 0 ? (
                    branches.map((branch) => {
                      const value = getBranchId(branch)
                      if (!value) return null
                      return (
                        <SelectItem key={value} value={value}>
                          {getBranchName(branch)}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="no-branches" disabled>Kayıtlı şube yok</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Nokta Türü</Label>
              <Select value={formData.pointType} onValueChange={(value) => setFormData((prev) => ({ ...prev, pointType: value }))}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Nokta türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {POINT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Geçerlilik süresi</Label>
              <Select value={formData.validity} onValueChange={(value) => setFormData((prev) => ({ ...prev, validity: value }))}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Geçerlilik seçin" />
                </SelectTrigger>
                <SelectContent>
                  {VALIDITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">QR Kod değeri</Label>
              <div className="flex gap-2">
                <Input value={formData.qrCode} readOnly className="rounded-xl h-11 border-slate-200 bg-slate-50 font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200"
                  onClick={() => setFormData((prev) => ({ ...prev, qrCode: createQrCodeValue(qrPoints) }))}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 md:col-span-2 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-slate-700">Konum zorunlu mu</Label>
                <p className="text-[10px] text-slate-400 font-medium">QR okutulduğunda konum kontrolü uygulanır.</p>
              </div>
              <Switch
                checked={formData.locationRequired}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, locationRequired: checked }))}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Durum</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsFormOpen(false)}>
              Vazgeç
            </Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleSave}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[540px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">QR Noktası Detayı</SheetTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="rounded-full h-8 w-8 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription>Seçilen QR noktasına ait bilgiler.</SheetDescription>
            </SheetHeader>
            <div className="p-8 space-y-4">
              {selectedPoint && (
                <>
                  <InfoRow label="QR noktası bilgileri" value={`${selectedPoint.pointName || "-"} · ${getOptionLabel(POINT_TYPES, selectedPoint.pointType)}`} />
                  <InfoRow label="Şube bilgisi" value={selectedPoint.branch ? getBranchSummary(selectedPoint.branch) : "-"} />
                  <InfoRow label="QR kod değeri" value={selectedPoint.qrCode || "-"} />
                  <InfoRow label="Geçerlilik süresi" value={getOptionLabel(VALIDITY_OPTIONS, selectedPoint.validity)} />
                  <InfoRow label="Konum zorunlu" value={selectedPoint.locationRequired ? "Evet" : "Hayır"} />
                  <InfoRow label="Oluşturulma tarihi" value={selectedPoint.createdAt ? formatDateTimeTR(selectedPoint.createdAt) : "-"} />
                  <InfoRow label="Son kullanım tarihi" value={selectedPoint.lastUsedAt ? formatDateTimeTR(selectedPoint.lastUsedAt) : "-"} />
                  <InfoRow label="Durum" value={getOptionLabel(STATUS_OPTIONS, selectedPoint.status)} />
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function getBranchSummary(branch: any) {
  const parts = [
    getBranchName(branch),
    branch?.branchCode || branch?.code,
    [branch?.city, branch?.district].filter(Boolean).join(" / "),
  ].filter(Boolean)

  return parts.join(" · ") || "-"
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
  return status === "Active" ? (
    <Badge className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1 rounded-lg">
      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
      Aktif
    </Badge>
  ) : (
    <Badge className="bg-red-50 text-accent border-red-100 font-bold px-3 py-1 rounded-lg">
      <XCircle className="mr-1.5 h-3.5 w-3.5" />
      Pasif
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
