"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  Smartphone,
  Trash2,
  X,
  XCircle,
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
import { cn } from "@/lib/utils"
import { formatDateTimeTR } from "@/lib/date-time"

const PERSONNEL_KEY = "app_personnel"
const DEVICES_KEY = "app_device_ids"

const PLATFORMS = ["iOS", "Android", "Web"]
const STATUSES = [
  { value: "Active", label: "Aktif" },
  { value: "Pending", label: "Bekliyor" },
  { value: "Blocked", label: "Engelli" },
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

const getPersonnelName = (person: any) => {
  return (
    person?.fullName ||
    [person?.name, person?.surname].filter(Boolean).join(" ") ||
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
    person?.personnelCode ||
    "Personel"
  ).toString()
}

export default function DeviceIdsPage() {
  const { toast } = useToast()
  const [personnel, setPersonnel] = React.useState<any[]>([])
  const [devices, setDevices] = React.useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [selectedDevice, setSelectedDevice] = React.useState<any | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [formData, setFormData] = React.useState({
    personnelId: "",
    deviceId: "",
    deviceName: "",
    platform: "",
    status: "Active",
    description: "",
  })

  React.useEffect(() => {
    setPersonnel(readLocalArray(PERSONNEL_KEY).filter((person: any) => !person?.isDeleted))
    setDevices(readLocalArray(DEVICES_KEY))
  }, [])

  const persistDevices = React.useCallback((next: any[]) => {
    localStorage.setItem(DEVICES_KEY, JSON.stringify(next))
    setDevices(next)
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      personnelId: "",
      deviceId: "",
      deviceName: "",
      platform: "",
      status: "Active",
      description: "",
    })
  }

  const rows = React.useMemo(() => {
    return devices.map((device) => ({
      ...device,
      person: personnel.find((person) => person?.id === device?.personnelId),
    })).filter((device) => statusFilter === "All" || device?.status === statusFilter)
  }, [devices, personnel, statusFilter])

  const stats = React.useMemo(() => {
    return {
      total: devices.length,
      active: devices.filter((device) => device?.status === "Active").length,
      pending: devices.filter((device) => device?.status === "Pending").length,
      blocked: devices.filter((device) => device?.status === "Blocked").length,
    }
  }, [devices])

  const openCreate = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEdit = (device: any) => {
    setEditingId(device?.id || null)
    setFormData({
      personnelId: device?.personnelId || "",
      deviceId: device?.deviceId || "",
      deviceName: device?.deviceName || "",
      platform: device?.platform || "",
      status: device?.status || "Active",
      description: device?.description || "",
    })
    setIsFormOpen(true)
  }

  const openDetailAfterMenuClose = React.useCallback((device: any) => {
    window.setTimeout(() => {
      setSelectedDevice(device)
      setIsDetailOpen(true)
    }, 0)
  }, [])

  const openEditAfterMenuClose = React.useCallback((device: any) => {
    window.setTimeout(() => openEdit(device), 0)
  }, [openEdit])

  React.useEffect(() => {
    if (isFormOpen || isDetailOpen || typeof document === "undefined") return
    const cleanup = window.setTimeout(() => {
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""
      document.body.removeAttribute("data-scroll-locked")
      document.body.removeAttribute("inert")
    }, 50)
    return () => window.clearTimeout(cleanup)
  }, [isFormOpen, isDetailOpen])

  const handleSave = () => {
    if (!formData.personnelId) {
      toast({ variant: "destructive", title: "Hata", description: "Personel seçimi zorunludur." })
      return
    }

    if (!formData.deviceId.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Cihaz ID zorunludur." })
      return
    }

    const normalizedDeviceId = formData.deviceId.trim()
    const duplicate = devices.some((device) => {
      return device?.deviceId?.toLowerCase() === normalizedDeviceId.toLowerCase() && device?.id !== editingId
    })

    if (duplicate) {
      toast({ variant: "destructive", title: "Hata", description: "Bu Cihaz ID zaten tanımlı." })
      return
    }

    const now = Date.now()
    const record = {
      personnelId: formData.personnelId,
      deviceId: normalizedDeviceId,
      deviceName: formData.deviceName.trim(),
      platform: formData.platform || "Android",
      status: formData.status,
      description: formData.description,
      updatedAt: now,
    }

    const next = editingId
      ? devices.map((device) => device?.id === editingId ? { ...device, ...record } : device)
      : [{ id: `device-${now}-${Math.random().toString(16).slice(2)}`, ...record, createdAt: now, lastLoginAt: "" }, ...devices]

    persistDevices(next)
    setIsFormOpen(false)
    resetForm()
    toast({ title: "Başarılı", description: editingId ? "Cihaz kaydı güncellendi." : "Cihaz tanımlandı." })
  }

  const updateDeviceStatus = (deviceId: string, status: string) => {
    const next = devices.map((device) => device?.id === deviceId ? { ...device, status, updatedAt: Date.now() } : device)
    persistDevices(next)
    toast({ title: "Başarılı", description: "Cihaz durumu güncellendi." })
  }

  const approveAllPending = () => {
    const next = devices.map((device) => device?.status === "Pending" ? { ...device, status: "Active", updatedAt: Date.now() } : device)
    persistDevices(next)
    toast({ title: "Başarılı", description: "Bekleyen cihazlar onaylandı." })
  }

  const handleDelete = (deviceId: string) => {
    persistDevices(devices.filter((device) => device?.id !== deviceId))
    toast({ title: "Başarılı", description: "Cihaz kaydı silindi." })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-accent" />
            Cihaz ID Yönetimi
          </h2>
          <p className="text-muted-foreground mt-1">
            Personel cihaz eşleşmelerini ve güvenli giriş kurallarını yönetin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl border-slate-200">
                <Filter className="mr-2 h-4 w-4" />
                Filtrele
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
              <DropdownMenuLabel>Durum filtresi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("All")}>Tüm Cihazlar</DropdownMenuItem>
              {STATUSES.map((status) => (
                <DropdownMenuItem key={status.value} onClick={() => setStatusFilter(status.value)}>
                  {status.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="h-10 rounded-xl border-slate-200 text-green-600" onClick={approveAllPending}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Bekleyenleri Onayla
          </Button>
          <Button className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Cihaz Tanımla
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam Cihaz" value={stats.total} icon={Smartphone} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif Cihaz" value={stats.active} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Bekleyen Onay" value={stats.pending} icon={AlertCircle} color="text-yellow-600" bg="bg-yellow-50" />
        <KPICard title="Engellenen Cihaz" value={stats.blocked} icon={ShieldAlert} color="text-accent" bg="bg-red-50" />
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cihaz Listesi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[360px]">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <Smartphone className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Cihaz kaydı bulunmuyor.</h3>
              <p className="text-muted-foreground max-w-xs mb-6">Yeni cihaz tanımlayarak personel cihaz eşleşmelerini oluşturabilirsiniz.</p>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5" onClick={openCreate}>
                İlk Cihazı Tanımla
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">Personel</TableHead>
                  <TableHead>Sicil No</TableHead>
                  <TableHead>Cihaz ID</TableHead>
                  <TableHead>Cihaz Adı</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Son Giriş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right pr-6">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((device) => (
                  <TableRow key={device.id} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={device.person?.avatarUrl} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {getPersonnelName(device.person).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-primary">{getPersonnelName(device.person)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{device.person?.registryNo || device.person?.personnelCode || "-"}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">{device.deviceId}</TableCell>
                    <TableCell className="text-sm font-semibold text-slate-700">{device.deviceName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold border-slate-200">{device.platform || "-"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{device.lastLoginAt ? formatDateTimeTR(device.lastLoginAt) : "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={device.status} />
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
                          <DropdownMenuItem onSelect={() => openDetailAfterMenuClose(device)}>
                            <Eye className="mr-3 h-4 w-4 text-slate-400" />
                            Detay Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEditAfterMenuClose(device)}>
                            <Smartphone className="mr-3 h-4 w-4 text-slate-400" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-green-600" onClick={() => updateDeviceStatus(device.id, "Active")}>
                            <CheckCircle2 className="mr-3 h-4 w-4" />
                            Onayla
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-accent" onClick={() => updateDeviceStatus(device.id, "Blocked")}>
                            <ShieldAlert className="mr-3 h-4 w-4" />
                            Engelle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-accent" onClick={() => handleDelete(device.id)}>
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
        <DialogContent className="sm:max-w-[640px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">{editingId ? "Cihazı Düzenle" : "Yeni Cihaz Tanımla"}</DialogTitle>
            <DialogDescription className="text-white/80">Personel cihaz eşleştirmesini tanımlayın.</DialogDescription>
          </DialogHeader>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Personel seç</Label>
              <Select value={formData.personnelId} onValueChange={(value) => setFormData((prev) => ({ ...prev, personnelId: value }))}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Personel seçin" />
                </SelectTrigger>
                <SelectContent>
                  {personnel.length > 0 ? (
                    personnel.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {getPersonnelName(person)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-personnel" disabled>Kayıtlı personel yok</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Cihaz ID</Label>
              <Input
                value={formData.deviceId}
                onChange={(event) => setFormData((prev) => ({ ...prev, deviceId: event.target.value }))}
                placeholder="örn. A1B2-C3D4"
                className="rounded-xl h-11 border-slate-200 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Cihaz Adı</Label>
              <Input
                value={formData.deviceName}
                onChange={(event) => setFormData((prev) => ({ ...prev, deviceName: event.target.value }))}
                placeholder="örn. Ahmet iPhone"
                className="rounded-xl h-11 border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Platform</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Platform seçin" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Durum</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Cihaz hakkında not ekleyin..."
                className="rounded-xl border-slate-200 min-h-[100px] resize-none"
              />
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
        <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">Cihaz Detayı</SheetTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="rounded-full h-8 w-8 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription>Seçilen cihaz eşleşmesine ait bilgiler.</SheetDescription>
            </SheetHeader>
            <div className="p-8 space-y-4">
              {selectedDevice && (
                <>
                  <InfoRow label="Personel" value={getPersonnelName(selectedDevice.person)} />
                  <InfoRow label="Sicil No" value={selectedDevice.person?.registryNo || selectedDevice.person?.personnelCode || "-"} />
                  <InfoRow label="Cihaz ID" value={selectedDevice.deviceId || "-"} />
                  <InfoRow label="Cihaz Adı" value={selectedDevice.deviceName || "-"} />
                  <InfoRow label="Platform" value={selectedDevice.platform || "-"} />
                  <InfoRow label="Son Giriş" value={selectedDevice.lastLoginAt ? formatDateTimeTR(selectedDevice.lastLoginAt) : "-"} />
                  <InfoRow label="Durum" value={getStatusLabel(selectedDevice.status)} />
                  <InfoRow label="Açıklama" value={selectedDevice.description || "-"} />
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
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

function getStatusLabel(status: string) {
  if (status === "Active") return "Aktif"
  if (status === "Pending") return "Bekliyor"
  if (status === "Blocked") return "Engelli"
  return status || "-"
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Active") {
    return <Badge className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1 rounded-lg">Aktif</Badge>
  }
  if (status === "Pending") {
    return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-100 font-bold px-3 py-1 rounded-lg">Bekliyor</Badge>
  }
  return <Badge className="bg-red-50 text-accent border-red-100 font-bold px-3 py-1 rounded-lg">Engelli</Badge>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-slate-100 bg-white rounded-xl px-4 py-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-slate-700 text-right break-all">{value}</span>
    </div>
  )
}
