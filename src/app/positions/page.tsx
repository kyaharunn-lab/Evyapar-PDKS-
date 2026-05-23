"use client"

import * as React from "react"
import { 
  Briefcase, 
  Plus, 
  Filter, 
  CheckCircle2, 
  UserCircle2, 
  Building2,
  Users2,
  ShieldCheck,
  Settings2,
  Info,
  MoreHorizontal,
  ChevronRight,
  Search,
  LayoutGrid,
  X
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
// X already imported from lucide-react at top; no extra import needed

export default function PositionsPage() {
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [localBranches, setLocalBranches] = React.useState<any[]>([])
  const [localDepartments, setLocalDepartments] = React.useState<any[]>([])
  const [localPersonnel, setLocalPersonnel] = React.useState<any[]>([])
  const [positions, setPositions] = React.useState<any[]>([])
  const [selectedPos, setSelectedPos] = React.useState<any | null>(null)
  const [editingPosId, setEditingPosId] = React.useState<string | null>(null)
  const createDialogRef = React.useRef<HTMLDivElement | null>(null)

  // Form state
  const [posName, setPosName] = React.useState("")
  const [posCode, setPosCode] = React.useState("")
  const [posDepartmentId, setPosDepartmentId] = React.useState("")
  const [posBranchId, setPosBranchId] = React.useState("")
  const [posManagerId, setPosManagerId] = React.useState("none")
  const [posPermissionLevel, setPosPermissionLevel] = React.useState("1")
  const [posWorkType, setPosWorkType] = React.useState("office")
  const [posDescription, setPosDescription] = React.useState("")
  const [posStatus, setPosStatus] = React.useState("active")

  const POSITIONS_STORAGE_KEY = "app_positions"
  const PERSONNEL_STORAGE_KEY = "app_personnel"

  React.useEffect(() => {
    const readFromLocalStorage = (keysToTry: string[]) => {
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

    setLocalBranches(readFromLocalStorage(["app_branches", "evyapar_pdks_branches_local_v1"]));
    setLocalDepartments(readFromLocalStorage(["app_departments", "evyapar_pdks_departments_local_v1"]));
    setLocalPersonnel(readFromLocalStorage([PERSONNEL_STORAGE_KEY]));
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(POSITIONS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setPositions(parsed)
    } catch {
      // ignore corrupted local data
    }
  }, [])

  const persistPositions = React.useCallback((next: any[]) => {
    try {
      localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }, [])

  const getBranchLabel = React.useCallback((branchId: string | undefined) => {
    if (!branchId) return "-"
    const match = localBranches.find((b) => (b?.id || b?.branchCode) === branchId)
    return match?.branchName || match?.name || branchId
  }, [localBranches])

  const getDepartmentLabel = React.useCallback((departmentId: string | undefined) => {
    if (!departmentId) return "-"
    const match = localDepartments.find((d) => (d?.id || d?.departmentCode || d?.code) === departmentId)
    return match?.departmentName || match?.name || departmentId
  }, [localDepartments])

  const getPersonnelName = React.useCallback((person: any) => {
    return (
      person?.fullName ||
      person?.personnelName ||
      [person?.firstName || person?.name, person?.lastName || person?.surname].filter(Boolean).join(" ") ||
      person?.name ||
      person?.personnelCode ||
      person?.id ||
      "Personel"
    ).toString()
  }, [])

  const activePersonnel = React.useMemo(() => {
    return localPersonnel.filter((person) => {
      if (person?.isDeleted) return false
      const status = (person?.status || "Active").toString().toLowerCase()
      return !["inactive", "passive", "pasif", "deleted"].includes(status)
    })
  }, [localPersonnel])

  const selectedManagerName = React.useMemo(() => {
    if (!posManagerId || posManagerId === "none") return undefined
    const person = localPersonnel.find((item) => item?.id === posManagerId)
    return person ? getPersonnelName(person) : undefined
  }, [getPersonnelName, localPersonnel, posManagerId])

  const getManagerLabel = React.useCallback((position: any) => {
    if (!position?.managerId && !position?.managerName) return "Henüz Atanmadı"
    const person = localPersonnel.find((item) => item?.id === position?.managerId)
    return position?.managerName || (person ? getPersonnelName(person) : position?.managerId) || "Henüz Atanmadı"
  }, [getPersonnelName, localPersonnel])

  const hasAssignedPersonnel = React.useCallback((position: any) => {
    const hasValue = (value: any) => {
      if (!value) return false
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === "object") return Object.keys(value).length > 0
      return value.toString().trim().length > 0
    }

    const count = Number(position?.personnelCount || 0)
    return hasValue(position?.personnelId)
      || hasValue(position?.assignedPersonnel)
      || hasValue(position?.personnel)
      || count > 0
  }, [])

  const assignedPositionCount = React.useMemo(() => {
    return positions.filter(hasAssignedPersonnel).length
  }, [hasAssignedPersonnel, positions])

  const emptyPositionCount = React.useMemo(() => {
    return positions.filter((position) => !hasAssignedPersonnel(position)).length
  }, [hasAssignedPersonnel, positions])

  const handleCreatePosition = React.useCallback(() => {
    if (!posName.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Pozisyon adı zorunludur.",
      })
      return
    }
    if (!posCode.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Pozisyon kodu zorunludur.",
      })
      return
    }
    if (!posDepartmentId.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bağlı departman seçimi zorunludur.",
      })
      return
    }

    const createdAt = Date.now()
    const newPos = {
      id: `pos-${createdAt}-${Math.random().toString(16).slice(2)}`,
      positionName: posName.trim(),
      positionCode: posCode.trim(),
      departmentId: posDepartmentId,
      branchId: posBranchId || undefined,
      managerId: posManagerId && posManagerId !== "none" ? posManagerId : undefined,
      managerName: selectedManagerName,
      permissionLevel: posPermissionLevel,
      workType: posWorkType,
      description: posDescription,
      status: posStatus === "active" ? "Active" : "Inactive",
      createdAt,
    }

    setPositions((prev) => {
      const next = [newPos, ...(Array.isArray(prev) ? prev : [])]
      persistPositions(next)
      return next
    })

    // Reset and close
    setPosName("")
    setPosCode("")
    setPosDepartmentId("")
    setPosBranchId("")
    setPosManagerId("none")
    setPosPermissionLevel("1")
    setPosWorkType("office")
    setPosDescription("")
    setPosStatus("active")
    setIsCreateOpen(false)

    toast({
      title: "Başarılı",
      description: "Pozisyon oluşturuldu.",
    })
  }, [persistPositions, posBranchId, posCode, posDepartmentId, posDescription, posManagerId, posName, posPermissionLevel, posStatus, posWorkType, selectedManagerName, toast])

  const handleOpenDetail = React.useCallback((pos: any) => {
    setSelectedPos(pos)
    setIsDetailOpen(true)
  }, [])

  const handleEdit = React.useCallback((pos: any) => {
    setEditingPosId(pos?.id || null)
    setPosName(pos?.positionName || "")
    setPosCode(pos?.positionCode || "")
    setPosDepartmentId(pos?.departmentId || "")
    setPosBranchId(pos?.branchId || "")
    setPosManagerId(pos?.managerId || "none")
    setPosPermissionLevel((pos?.permissionLevel || "1").toString())
    setPosWorkType(pos?.workType || "office")
    setPosDescription(pos?.description || "")
    setPosStatus(pos?.status === "Inactive" ? "inactive" : "active")
    setIsCreateOpen(true)
  }, [])

  const handleDelete = React.useCallback((pos: any) => {
    if (!pos?.id) return
    setPositions((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const next = list.filter((p) => p?.id !== pos.id)
      persistPositions(next)
      return next
    })
    toast({ title: "Başarılı", description: "Pozisyon silindi." })
  }, [persistPositions, toast])

  const handleDeactivate = React.useCallback((pos: any) => {
    if (!pos?.id) return
    setPositions((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const idx = list.findIndex((p) => p?.id === pos.id)
      if (idx < 0) return list
      const updated = { ...list[idx], status: "Inactive", updatedAt: Date.now() }
      const next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
      persistPositions(next)
      return next
    })
    toast({ title: "Başarılı", description: "Pozisyon pasifleştirildi." })
  }, [persistPositions, toast])

  const handleSavePosition = React.useCallback(() => {
    // reuse existing validation + build logic, but update if editing
    if (!posName.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Pozisyon adı zorunludur." })
      return
    }
    if (!posCode.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Pozisyon kodu zorunludur." })
      return
    }
    if (!posDepartmentId.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Bağlı departman seçimi zorunludur." })
      return
    }

    const now = Date.now()
    const base = {
      positionName: posName.trim(),
      positionCode: posCode.trim(),
      departmentId: posDepartmentId,
      branchId: posBranchId || undefined,
      managerId: posManagerId && posManagerId !== "none" ? posManagerId : undefined,
      managerName: selectedManagerName,
      permissionLevel: posPermissionLevel,
      workType: posWorkType,
      description: posDescription,
      status: posStatus === "active" ? "Active" : "Inactive",
      updatedAt: now,
    }

    setPositions((prev) => {
      const list = Array.isArray(prev) ? prev : []
      if (editingPosId) {
        const idx = list.findIndex((p) => p?.id === editingPosId)
        if (idx >= 0) {
          const updated = { ...list[idx], ...base }
          const next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
          persistPositions(next)
          return next
        }
      }
      const createdAt = now
      const newPos = { id: `pos-${createdAt}-${Math.random().toString(16).slice(2)}`, ...base, createdAt }
      const next = [newPos, ...list]
      persistPositions(next)
      return next
    })

    setIsCreateOpen(false)
    setEditingPosId(null)
    setPosName("")
    setPosCode("")
    setPosDepartmentId("")
    setPosBranchId("")
    setPosManagerId("none")
    setPosPermissionLevel("1")
    setPosWorkType("office")
    setPosDescription("")
    setPosStatus("active")

    toast({ title: "Başarılı", description: editingPosId ? "Pozisyon güncellendi." : "Pozisyon oluşturuldu." })
  }, [editingPosId, persistPositions, posBranchId, posCode, posDepartmentId, posDescription, posManagerId, posName, posPermissionLevel, posStatus, posWorkType, selectedManagerName, toast])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Alan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-accent" />
            Pozisyonlar
          </h2>
          <p className="text-muted-foreground mt-1">Şirket içindeki görev ve pozisyon yapılarını yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4" />
            Filtrele
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Pozisyon
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam Pozisyon" value={positions.length.toString()} icon={LayoutGrid} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif Pozisyon" value={positions.filter((p) => p.status === "Active").length.toString()} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Personel Atanmış" value={assignedPositionCount.toString()} icon={Users2} color="text-blue-600" bg="bg-blue-50" />
        <KPICard title="Boş Pozisyon" value={emptyPositionCount.toString()} icon={UserCircle2} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Tablo Alanı */}
      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Pozisyon Listesi</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Pozisyon ara..." className="pl-10 h-9 rounded-lg bg-white border-slate-200" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="enterprise-table-header">
              <TableRow>
                <TableHead className="pl-6">Pozisyon Adı</TableHead>
                <TableHead>Pozisyon Kodu</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Bağlı Yönetici</TableHead>
                <TableHead>Personel Sayısı</TableHead>
                <TableHead>Yetki Seviyesi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right pr-6">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-[450px] text-center">
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                      <div className="bg-secondary/50 p-6 rounded-full mb-6 shadow-inner">
                        <Briefcase className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-2">Henüz pozisyon kaydı bulunmuyor.</h3>
                      <p className="text-muted-foreground max-w-xs mb-6">Pozisyonları tanımlayarak organizasyon şemasını ve PDKS kurallarını belirleyebilirsiniz.</p>
                      <Button 
                        variant="outline" 
                        className="border-primary text-primary hover:bg-primary/5 h-11 px-8 rounded-xl font-bold"
                        onClick={() => setIsCreateOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        İlk Pozisyonu Oluştur
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((pos: any) => (
                  <TableRow key={pos.id} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6 font-bold text-primary">{pos.positionName}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{pos.positionCode}</TableCell>
                    <TableCell className="text-sm text-slate-600">{getDepartmentLabel(pos.departmentId)}</TableCell>
                    <TableCell className="text-sm text-slate-600">{getBranchLabel(pos.branchId)}</TableCell>
                    <TableCell className="text-sm text-slate-600">{getManagerLabel(pos)}</TableCell>
                    <TableCell className="text-sm text-slate-600">0</TableCell>
                    <TableCell className="text-sm font-bold text-slate-700">{pos.permissionLevel || "-"}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-bold",
                        pos.status === "Active" ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-600 border-slate-200"
                      )}>
                        {pos.status === "Active" ? "Aktif" : "Pasif"}
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
                          <DropdownMenuItem onClick={() => handleOpenDetail(pos)}>Detay Gör</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(pos)}>Düzenle</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeactivate(pos)}>Pasifleştir</DropdownMenuItem>
                          <DropdownMenuItem className="text-accent" onClick={() => handleDelete(pos)}>Sil</DropdownMenuItem>
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

      {/* Yeni Pozisyon Modalı */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) setEditingPosId(null)
        }}
      >
        <DialogContent ref={createDialogRef} className="sm:max-w-[750px] p-0 border-none rounded-[32px] overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-xl">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-extrabold tracking-tight">Yeni Pozisyon Tanımla</DialogTitle>
            </div>
            <DialogDescription className="text-white/70 text-base">
              Organizasyon hiyerarşisine yeni bir pozisyon ve PDKS yetkilendirmesi ekleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {/* Temel Bilgiler */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                <Info className="h-4 w-4" />
                Temel Bilgiler
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pos-name" className="text-xs font-bold text-slate-500">Pozisyon Adı <span className="text-accent">*</span></Label>
                <Input
                  id="pos-name"
                  placeholder="Örn: Kıdemli Yazılım Geliştirici"
                  className="rounded-xl border-slate-200"
                  value={posName}
                  onChange={(e) => setPosName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pos-code" className="text-xs font-bold text-slate-500">Pozisyon Kodu <span className="text-accent">*</span></Label>
                <Input
                  id="pos-code"
                  placeholder="Örn: POS-DEV-01"
                  className="rounded-xl border-slate-200"
                  value={posCode}
                  onChange={(e) => setPosCode(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Bağlı Departman <span className="text-accent">*</span></Label>
                  <Select value={posDepartmentId} onValueChange={setPosDepartmentId}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Seçiniz..." />
                    </SelectTrigger>
                    <SelectContent container={createDialogRef.current} className="z-[80]">
                      {localDepartments?.length > 0 ? (
                        localDepartments.map((d: any) => {
                          const value = (d?.id || d?.departmentCode || d?.code || "").toString();
                          const label = (d?.departmentName || d?.name || "").toString();
                          if (!value || !label) return null;
                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="none" disabled>Kayıtlı departman yok</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Şube</Label>
                  <Select value={posBranchId} onValueChange={setPosBranchId}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Seçiniz..." />
                    </SelectTrigger>
                    <SelectContent container={createDialogRef.current} className="z-[80]">
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
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Bağlı Olduğu Yönetici</Label>
                <Select value={posManagerId} onValueChange={setPosManagerId}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Yönetici seçin..." />
                  </SelectTrigger>
                  <SelectContent container={createDialogRef.current} className="z-[80]">
                    <SelectItem value="none">Henüz Atanmadı</SelectItem>
                    {activePersonnel.map((person) => {
                      const value = (person?.id || "").toString()
                      if (!value) return null
                      return (
                        <SelectItem key={value} value={value}>
                          {getPersonnelName(person)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Yetki Seviyesi</Label>
                  <Select value={posPermissionLevel} onValueChange={setPosPermissionLevel}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent container={createDialogRef.current} className="z-[80]">
                      <SelectItem value="1">Seviye 1 (Personel)</SelectItem>
                      <SelectItem value="2">Seviye 2 (Şef/Takım Lideri)</SelectItem>
                      <SelectItem value="3">Seviye 3 (Müdür)</SelectItem>
                      <SelectItem value="4">Seviye 4 (Direktör)</SelectItem>
                      <SelectItem value="5">Seviye 5 (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Çalışma Türü</Label>
                  <Select value={posWorkType} onValueChange={setPosWorkType}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent container={createDialogRef.current} className="z-[80]">
                      <SelectItem value="office">Ofis</SelectItem>
                      <SelectItem value="field">Saha</SelectItem>
                      <SelectItem value="remote">Uzaktan</SelectItem>
                      <SelectItem value="hybrid">Hibrit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* PDKS ve Ek Bilgiler */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                <Settings2 className="h-4 w-4" />
                PDKS Yetkileri
              </div>

              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Vardiya Zorunlu</Label>
                    <p className="text-[10px] text-slate-400 font-medium">Giriş için vardiya atanmış olmalı.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Konum Doğrulama</Label>
                    <p className="text-[10px] text-slate-400 font-medium">GPS üzerinden bölge kontrolü.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">QR Zorunlu</Label>
                    <p className="text-[10px] text-slate-400 font-medium">QR kod okutmadan giriş engellenir.</p>
                  </div>
                  <Switch />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Fazla Mesai İzni</Label>
                    <p className="text-[10px] text-slate-400 font-medium">Pozisyon mesai ücreti alabilir.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pos-desc" className="text-xs font-bold text-slate-500">Pozisyon Açıklaması</Label>
                <Textarea
                  id="pos-desc"
                  placeholder="Görev tanımı ve sorumluluklar..."
                  className="rounded-xl border-slate-200 min-h-[100px] resize-none"
                  value={posDescription}
                  onChange={(e) => setPosDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Durum</Label>
                <Select value={posStatus} onValueChange={setPosStatus}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent container={createDialogRef.current} className="z-[80]">
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
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
              className="flex-[2] h-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold text-white transition-all active:scale-95"
              onClick={handleSavePosition}
            >
              {editingPosId ? "Kaydet" : "Pozisyonu Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pozisyon Detay Paneli */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white relative">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">Pozisyon Detayı</SheetTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="rounded-full h-8 w-8 hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription className="text-slate-500 font-medium mt-1">Seçilen pozisyonun bilgileri.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-4">
                {selectedPos && (
                  <>
                    <InfoRow label="Pozisyon Adı" value={selectedPos.positionName || "-"} />
                    <InfoRow label="Pozisyon Kodu" value={selectedPos.positionCode || "-"} />
                    <InfoRow label="Departman" value={getDepartmentLabel(selectedPos.departmentId)} />
                    <InfoRow label="Şube" value={getBranchLabel(selectedPos.branchId)} />
                    <InfoRow label="Yetki Seviyesi" value={(selectedPos.permissionLevel || "-").toString()} />
                    <InfoRow label="Çalışma Türü" value={selectedPos.workType || "-"} />
                    <InfoRow label="Durum" value={selectedPos.status === "Active" ? "Aktif" : "Pasif"} />
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
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

function KPICard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="premium-card group hover:scale-[1.02] transition-transform border-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl transition-colors", bg)}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
        </div>
        <div className="text-2xl font-extrabold text-primary tracking-tight">{value}</div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}
