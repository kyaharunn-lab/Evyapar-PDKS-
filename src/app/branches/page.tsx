"use client"

import * as React from "react"
import { 
  Building2, 
  Plus, 
  MapPin, 
  Filter, 
  CheckCircle2, 
  Users, 
  QrCode,
  X,
  Mail,
  User,
  Clock,
  Settings2,
  Info,
  Map as MapIcon,
  Loader2,
  MoreHorizontal,
  Eye,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { TIME_INPUT_PROPS } from "@/lib/date-time"
import { useFirestore } from "@/firebase"
import { deleteSharedRecord, writeSharedRecord } from "@/lib/shared-data-sync"

export default function BranchesPage() {
  const { toast } = useToast()
  const db = useFirestore()
  
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [branches, setBranches] = React.useState<any[]>([])
  const [localPersonnel, setLocalPersonnel] = React.useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = React.useState<any | null>(null)
  const [editingBranchId, setEditingBranchId] = React.useState<string | null>(null)

  // Form States
  const [formData, setFormData] = React.useState({
    branchName: "",
    branchCode: "",
    managerId: "",
    email: "",
    city: "",
    district: "",
    zipCode: "",
    phone: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: "100",
    status: "Active"
  })

  const BRANCHES_STORAGE_KEY = "app_branches";
  const LEGACY_BRANCHES_STORAGE_KEY = "evyapar_pdks_branches_local_v1";
  const PERSONNEL_STORAGE_KEY = "app_personnel";

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(BRANCHES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setBranches(parsed);
      } else {
        const legacyRaw = localStorage.getItem(LEGACY_BRANCHES_STORAGE_KEY);
        if (legacyRaw) {
          const parsed = JSON.parse(legacyRaw);
          if (Array.isArray(parsed)) {
            setBranches(parsed);
            try {
              localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(parsed));
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      // ignore corrupted local data
    }
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(PERSONNEL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setLocalPersonnel(parsed);
    } catch {
      // ignore
    }
  }, []);

  const persistBranches = React.useCallback((next: any[]) => {
    try {
      localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const sortedBranches = React.useMemo(() => {
    const list = Array.isArray(branches) ? branches : [];
    return [...list].sort((a: any, b: any) => (b?.createdAt || 0) - (a?.createdAt || 0));
  }, [branches]);

  const getManagerLabel = React.useCallback((managerId: string | undefined) => {
    if (!managerId) return "Atanmadı";
    const match = localPersonnel.find((p) => p?.id === managerId);
    const fullName = match?.fullName || [match?.name, match?.surname].filter(Boolean).join(" ");
    return fullName || match?.personnelCode || managerId;
  }, [localPersonnel]);

  const getBranchPersonnelCount = React.useCallback((branch: any) => {
    const normalize = (value: any) => {
      if (!value) return "";
      if (typeof value === "object") {
        return normalize(value.id || value.branchId || value.branchCode || value.code || value.branchName || value.name || value.title);
      }
      return value.toString().trim().toLowerCase();
    };

    const branchKeys = [
      branch?.id,
      branch?.branchId,
      branch?.branchCode,
      branch?.code,
      branch?.branchName,
      branch?.name,
      branch?.title,
    ].map(normalize).filter(Boolean);

    if (branchKeys.length === 0) return 0;

    return localPersonnel.filter((person) => {
      if (person?.isDeleted) return false;
      const personBranchKeys = [
        person?.branchId,
        person?.branch,
        person?.branchName,
        person?.selectedBranch,
      ].map(normalize).filter(Boolean);

      return personBranchKeys.some((key) => branchKeys.includes(key));
    }).length;
  }, [localPersonnel]);

  const totalPersonnelInBranches = React.useMemo(() => {
    return sortedBranches.reduce((total, branch) => total + getBranchPersonnelCount(branch), 0);
  }, [getBranchPersonnelCount, sortedBranches]);

  const handleSave = async () => {
    if (!formData.branchName || !formData.branchCode) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şube adı ve kodu zorunludur.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const base = {
        ...formData,
        managerId: formData.managerId || "",
        updatedAt: now,
      };

      setBranches((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (editingBranchId) {
          const idx = list.findIndex((b) => b?.id === editingBranchId);
          if (idx >= 0) {
            const updated = { ...list[idx], ...base };
            void writeSharedRecord(db, "branches", updated);
            const next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)];
            persistBranches(next);
            return next;
          }
        }

        const createdAt = now;
        const newBranch = {
          id: `branch-${createdAt}-${Math.random().toString(16).slice(2)}`,
          ...base,
          createdAt,
        };
        void writeSharedRecord(db, "branches", newBranch);
        const next = [newBranch, ...list];
        persistBranches(next);
        return next;
      });
      toast({
        title: "Başarılı",
        description: editingBranchId ? "Şube güncellendi." : "Şube kaydı oluşturuldu.",
      });

      // Reset form and close
      setFormData({
        branchName: "",
        branchCode: "",
        managerId: "",
        email: "",
        city: "",
        district: "",
        zipCode: "",
        phone: "",
        address: "",
        latitude: "",
        longitude: "",
        radius: "100",
        status: "Active"
      });
      setEditingBranchId(null);
      setIsAddOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şube kaydedilirken bir hata oluştu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetail = (branch: any) => {
    setSelectedBranch(branch);
    setIsDetailOpen(true);
  };

  const handleEdit = (branch: any) => {
    setEditingBranchId(branch?.id || null);
    setFormData({
      branchName: branch?.branchName || "",
      branchCode: branch?.branchCode || "",
      managerId: branch?.managerId || "",
      email: branch?.email || "",
      city: branch?.city || "",
      district: branch?.district || "",
      zipCode: branch?.zipCode || "",
      phone: branch?.phone || "",
      address: branch?.address || "",
      latitude: branch?.latitude || "",
      longitude: branch?.longitude || "",
      radius: branch?.radius || "100",
      status: branch?.status || "Active",
    });
    setIsAddOpen(true);
  };

  const handleDelete = (branch: any) => {
    if (!branch?.id) return;
    setBranches((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const next = list.filter((b) => b?.id !== branch.id);
      persistBranches(next);
      return next;
    });
    toast({ title: "Başarılı", description: "Şube silindi." });
  };

  const handleDeactivate = (branch: any) => {
    if (!branch?.id) return;
    setBranches((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const idx = list.findIndex((b) => b?.id === branch.id);
      if (idx < 0) return list;
      const updated = { ...list[idx], status: "Passive", updatedAt: Date.now() };
      const next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)];
      persistBranches(next);
      return next;
    });
    toast({ title: "Başarılı", description: "Şube pasifleştirildi." });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Alan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Building2 className="h-8 w-8 text-accent" />
            Şubeler
          </h2>
          <p className="text-muted-foreground mt-1">Şirket şubelerini yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4" />
            Filtrele
          </Button>
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <MapPin className="mr-2 h-4 w-4" />
            Harita
          </Button>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="h-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Şube
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam Şube" value={sortedBranches.length.toString()} icon={Building2} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif Şube" value={sortedBranches.filter(b => b.status === "Active").length.toString()} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Toplam Personel" value={totalPersonnelInBranches.toString()} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <KPICard title="QR Aktif" value="0" icon={QrCode} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Liste Görünümü */}
      <Card className="premium-card overflow-hidden">
        <CardContent className="p-0">
          {false && sortedBranches.length === 0 ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : sortedBranches.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[400px]">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Henüz şube kaydı bulunmuyor.</h3>
              <p className="text-muted-foreground max-w-xs mb-6">Sisteme şube ekleyerek organizasyon yapısını oluşturmaya başlayabilirsiniz.</p>
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/5"
                onClick={() => setIsAddOpen(true)}
              >
                İlk Şubeyi Tanımla
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">Şube Adı</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Şehir / İlçe</TableHead>
                  <TableHead>Yetkili</TableHead>
                  <TableHead>Personel</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right pr-6">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBranches.map((branch) => (
                  <TableRow key={branch.id} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6 font-bold text-primary">{branch.branchName}</TableCell>
                    <TableCell className="font-mono text-xs">{branch.branchCode}</TableCell>
                    <TableCell className="text-sm text-slate-600">{branch.city} / {branch.district || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {getManagerLabel(branch.managerId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-100 bg-blue-50 text-xs font-bold text-blue-700">
                        {getBranchPersonnelCount(branch)} personel
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-bold",
                        branch.status === "Active" ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-600 border-slate-200"
                      )}>
                        {branch.status === "Active" ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenDetail(branch)}>
                            <Eye className="mr-2 h-4 w-4 text-slate-400" />
                            Detay Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(branch)}>
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeactivate(branch)}>
                            Pasifleştir
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-accent" onClick={() => handleDelete(branch)}>
                            <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Şube Detay Paneli */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white relative">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">Şube Detayı</SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-full h-8 w-8 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription className="text-slate-500 font-medium mt-1">
                Seçilen şubenin bilgileri.
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-4">
                {selectedBranch && (
                  <>
                    <InfoRow label="Şube Adı" value={selectedBranch.branchName || "-"} />
                    <InfoRow label="Şube Kodu" value={selectedBranch.branchCode || "-"} />
                    <InfoRow label="Yetkili" value={getManagerLabel(selectedBranch.managerId)} />
                    <InfoRow label="E-posta" value={selectedBranch.email || "-"} />
                    <InfoRow label="Telefon" value={selectedBranch.phone || "-"} />
                    <InfoRow label="Şehir / İlçe" value={`${selectedBranch.city || "-"} / ${selectedBranch.district || "-"}`} />
                    <InfoRow label="Adres" value={selectedBranch.address || "-"} />
                    <InfoRow label="Durum" value={selectedBranch.status === "Active" ? "Aktif" : "Pasif"} />
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Yeni Şube Paneli */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[550px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white relative">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">{editingBranchId ? "Şube Düzenle" : "Yeni Şube Ekle"}</SheetTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAddOpen(false)} 
                  className="rounded-full h-8 w-8 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription className="text-slate-500 font-medium mt-1">
                Şirket bünyesine yeni bir çalışma lokasyonu ve PDKS kuralları tanımlayın.
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8 pb-32">
                
                {/* 1. Genel Bilgiler */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <div className="p-1.5 bg-primary/5 rounded-lg">
                      <Info className="h-4 w-4" />
                    </div>
                    Genel Bilgiler
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Şube Adı</Label>
                      <Input 
                        placeholder="Örn: Merkez Ofis" 
                        className="rounded-xl border-slate-200 h-10 text-sm" 
                        value={formData.branchName}
                        onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Şube Kodu</Label>
                      <Input 
                        placeholder="BR-001" 
                        className="rounded-xl border-slate-200 h-10 text-sm" 
                        value={formData.branchCode}
                        onChange={(e) => setFormData({...formData, branchCode: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Yetkili Müdür</Label>
                      <Select value={formData.managerId} onValueChange={(val) => setFormData({...formData, managerId: val})}>
                        <SelectTrigger className="rounded-xl border-slate-200 h-10 text-sm bg-white">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <SelectValue placeholder="Yönetici Seçin" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {localPersonnel && localPersonnel.length > 0 ? (
                            localPersonnel.map((m: any) => (
                              <SelectItem key={m.id} value={m.id}>
                                <div className="flex flex-col text-left py-0.5">
                                  <span className="font-bold text-slate-700 leading-tight">{m.name} {m.surname}</span>
                                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">{m.registryNo || m.id}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>Uygun yönetici bulunamadı</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">E-posta</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input 
                          type="email" 
                          placeholder="sube@evyapar.com" 
                          className="pl-9 rounded-xl border-slate-200 h-10 text-sm" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Şehir</Label>
                      <Input 
                        placeholder="İstanbul" 
                        className="rounded-xl border-slate-200 h-10 text-sm" 
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">İlçe</Label>
                      <Input 
                        placeholder="Kadıköy" 
                        className="rounded-xl border-slate-200 h-10 text-sm" 
                        value={formData.district}
                        onChange={(e) => setFormData({...formData, district: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Posta Kodu</Label>
                      <Input 
                        placeholder="34000" 
                        className="rounded-xl border-slate-200 h-10 text-sm" 
                        value={formData.zipCode}
                        onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Telefon</Label>
                    <Input 
                      placeholder="0212 XXX XX XX" 
                      className="rounded-xl border-slate-200 h-10 text-sm" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Açık Adres</Label>
                    <Textarea 
                      placeholder="Şube tam adresi..." 
                      className="rounded-xl border-slate-200 min-h-[80px] text-sm resize-none" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  {/* Konum Koordinat Alanları */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Enlem (Lat)</Label>
                      <Input 
                        placeholder="41.0082" 
                        className="rounded-xl border-slate-200 h-10 text-sm" 
                        value={formData.latitude}
                        onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Boylam (Lng)</Label>
                      <Input 
                        placeholder="28.9784" 
                        className="rounded-xl border-slate-200 h-10 text-sm" 
                        value={formData.longitude}
                        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase">Konum Radiusu (m)</Label>
                      <Input 
                        placeholder="100" 
                        type="number" 
                        className="rounded-xl border-slate-200 h-10 text-sm" 
                        value={formData.radius}
                        onChange={(e) => setFormData({...formData, radius: e.target.value})}
                      />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full h-10 rounded-xl border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-xs">
                    <MapIcon className="mr-2 h-3.5 w-3.5" />
                    Haritadan Konum Seç
                  </Button>
                </div>

                <Separator className="bg-slate-100" />

                {/* 2. Çalışma Bilgileri */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <div className="p-1.5 bg-primary/5 rounded-lg">
                      <Clock className="h-4 w-4" />
                    </div>
                    Çalışma Bilgileri
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Açılış Saati</Label>
                        <Input {...TIME_INPUT_PROPS} defaultValue="08:00" className="rounded-xl border-slate-200 h-10 text-sm bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Kapanış Saati</Label>
                        <Input {...TIME_INPUT_PROPS} defaultValue="18:00" className="rounded-xl border-slate-200 h-10 text-sm bg-white" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-700">Hafta Sonu Açık mı?</Label>
                        <p className="text-[10px] text-slate-400 font-medium">Cumartesi-Pazar çalışma durumunu belirler.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* 3. PDKS Ayarları */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <div className="p-1.5 bg-primary/5 rounded-lg">
                      <Settings2 className="h-4 w-4" />
                    </div>
                    PDKS Ayarları
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-700">QR ile Giriş</Label>
                        <p className="text-[10px] text-slate-400 font-medium">Şube bazlı QR kod ile giriş yapılabilir.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator className="bg-slate-100/50" />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-700">Konum Doğrulama</Label>
                        <p className="text-[10px] text-slate-400 font-medium">GPS üzerinden bölge kontrolü yapılır.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator className="bg-slate-100/50" />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-700">Yüz Doğrulama</Label>
                        <p className="text-[10px] text-slate-400 font-medium">Biyometrik yüz tanıma ile kimlik doğrulama.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                {/* 4. Durum */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Şube Durumu</Label>
                    <Select defaultValue="Active" onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white">
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active" className="text-green-600 font-bold">● Aktif</SelectItem>
                        <SelectItem value="Passive" className="text-slate-500 font-bold">○ Pasif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-8 border-t bg-white/80 backdrop-blur-md flex gap-3 z-20">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button 
                className="flex-[2] h-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold text-white transition-all active:scale-95"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingBranchId ? "Kaydet" : "Şubeyi Kaydet")}
              </Button>
            </div>
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
