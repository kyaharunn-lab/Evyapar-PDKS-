"use client"

import * as React from "react"
import { 
  Users2, 
  Plus, 
  Filter, 
  CheckCircle2, 
  UserCircle2, 
  Building2,
  FolderTree,
  Settings2,
  Globe,
  MapPin,
  Clock,
  Info,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function DepartmentsPage() {
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [localBranches, setLocalBranches] = React.useState<any[]>([])
  const [localPersonnel, setLocalPersonnel] = React.useState<any[]>([])
  const [departments, setDepartments] = React.useState<any[]>([])
  const [editingDeptId, setEditingDeptId] = React.useState<string | null>(null)
  const [selectedDept, setSelectedDept] = React.useState<any | null>(null)

  // Form state
  const [deptName, setDeptName] = React.useState("")
  const [deptCode, setDeptCode] = React.useState("")
  const [deptBranchId, setDeptBranchId] = React.useState("")
  const [deptManagerId, setDeptManagerId] = React.useState("none")
  const [deptStatus, setDeptStatus] = React.useState("active")

  const DEPARTMENTS_STORAGE_KEY = "app_departments"
  const PERSONNEL_STORAGE_KEY = "app_personnel"

  React.useEffect(() => {
    const readBranchesFromLocalStorage = () => {
      const keysToTry = ["app_branches", "evyapar_pdks_branches_local_v1"];
      for (const key of keysToTry) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore and continue
        }
      }
      return [];
    };

    setLocalBranches(readBranchesFromLocalStorage());
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(PERSONNEL_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setLocalPersonnel(parsed)
    } catch {
      // ignore corrupted local data
    }
  }, [])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setDepartments(parsed)
    } catch {
      // ignore corrupted local data
    }
  }, [])

  const persistDepartments = React.useCallback((next: any[]) => {
    try {
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }, [])

  const getBranchLabel = React.useCallback((branchId: string | undefined) => {
    if (!branchId) return "-"
    const match = localBranches.find((b) => (b?.id || b?.branchCode) === branchId)
    return match?.branchName || match?.name || branchId
  }, [localBranches])

  const getManagerLabel = React.useCallback((managerId: string | undefined) => {
    if (!managerId) return "Henüz Atanmadı"
    const normalizedManager = managerId.toString().trim().toLowerCase()
    const match = localPersonnel.find((p) => {
      const fullName = p?.fullName || [p?.name, p?.surname].filter(Boolean).join(" ")
      return [p?.id, p?.personnelCode, p?.registryNo, fullName].filter(Boolean).some((value) => value.toString().trim().toLowerCase() === normalizedManager)
    })
    const fullName = match?.fullName || [match?.name, match?.surname].filter(Boolean).join(" ")
    return fullName || match?.personnelCode || managerId
  }, [localPersonnel])

  const normalizeRelationValue = React.useCallback((value: any) => {
    if (!value) return ""
    if (typeof value === "object") {
      return normalizeRelationValue(value.id || value.departmentId || value.departmentCode || value.code || value.departmentName || value.name || value.title || value.fullName)
    }
    return value.toString().trim().toLowerCase()
  }, [])

  const isManagerAssigned = React.useCallback((dept: any) => {
    const managerValue = dept?.managerId || dept?.managerName || dept?.manager
    if (!managerValue || managerValue === "none") return false
    return Boolean(normalizeRelationValue(managerValue))
  }, [normalizeRelationValue])

  const getPersonnelCountForDept = React.useCallback((dept: any) => {
    const deptKeys = [
      dept?.id,
      dept?.departmentId,
      dept?.departmentCode,
      dept?.code,
      dept?.departmentName,
      dept?.name,
      dept?.title,
    ].map(normalizeRelationValue).filter(Boolean)
    if (deptKeys.length === 0) return 0
    const list = Array.isArray(localPersonnel) ? localPersonnel : []
    return list.filter((p) => {
      if (p?.isDeleted) return false
      const personDeptKeys = [
        p?.departmentId,
        p?.department,
        p?.departmentName,
      ].map(normalizeRelationValue).filter(Boolean)
      return personDeptKeys.some((key) => deptKeys.includes(key))
    }).length
  }, [localPersonnel, normalizeRelationValue])

  const totalDepartmentPersonnel = React.useMemo(() => {
    return departments.reduce((total, dept) => total + getPersonnelCountForDept(dept), 0)
  }, [departments, getPersonnelCountForDept])

  const assignedManagerCount = React.useMemo(() => {
    return departments.filter(isManagerAssigned).length
  }, [departments, isManagerAssigned])

  const resetForm = React.useCallback(() => {
    setDeptName("")
    setDeptCode("")
    setDeptBranchId("")
    setDeptManagerId("none")
    setDeptStatus("active")
    setEditingDeptId(null)
  }, [])

  const handleSaveDepartment = React.useCallback(() => {
    if (!deptName.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Departman adı zorunludur.",
      })
      return
    }
    if (!deptCode.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Departman kodu zorunludur.",
      })
      return
    }

    const now = Date.now()
    const managerId = deptManagerId && deptManagerId !== "none" ? deptManagerId : undefined
    const nextDeptBase = {
      departmentName: deptName.trim(),
      departmentCode: deptCode.trim(),
      branchId: deptBranchId || undefined,
      managerId,
      status: deptStatus === "active" ? "Active" : "Inactive",
    }

    setDepartments((prev) => {
      const list = Array.isArray(prev) ? prev : []
      if (editingDeptId) {
        const idx = list.findIndex((d) => d?.id === editingDeptId)
        if (idx >= 0) {
          const updated = { ...list[idx], ...nextDeptBase, updatedAt: now }
          const next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
          persistDepartments(next)
          return next
        }
      }

      const createdAt = now
      const newDept = {
        id: `dept-${createdAt}-${Math.random().toString(16).slice(2)}`,
        ...nextDeptBase,
        createdAt,
      }
      const next = [newDept, ...list]
      persistDepartments(next)
      return next
    })

    setIsCreateOpen(false)
    resetForm()
    toast({
      title: "Başarılı",
      description: editingDeptId ? "Departman güncellendi." : "Departman oluşturuldu.",
    })
  }, [deptBranchId, deptCode, deptManagerId, deptName, deptStatus, editingDeptId, persistDepartments, resetForm, toast])

  const handleEdit = React.useCallback((dept: any) => {
    setEditingDeptId(dept?.id || null)
    setDeptName(dept?.departmentName || "")
    setDeptCode(dept?.departmentCode || "")
    setDeptBranchId(dept?.branchId || "")
    setDeptManagerId(dept?.managerId || "none")
    setDeptStatus(dept?.status === "Inactive" ? "inactive" : "active")
    setIsCreateOpen(true)
  }, [])

  const handleDelete = React.useCallback((dept: any) => {
    if (!dept?.id) return
    setDepartments((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const next = list.filter((d) => d?.id !== dept.id)
      persistDepartments(next)
      return next
    })
    toast({ title: "Başarılı", description: "Departman silindi." })
  }, [persistDepartments, toast])

  const handleDeactivate = React.useCallback((dept: any) => {
    if (!dept?.id) return
    setDepartments((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const idx = list.findIndex((d) => d?.id === dept.id)
      if (idx < 0) return list
      const updated = { ...list[idx], status: "Inactive", updatedAt: Date.now() }
      const next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
      persistDepartments(next)
      return next
    })
    toast({ title: "Başarılı", description: "Departman pasifleştirildi." })
  }, [persistDepartments, toast])

  const handleOpenDetail = React.useCallback((dept: any) => {
    setSelectedDept(dept)
    setIsDetailOpen(true)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Alan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Users2 className="h-8 w-8 text-accent" />
            Departmanlar
          </h2>
          <p className="text-muted-foreground mt-1">Şirket departmanlarını ve organizasyon yapısını yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4" />
            Filtrele
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Departman
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam Departman" value={departments.length.toString()} icon={FolderTree} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif Departman" value={departments.filter((d) => d.status === "Active").length.toString()} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Toplam Personel" value={totalDepartmentPersonnel.toString()} icon={Users2} color="text-blue-600" bg="bg-blue-50" />
        <KPICard title="Yönetici Atanmış" value={assignedManagerCount.toString()} icon={UserCircle2} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Tablo Alanı */}
      <Card className="premium-card overflow-hidden">
        <CardHeader className="border-b bg-slate-50/30">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Organizasyon Listesi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="enterprise-table-header">
              <TableRow>
                <TableHead className="pl-6">Departman Adı</TableHead>
                <TableHead>Departman Kodu</TableHead>
                <TableHead>Yönetici</TableHead>
                <TableHead>Personel Sayısı</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right pr-6">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                      <div className="bg-secondary/50 p-6 rounded-full mb-6">
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-2">Henüz departman kaydı bulunmuyor.</h3>
                      <p className="text-muted-foreground max-w-xs mb-6">Sisteme departman ekleyerek organizasyon yapısını oluşturmaya başlayabilirsiniz.</p>
                      <Button 
                        variant="outline" 
                        className="border-primary text-primary hover:bg-primary/5"
                        onClick={() => setIsCreateOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        İlk Departmanı Oluştur
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept: any) => (
                  <TableRow key={dept.id} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6 font-bold text-primary">{dept.departmentName}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{dept.departmentCode}</TableCell>
                    <TableCell className="text-sm text-slate-600">{getManagerLabel(dept.managerId || dept.managerName || dept.manager)}</TableCell>
                    <TableCell className="text-sm text-slate-600">{getPersonnelCountForDept(dept)}</TableCell>
                    <TableCell className="text-sm text-slate-600">{getBranchLabel(dept.branchId)}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-bold",
                        dept.status === "Active" ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-600 border-slate-200"
                      )}>
                        {dept.status === "Active" ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenDetail(dept)}>Detay Gör</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(dept)}>
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeactivate(dept)}>
                            Pasifleştir
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-accent" onClick={() => handleDelete(dept)}>
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Departman Detay Paneli */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 border-none rounded-[32px] overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-extrabold tracking-tight">Departman Detayı</DialogTitle>
            <DialogDescription className="text-white/70 text-base">
              Seçilen departmanın bilgileri.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4">
            {selectedDept && (
              <>
                <InfoRow label="Departman Adı" value={selectedDept.departmentName || "-"} />
                <InfoRow label="Departman Kodu" value={selectedDept.departmentCode || "-"} />
                <InfoRow label="Şube" value={getBranchLabel(selectedDept.branchId)} />
                <InfoRow label="Yönetici" value={getManagerLabel(selectedDept.managerId || selectedDept.managerName || selectedDept.manager)} />
                <InfoRow label="Durum" value={selectedDept.status === "Active" ? "Aktif" : "Pasif"} />
                <InfoRow label="Personel Sayısı" value={getPersonnelCountForDept(selectedDept).toString()} />
              </>
            )}
          </div>
          <DialogFooter className="p-8 bg-slate-50/50 border-t flex flex-row items-center justify-end gap-4">
            <Button variant="ghost" onClick={() => setIsDetailOpen(false)} className="h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100">
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yeni Departman Modalı */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[700px] p-0 border-none rounded-[32px] overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <FolderTree className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-extrabold tracking-tight">Yeni Departman Oluştur</DialogTitle>
            </div>
            <DialogDescription className="text-white/70 text-base">
              Şirket organizasyon yapısına yeni bir departman ve PDKS kuralları tanımlayın.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Genel Bilgiler */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                <Info className="h-4 w-4" />
                Genel Bilgiler
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-name" className="text-xs font-bold text-slate-500">Departman Adı <span className="text-accent">*</span></Label>
                <Input
                  id="dept-name"
                  placeholder="Örn: Yazılım Geliştirme"
                  className="rounded-xl border-slate-200"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-code" className="text-xs font-bold text-slate-500">Departman Kodu <span className="text-accent">*</span></Label>
                <Input
                  id="dept-code"
                  placeholder="Örn: DEPT-IT-01"
                  className="rounded-xl border-slate-200"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Bağlı Şube</Label>
                <Select value={deptBranchId} onValueChange={setDeptBranchId}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Şube seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {localBranches?.length > 0 ? (
                      localBranches.map((b: any) => {
                        const value = (b?.id || b?.branchCode || "").toString();
                        const label = (b?.branchName || b?.name || "").toString();
                        if (!value || !label) return null;
                        return (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="none" disabled>Kayıtlı şube yok</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Departman Yöneticisi</Label>
                <Select value={deptManagerId} onValueChange={setDeptManagerId}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Yönetici seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Henüz Atanmadı</SelectItem>
                    {localPersonnel.length > 0 ? (
                      localPersonnel.map((p: any) => {
                        const value = (p?.id || "").toString()
                        if (!value) return null
                        const label = (p?.fullName || [p?.name, p?.surname].filter(Boolean).join(" ") || p?.personnelCode || value).toString()
                        return (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      })
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Durum</Label>
                <Select value={deptStatus} onValueChange={setDeptStatus}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* PDKS Ayarları */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                <Settings2 className="h-4 w-4" />
                PDKS Ayarları
              </div>
              
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Vardiya Zorunlu</Label>
                    <p className="text-[10px] text-slate-400">Personel vardiyasız giriş yapamaz.</p>
                  </div>
                  <Switch />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Konum Doğrulama</Label>
                    <p className="text-[10px] text-slate-400">GPS koordinatı kontrol edilir.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Fazla Mesai İzni</Label>
                    <p className="text-[10px] text-slate-400">Departman geneli mesai yapabilir.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Uzaktan Çalışma</Label>
                    <p className="text-[10px] text-slate-400">Mobil uygulama üzerinden giriş.</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="description" className="text-xs font-bold text-slate-500">Departman Açıklaması</Label>
                <Textarea 
                  id="description" 
                  placeholder="Departman hakkında kısa bilgi veya özel notlar..." 
                  className="rounded-xl border-slate-200 min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50/50 border-t flex flex-row items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
            >
              Vazgeç
            </Button>
            <Button 
              className="flex-[2] h-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold text-white"
              onClick={handleSaveDepartment}
            >
              {editingDeptId ? "Kaydet" : "Departmanı Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KPICard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="premium-card group hover:scale-[1.02] transition-transform border-none">
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-slate-100 bg-white rounded-xl px-4 py-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-slate-700 text-right">{value}</span>
    </div>
  )
}
