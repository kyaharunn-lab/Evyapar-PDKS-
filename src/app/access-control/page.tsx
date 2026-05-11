"use client"

import * as React from "react"
import {
  Lock,
  Users,
  ShieldCheck,
  Smartphone,
  Monitor,
  MoreHorizontal,
  Edit2,
  CheckCircle2,
  XCircle,
  UserCog,
} from "lucide-react"

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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const PERSONNEL_KEY = "app_personnel"
const ROLES_KEYS = ["app_roles", "evyapar_pdks_roles_local_v1"]
const ACCESS_KEY = "app_access_control"

const readLocalArray = (keys: string[]) => {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // ignore corrupted local data
    }
  }
  return []
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

const getRoleId = (role: any) => (role?.id || role?.roleCode || role?.code || "").toString()
const getRoleName = (role: any) => (role?.roleName || role?.name || role?.roleCode || "Rol").toString()

export default function AccessControlPage() {
  const { toast } = useToast()
  const [personnel, setPersonnel] = React.useState<any[]>([])
  const [roles, setRoles] = React.useState<any[]>([])
  const [accessRecords, setAccessRecords] = React.useState<any[]>([])
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    personnelId: "",
    roleId: "",
    panelAccess: false,
    mobileAccess: true,
    status: "Active",
  })

  const loadData = React.useCallback(() => {
    setPersonnel(readLocalArray([PERSONNEL_KEY]).filter((person: any) => !person?.isDeleted))
    setRoles(readLocalArray(ROLES_KEYS))
    setAccessRecords(readLocalArray([ACCESS_KEY]))
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const persistAccess = React.useCallback((next: any[]) => {
    localStorage.setItem(ACCESS_KEY, JSON.stringify(next))
    setAccessRecords(next)
  }, [])

  const getRoleLabel = React.useCallback((roleId: string) => {
    if (!roleId) return "-"
    const role = roles.find((item) => getRoleId(item) === roleId)
    return role ? getRoleName(role) : roleId
  }, [roles])

  const rows = React.useMemo(() => {
    return personnel.map((person) => {
      const record = accessRecords.find((item) => item?.personnelId === person?.id)
      return {
        personnel: person,
        personnelId: person?.id,
        roleId: record?.roleId || person?.role || "",
        panelAccess: typeof record?.panelAccess === "boolean" ? record.panelAccess : Boolean(person?.hasAdminAccess),
        mobileAccess: typeof record?.mobileAccess === "boolean" ? record.mobileAccess : person?.hasMobileAccess !== false,
        status: record?.status || (person?.status === "Inactive" ? "Inactive" : "Active"),
        updatedAt: record?.updatedAt,
      }
    })
  }, [accessRecords, personnel])

  const stats = React.useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((row) => row.status === "Active").length,
      inactive: rows.filter((row) => row.status !== "Active").length,
      admin: rows.filter((row) => row.panelAccess && /admin|yönetici|yonetici/i.test(getRoleLabel(row.roleId))).length,
    }
  }, [getRoleLabel, rows])

  const openEdit = (row?: any) => {
    setFormData({
      personnelId: row?.personnelId || "",
      roleId: row?.roleId || "",
      panelAccess: Boolean(row?.panelAccess),
      mobileAccess: row?.mobileAccess !== false,
      status: row?.status || "Active",
    })
    setIsEditOpen(true)
  }

  const upsertAccess = (patch: Partial<typeof formData> & { personnelId: string }) => {
    const now = Date.now()
    const existing = accessRecords.find((item) => item?.personnelId === patch.personnelId)
    const base = rows.find((row) => row.personnelId === patch.personnelId)
    const nextRecord = {
      id: existing?.id || `access-${now}-${Math.random().toString(16).slice(2)}`,
      personnelId: patch.personnelId,
      roleId: patch.roleId ?? existing?.roleId ?? base?.roleId ?? "",
      panelAccess: patch.panelAccess ?? existing?.panelAccess ?? base?.panelAccess ?? false,
      mobileAccess: patch.mobileAccess ?? existing?.mobileAccess ?? base?.mobileAccess ?? true,
      status: patch.status ?? existing?.status ?? base?.status ?? "Active",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }

    const next = existing
      ? accessRecords.map((item) => item.personnelId === patch.personnelId ? nextRecord : item)
      : [nextRecord, ...accessRecords]

    persistAccess(next)
  }

  const handleSave = () => {
    if (!formData.personnelId) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel seçimi zorunludur.",
      })
      return
    }

    upsertAccess(formData)
    setIsEditOpen(false)
    toast({
      title: "Başarılı",
      description: "Erişim ayarları kaydedildi.",
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Lock className="h-8 w-8 text-accent" />
            Erişim Kontrolü
          </h2>
          <p className="text-muted-foreground mt-1">
            Kullanıcıların panel ve mobil uygulama erişim izinlerini yönetin.
          </p>
        </div>
        <Button
          onClick={() => openEdit()}
          className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
        >
          <UserCog className="mr-2 h-4 w-4" />
          Erişimi Düzenle
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam Kullanıcı" value={stats.total} icon={Users} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif Erişim" value={stats.active} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Pasif Erişim" value={stats.inactive} icon={XCircle} color="text-accent" bg="bg-red-50" />
        <KPICard title="Admin Yetkili" value={stats.admin} icon={ShieldCheck} color="text-blue-600" bg="bg-blue-50" />
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Erişim Listesi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[360px]">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <Lock className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Kayıt bulunmuyor.</h3>
              <p className="text-muted-foreground max-w-xs">Personel kaydı oluşturulduğunda erişim listesi burada görünecektir.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">Personel</TableHead>
                  <TableHead>Yetki Rolü</TableHead>
                  <TableHead>Panel Erişimi</TableHead>
                  <TableHead>Mobil Erişim</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right pr-6">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.personnelId} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={row.personnel?.avatarUrl} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {getPersonnelName(row.personnel).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{getPersonnelName(row.personnel)}</span>
                          <span className="text-[10px] font-mono text-slate-400">{row.personnel?.registryNo || row.personnel?.personnelCode || "-"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-700">{getRoleLabel(row.roleId)}</TableCell>
                    <TableCell>
                      <AccessBadge enabled={row.panelAccess} icon={Monitor} />
                    </TableCell>
                    <TableCell>
                      <AccessBadge enabled={row.mobileAccess} icon={Smartphone} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => openEdit(row)}>
                            <Edit2 className="mr-3 h-4 w-4 text-slate-400" />
                            Erişimi Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => upsertAccess({ personnelId: row.personnelId, panelAccess: !row.panelAccess })}>
                            <Monitor className="mr-3 h-4 w-4 text-slate-400" />
                            Panel erişimini {row.panelAccess ? "kapat" : "aç"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => upsertAccess({ personnelId: row.personnelId, mobileAccess: !row.mobileAccess })}>
                            <Smartphone className="mr-3 h-4 w-4 text-slate-400" />
                            Mobil erişimi {row.mobileAccess ? "kapat" : "aç"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => upsertAccess({ personnelId: row.personnelId, status: row.status === "Active" ? "Inactive" : "Active" })}>
                            {row.status === "Active" ? <XCircle className="mr-3 h-4 w-4 text-accent" /> : <CheckCircle2 className="mr-3 h-4 w-4 text-green-600" />}
                            Durumu {row.status === "Active" ? "pasif yap" : "aktif yap"}
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[620px] rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">Erişimi Düzenle</DialogTitle>
            <DialogDescription className="text-white/80">Panel ve mobil erişim izinlerini güncelleyin.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
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
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Rol seç</Label>
              <Select value={formData.roleId} onValueChange={(value) => setFormData((prev) => ({ ...prev, roleId: value }))}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  {roles.length > 0 ? (
                    roles.map((role) => {
                      const value = getRoleId(role)
                      if (!value) return null
                      return (
                        <SelectItem key={value} value={value}>
                          {getRoleName(role)}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="no-roles" disabled>Kayıtlı rol yok</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 space-y-4">
              <ToggleRow
                title="Panel erişimi"
                description="Personelin yönetim paneline giriş izni."
                checked={formData.panelAccess}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, panelAccess: checked }))}
              />
              <ToggleRow
                title="Mobil erişim"
                description="Personelin mobil uygulamayı kullanma izni."
                checked={formData.mobileAccess}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, mobileAccess: checked }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Durum seç</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Aktif</SelectItem>
                  <SelectItem value="Inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="rounded-xl" onClick={() => setIsEditOpen(false)}>
              Vazgeç
            </Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleSave}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function AccessBadge({ enabled, icon: Icon }: { enabled: boolean; icon: any }) {
  return (
    <Badge className={cn(
      "font-bold border px-3 py-1 rounded-lg",
      enabled ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-500 border-slate-200"
    )}>
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {enabled ? "Açık" : "Kapalı"}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  return status === "Active" ? (
    <Badge className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1 rounded-lg">Aktif</Badge>
  ) : (
    <Badge className="bg-red-50 text-accent border-red-100 font-bold px-3 py-1 rounded-lg">Pasif</Badge>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-bold text-slate-700">{title}</Label>
        <p className="text-[10px] text-slate-400 font-medium">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
