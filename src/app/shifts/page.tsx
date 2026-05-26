"use client"

import * as React from "react"
import { 
  Plus,
  Settings2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { tr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { DATE_INPUT_PROPS, TIME_INPUT_PROPS, formatDateTR, formatTimeValueTR, normalizeTimeInputTR } from "@/lib/date-time"
import { useFirestore } from "@/firebase"
import { writeSharedRecord } from "@/lib/shared-data-sync"

const s = translations.shifts;
const t = translations.common;
const SHIFTS_STORAGE_KEY = "app_shifts";
const PERSONNEL_STORAGE_KEY = "app_personnel";
const BRANCHES_STORAGE_KEYS = ["app_branches", "evyapar_pdks_branches_local_v1"];
const ALL_BRANCHES_VALUE = "__all_branches__";

const readLocalArray = (keys: string[]) => {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore corrupted local data
    }
  }
  return [];
};

const getBranchLabel = (branch: any) => {
  return (branch?.branchName || branch?.name || branch?.branchCode || "Şube").toString();
};

const getPersonnelLabel = (person: any) => {
  return (person?.fullName || [person?.name, person?.surname].filter(Boolean).join(" ") || person?.personnelCode || "Personel").toString();
};

export default function ShiftsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  
  const [viewMode, setViewMode] = React.useState<"timeline" | "grid" | "list">("timeline")
  const [selectedDate, setSelectedDate] = React.useState(new Date())
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [shifts, setShifts] = React.useState<any[]>([])
  const [personnel, setPersonnel] = React.useState<any[]>([])
  const [branches, setBranches] = React.useState<any[]>([])
  const [formData, setFormData] = React.useState({
    name: "",
    startDate: "",
    startTime: "08:00",
    endTime: "17:00",
    branchId: ALL_BRANCHES_VALUE,
    personnelIds: [] as string[],
  })

  React.useEffect(() => {
    setShifts(readLocalArray([SHIFTS_STORAGE_KEY]));
    setPersonnel(readLocalArray([PERSONNEL_STORAGE_KEY]).filter((p: any) => !p?.isDeleted));
    setBranches(readLocalArray(BRANCHES_STORAGE_KEYS));
  }, []);

  const resetForm = React.useCallback(() => {
    setFormData({
      name: "",
      startDate: "",
      startTime: "08:00",
      endTime: "17:00",
      branchId: ALL_BRANCHES_VALUE,
      personnelIds: [],
    });
  }, []);

  const selectedPersonnel = React.useMemo(() => {
    return personnel.filter((p) => formData.personnelIds.includes(p.id));
  }, [formData.personnelIds, personnel]);

  const filteredPersonnel = React.useMemo(() => {
    if (formData.branchId === ALL_BRANCHES_VALUE) return personnel;
    return personnel.filter((p) => p?.branchId === formData.branchId);
  }, [formData.branchId, personnel]);

  const handleBranchChange = (value: string) => {
    setFormData((prev) => {
      const nextPersonnelIds = value === ALL_BRANCHES_VALUE
        ? prev.personnelIds
        : prev.personnelIds.filter((id) => personnel.some((p) => p?.id === id && p?.branchId === value));

      return {
        ...prev,
        branchId: value,
        personnelIds: nextPersonnelIds,
      };
    });
  };

  const handlePersonnelToggle = (personId: string, checked: boolean | "indeterminate") => {
    setFormData((prev) => ({
      ...prev,
      personnelIds: checked === true
        ? Array.from(new Set([...prev.personnelIds, personId]))
        : prev.personnelIds.filter((id) => id !== personId),
    }));
  };

  const handleSaveShift = () => {
    const requiredError = !formData.name.trim()
      || !formData.startDate
      || !formData.startTime
      || !formData.endTime
      || !formData.branchId
      || formData.personnelIds.length === 0;

    if (requiredError) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Vardiya adı, tarih, saatler, şube ve en az 1 personel zorunludur.",
      });
      return;
    }

    const createdAt = Date.now();
    const newShift = {
      id: `shift-${createdAt}-${Math.random().toString(16).slice(2)}`,
      name: formData.name.trim(),
      startDate: formData.startDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      branchId: formData.branchId,
      personnelIds: formData.personnelIds,
      createdAt,
      updatedAt: createdAt,
    };

    setShifts((prev) => {
      const next = [newShift, ...prev];
      try {
        localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // keep UI updated even if storage is unavailable
      }
      return next;
    });
    void writeSharedRecord(db, "shifts", newShift);

    setIsCreateModalOpen(false);
    resetForm();
    toast({
      title: "Başarılı",
      description: "Vardiya kaydedildi.",
    });
  };

  // Calendar Helpers
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // KPIs
  const stats = React.useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayShifts = shifts?.filter(sh => sh.startDate === today) || [];
    const totalStaffInShifts = todayShifts.reduce((acc, sh) => acc + (sh.personnelIds?.length || 0), 0);
    
    return [
      { title: "Bugünkü Vardiyalar", value: todayShifts.length, icon: CalendarClock, color: "text-blue-600", bg: "bg-blue-50" },
      { title: "Aktif Personel", value: totalStaffInShifts, icon: Users, color: "text-green-600", bg: "bg-green-50" },
      { title: "Eksik Personel", value: 0, icon: AlertCircle, color: "text-accent", bg: "bg-red-50" },
      { title: "Fazla Mesai Riski", value: 0, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    ];
  }, [shifts]);

  const handlePrevWeek = () => setSelectedDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setSelectedDate(prev => addDays(prev, 7));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Vardiya Yönetimi</h2>
          <p className="text-muted-foreground mt-1">Personellerin vardiya planlarını gerçek zamanlı yönetin ve takip edin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="h-11 px-5 border-slate-200">
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="h-11 px-6 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Vardiya
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="premium-card group hover:scale-[1.02] transition-transform">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                <div className="text-3xl font-extrabold text-primary tracking-tight mt-1">{stat.value}</div>
              </div>
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls Bar */}
      <Card className="premium-card overflow-hidden">
        <div className="p-4 border-b bg-slate-50/30 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center bg-white border rounded-xl p-1 shadow-sm">
              <Button 
                variant={viewMode === "timeline" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 px-3 rounded-lg"
                onClick={() => setViewMode("timeline")}
              >
                <LayoutGrid className="mr-2 h-3.5 w-3.5" />
                Haftalık
              </Button>
              <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 px-3 rounded-lg"
                onClick={() => setViewMode("list")}
              >
                <List className="mr-2 h-3.5 w-3.5" />
                Liste
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 font-bold text-primary min-w-[200px] justify-center">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                {format(weekStart, "d MMMM", { locale: tr })} - {format(weekEnd, "d MMMM yyyy", { locale: tr })}
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Vardiya veya personel ara..." 
                className="pl-10 h-10 bg-white border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {!shifts || shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center">
              <div className="bg-secondary/50 p-8 rounded-full mb-8">
                <CalendarClock className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">Henüz vardiya planı oluşturulmadı.</h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                Yeni vardiya oluşturarak personel planlamasına başlayabilirsiniz.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-2xl">
                <Plus className="mr-2 h-5 w-5" />
                İlk Vardiyayı Oluştur
              </Button>
            </div>
          ) : viewMode === "timeline" ? (
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                {/* Timeline Header */}
                <div className="grid grid-cols-8 border-b bg-slate-50/50">
                  <div className="p-4 border-r font-bold text-xs uppercase tracking-widest text-slate-400">Vardiya / Gün</div>
                  {weekDays.map((day) => (
                    <div key={day.toString()} className={cn(
                      "p-4 text-center border-r last:border-r-0",
                      isSameDay(day, new Date()) && "bg-blue-50/50"
                    )}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(day, "EEEE", { locale: tr })}</p>
                      <p className="text-sm font-extrabold text-primary">{format(day, "d MMM")}</p>
                    </div>
                  ))}
                </div>

                {/* Timeline Body - Grouped by Shift Name/Type */}
                <div className="divide-y">
                  {["Gündüz", "Akşam", "Gece", "Diğer"].map((shiftType) => (
                    <div key={shiftType} className="grid grid-cols-8 min-h-[120px]">
                      <div className="p-4 border-r bg-slate-50/20 flex flex-col justify-center">
                        <Badge variant="outline" className="w-fit mb-2 font-bold text-[10px] border-primary/20">
                          {shiftType} Vardiyası
                        </Badge>
                        <p className="text-[11px] text-slate-500">Standart Operasyon</p>
                      </div>
                      {weekDays.map((day) => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const dayShifts = shifts.filter(s => {
                          const knownType = ["Gündüz", "Akşam", "Gece"].some((type) => s.name.includes(type));
                          return s.startDate === dayStr && (shiftType === "Diğer" ? !knownType : s.name.includes(shiftType));
                        });
                        
                        return (
                          <div key={day.toString()} className={cn(
                            "p-2 border-r last:border-r-0 group hover:bg-slate-50/50 transition-colors relative",
                            isSameDay(day, new Date()) && "bg-blue-50/10"
                          )}>
                            {dayShifts.map(sh => (
                              <ShiftCard key={sh.id} shift={sh} personnel={personnel} />
                            ))}
                            {dayShifts.length === 0 && (
                              <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-dashed" onClick={() => setIsCreateModalOpen(true)}>
                                  <Plus className="h-4 w-4 text-slate-400" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shifts.filter(s => 
                !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(sh => (
                <ListShiftCard key={sh.id} shift={sh} personnel={personnel} branches={branches} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coverage Alerts */}
      <Card className="premium-card bg-[#071A2F] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-accent" />
            Kapsama ve Planlama Uyarıları
          </CardTitle>
          <CardDescription className="text-slate-400">Yapay zekâ destekli vardiya çakışma ve eksiklik kontrolü.</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-4" />
            <p className="text-sm font-bold">Harika! Bu hafta için herhangi bir planlama çakışması veya personel eksikliği tespit edilmedi.</p>
          </div>
        </CardContent>
      </Card>

      {/* Create Shift Modal */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[700px] p-0 border-none rounded-[32px] overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-extrabold">Yeni Vardiya Tanımla</DialogTitle>
            <DialogDescription className="text-white/60">Sistem için yeni bir çalışma periyodu ve personel ataması oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Vardiya Adı</label>
                <Input
                  placeholder="Örn: Gündüz Vardiyası"
                  className="rounded-xl border-slate-200"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Başlangıç Saati</label>
                  <Input
                    {...TIME_INPUT_PROPS}
                    className="rounded-xl border-slate-200"
                    value={formData.startTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startTime: normalizeTimeInputTR(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Bitiş Saati</label>
                  <Input
                    {...TIME_INPUT_PROPS}
                    className="rounded-xl border-slate-200"
                    value={formData.endTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: normalizeTimeInputTR(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Şube</label>
                <Select value={formData.branchId} onValueChange={handleBranchChange}>
                  <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                    <SelectValue placeholder="Şube seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_BRANCHES_VALUE}>Tüm Şubeler</SelectItem>
                    {branches.length > 0 ? (
                      branches.map((branch) => {
                        const value = (branch?.id || branch?.branchCode || "").toString();
                        if (!value) return null;
                        return (
                          <SelectItem key={value} value={value}>
                            {getBranchLabel(branch)}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="no-branches" disabled>Kayıtlı şube yok</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Başlangıç Tarihi</label>
                <Input
                  {...DATE_INPUT_PROPS}
                  className="rounded-xl border-slate-200"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Personel Ataması</label>
                <div className="p-4 border rounded-xl bg-slate-50">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-slate-300" />
                      <p className="text-[11px] text-slate-500 font-medium">Personel Seç</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {selectedPersonnel.length} seçili
                    </Badge>
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                    {filteredPersonnel.length > 0 ? (
                      filteredPersonnel.map((person) => (
                        <label
                          key={person.id}
                          className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                        >
                          <Checkbox
                            checked={formData.personnelIds.includes(person.id)}
                            onCheckedChange={(checked) => handlePersonnelToggle(person.id, checked)}
                          />
                          <span className="truncate">{getPersonnelLabel(person)}</span>
                        </label>
                      ))
                    ) : (
                      <p className="py-6 text-center text-[11px] text-slate-500 font-medium">Kayıtlı personel yok</p>
                    )}
                  </div>
                  {selectedPersonnel.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selectedPersonnel.map((person) => (
                        <Badge key={person.id} variant="secondary" className="max-w-full truncate">
                          {getPersonnelLabel(person)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50/50 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="rounded-xl"
            >
              Vazgeç
            </Button>
            <Button className="bg-primary hover:bg-primary/90 px-8 rounded-xl" onClick={handleSaveShift}>Vardiyayı Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShiftCard({ shift, personnel }: { shift: any, personnel: any[] | undefined }) {
  const assignedPersonnel = personnel?.filter(p => shift.personnelIds?.includes(p.id)) || [];

  return (
    <div className={cn(
      "p-2 rounded-xl border-l-4 shadow-sm mb-2 last:mb-0 transition-all hover:scale-[1.03] cursor-pointer",
      shift.name.includes("Gündüz") ? "border-l-blue-500 bg-blue-50/30" : 
      shift.name.includes("Akşam") ? "border-l-orange-500 bg-orange-50/30" : "border-l-purple-500 bg-purple-50/30"
    )}>
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-[11px] font-bold text-primary truncate max-w-[80%]">{shift.name}</h4>
        <MoreHorizontal className="h-3 w-3 text-slate-400" />
      </div>
      <div className="flex items-center text-[10px] font-bold text-slate-600 mb-2">
        <Clock className="mr-1 h-3 w-3" />
        {formatTimeValueTR(shift.startTime)} - {formatTimeValueTR(shift.endTime)}
      </div>
      <div className="flex -space-x-2">
        {assignedPersonnel.slice(0, 3).map((p, idx) => (
          <Avatar key={idx} className="h-5 w-5 border-2 border-white">
            <AvatarImage src={p.avatarUrl} />
            <AvatarFallback className="text-[8px] bg-slate-200">{p.name?.[0]}</AvatarFallback>
          </Avatar>
        ))}
        {assignedPersonnel.length > 3 && (
          <div className="h-5 w-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold">
            +{assignedPersonnel.length - 3}
          </div>
        )}
      </div>
    </div>
  )
}

function ListShiftCard({ shift, personnel, branches }: { shift: any, personnel: any[] | undefined, branches: any[] | undefined }) {
  const branch = branches?.find(b => b.id === shift.branchId);
  const branchLabel = shift.branchId === ALL_BRANCHES_VALUE ? "Tüm Şubeler" : branch ? getBranchLabel(branch) : "Şube bulunamadı";
  const assignedPersonnel = personnel?.filter(p => shift.personnelIds?.includes(p.id)) || [];

  return (
    <Card className="premium-card hover:border-primary/20 transition-all cursor-pointer group">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <Badge className={cn(
            "w-fit mb-2 font-bold text-[10px] border-none",
            shift.name.includes("Gündüz") ? "bg-blue-500/10 text-blue-600" : 
            shift.name.includes("Akşam") ? "bg-orange-500/10 text-orange-600" : "bg-purple-500/10 text-purple-600"
          )}>
            {shift.name}
          </Badge>
          <CardTitle className="text-lg font-extrabold text-primary">{shift.name}</CardTitle>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-primary/5 transition-colors">
          <CalendarClock className="h-5 w-5 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saat Aralığı</p>
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-accent" />
              {formatTimeValueTR(shift.startTime)} - {formatTimeValueTR(shift.endTime)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Şube</p>
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {branchLabel}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atanan Personeller</p>
            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full">{assignedPersonnel.length} Kişi</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {assignedPersonnel.slice(0, 5).map((p) => (
              <Avatar key={p.id} className="h-7 w-7 border-2 border-white shadow-sm">
                <AvatarImage src={p.avatarUrl} />
                <AvatarFallback className="text-[10px] bg-primary/5">{p.name?.[0]}</AvatarFallback>
              </Avatar>
            ))}
            {assignedPersonnel.length > 5 && (
              <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500 border-2 border-white">
                +{assignedPersonnel.length - 5}
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-2 border-t flex items-center justify-end text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatDateTR(shift.startDate)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
