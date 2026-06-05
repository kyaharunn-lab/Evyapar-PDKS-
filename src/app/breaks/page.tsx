"use client"

import * as React from "react"
import { 
  Coffee, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  RefreshCcw,
  Clock,
  AlertCircle,
  UserCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  LogOut,
  Calendar,
  FileSpreadsheet,
  Trash2
} from "lucide-react"
import { differenceInSeconds } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { TIME_INPUT_PROPS, formatTimeTR, getCurrentTimeInputValueTR, normalizeTimeInputTR } from "@/lib/date-time"

const b = translations.breaks;
const t = translations.common;
const BREAKS_STORAGE_KEY = "app_break_records";
const LIVE_PRESENCE_STORAGE_KEY = "app_live_presence";
const PERSONNEL_STORAGE_KEY = "app_personnel";
const BRANCHES_STORAGE_KEYS = ["app_branches", "evyapar_pdks_branches_local_v1"];

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

const getPersonnelName = (person: any) => {
  return (person?.fullName || [person?.name, person?.surname].filter(Boolean).join(" ") || person?.personnelCode || "Personel").toString();
};

const getBranchName = (branch: any) => {
  return (branch?.branchName || branch?.name || branch?.branchCode || "Şube").toString();
};

export default function BreakLogsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedLog, setSelectedLog] = React.useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isManualOpen, setIsManualOpen] = React.useState(false)
  const [now, setNow] = React.useState(new Date())
  const [breakLogs, setBreakLogs] = React.useState<any[]>([])
  const [personnel, setPersonnel] = React.useState<any[]>([])
  const [branches, setBranches] = React.useState<any[]>([])
  const [formData, setFormData] = React.useState({
    personnelId: "",
    branchId: "",
    breakType: "",
    startTime: getCurrentTimeInputValueTR(),
    estimatedDuration: "",
    description: "",
  })

  // Update timer every second
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  React.useEffect(() => {
    const load = () => {
      setBreakLogs(readLocalArray([BREAKS_STORAGE_KEY, "app_breaks"]));
      setPersonnel(readLocalArray([PERSONNEL_STORAGE_KEY]).filter((p: any) => !p?.isDeleted));
      setBranches(readLocalArray(BRANCHES_STORAGE_KEYS));
    }
    load()
    window.addEventListener("app-break-records-updated", load)
    window.addEventListener("storage", load)
    return () => {
      window.removeEventListener("app-break-records-updated", load)
      window.removeEventListener("storage", load)
    }
  }, [])

  const persistBreaks = React.useCallback((next: any[]) => {
    try {
      localStorage.setItem(BREAKS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // keep UI updated even if storage is unavailable
    }
  }, [])

  const resetForm = React.useCallback(() => {
    setFormData({
      personnelId: "",
      branchId: "",
      breakType: "",
      startTime: getCurrentTimeInputValueTR(),
      estimatedDuration: "",
      description: "",
    })
  }, [])

  const openDetailAfterMenuClose = React.useCallback((log: any) => {
    window.setTimeout(() => {
      setSelectedLog(log)
      setIsDetailOpen(true)
    }, 0)
  }, [])

  React.useEffect(() => {
    if (isDetailOpen || isManualOpen || typeof document === "undefined") return
    const cleanup = window.setTimeout(() => {
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""
      document.body.removeAttribute("data-scroll-locked")
      document.body.removeAttribute("inert")
    }, 50)
    return () => window.clearTimeout(cleanup)
  }, [isDetailOpen, isManualOpen])

  // Merge log data with personnel data
  const mergedLogs = React.useMemo(() => {
    return breakLogs.map(log => ({
      ...log,
      person: personnel.find(p => (p.id || p.personnelId || p.personnelCode || "").toString() === (log.personnelId || log.personelId || "").toString()) || { fullName: log.personnelName || log.personelAdı },
      branch: branches.find(branch => (branch?.id || branch?.branchCode) === log.branchId)
    })).filter(log => 
      !searchTerm || 
      getPersonnelName(log.person).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.branchName || getBranchName(log.branch)).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.person?.registryNo || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [breakLogs, branches, personnel, searchTerm]);

  // KPI Calculations
  const stats = React.useMemo(() => {
    const active = mergedLogs.filter(log => log.status === "Active" || log.status === "on_break").length;
    const totalToday = mergedLogs.length;
    const exceeded = mergedLogs.filter(log => log.exceededLimit).length;
    const totalDuration = mergedLogs.reduce((total, log) => {
      if (log.status === "Active" || log.status === "on_break") return total;
      return total + Number(log.duration || 0);
    }, 0);
    
    return { active, totalToday, exceeded, totalDuration };
  }, [mergedLogs]);

  const formatElapsedTime = (startTime: any) => {
    if (!startTime) return "00:00";
    const start = new Date(startTime);
    const diff = Math.max(0, differenceInSeconds(now, start));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreakTypeLabel = (type: string) => {
    const types: any = {
      Lunch: "Yemek",
      Tea: "Çay",
      Smoke: "Sigara",
      Rest: "Dinlenme",
      Tech: b.types.tech,
      Personal: b.types.personal
    };
    return types[type] || type;
  };

const getDurationMinutes = (startTime: string, endTime: string) => {
    const diff = Math.max(0, differenceInSeconds(new Date(endTime), new Date(startTime)));
    return Math.ceil(diff / 60);
  };

  const handleManualSave = () => {
    if (!formData.personnelId || !formData.breakType || !formData.startTime) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel, mola türü ve başlangıç saati zorunludur.",
      });
      return;
    }

    const selectedPerson = personnel.find((p) => p.id === formData.personnelId);
    const start = new Date();
    const [hour, minute] = formData.startTime.split(":").map(Number);
    start.setHours(hour || 0, minute || 0, 0, 0);
    const createdAt = Date.now();
    const newBreak = {
      id: `break-${createdAt}-${Math.random().toString(16).slice(2)}`,
      personnelId: formData.personnelId,
      branchId: formData.branchId || selectedPerson?.branchId || "",
      breakType: formData.breakType,
      startTime: start.toISOString(),
      estimatedDuration: formData.estimatedDuration,
      notes: formData.description,
      status: "Active",
      createdAt,
      updatedAt: createdAt,
    };

    setBreakLogs((prev) => {
      const next = [newBreak, ...prev];
      persistBreaks(next);
      return next;
    });

    setIsManualOpen(false);
    resetForm();
    toast({
      title: "Başarılı",
      description: "Mola kaydı başlatıldı.",
    });
  };

  const handleEndBreak = (logId: string) => {
    const endedAt = new Date().toISOString();
    const endedMs = new Date(endedAt).getTime();
    let endedPersonnelId = "";
    setBreakLogs((prev) => {
      const next = prev.map((log) => {
        if (log.id !== logId) return log;
        endedPersonnelId = (log.personnelId || log.personelId || "").toString();
        const startedAt = log.breakStart || log.startTime || log.startedAt || endedAt;
        const startedMs = new Date(startedAt).getTime();
        const durationMinutes = Number.isNaN(startedMs) ? 1 : Math.max(1, Math.ceil((endedMs - startedMs) / 60000));
        return {
          ...log,
          breakEnd: endedAt,
          endTime: endedAt,
          duration: getDurationMinutes(startedAt, endedAt),
          durationMinutes,
          status: "completed",
          updatedAt: Date.now(),
        };
      });
      persistBreaks(next);
      return next;
    });
    if (endedPersonnelId) {
      try {
        const livePresence = readLocalArray([LIVE_PRESENCE_STORAGE_KEY]);
        localStorage.setItem(LIVE_PRESENCE_STORAGE_KEY, JSON.stringify(livePresence.map((item: any) =>
          (item?.personnelId || item?.personelId || item?.personId || "").toString() === endedPersonnelId ? { ...item, status: "inside", updatedAt: endedAt } : item
        )));
        window.dispatchEvent(new Event("app-live-presence-updated"));
        window.dispatchEvent(new Event("app-break-records-updated"));
      } catch {
        // ignore local sync errors
      }
    }
    toast({ title: "Başarılı", description: "Mola bitirildi." });
  };

  const handleDeleteBreak = (logId: string) => {
    setBreakLogs((prev) => {
      const next = prev.filter((log) => log.id !== logId);
      persistBreaks(next);
      return next;
    });
    toast({ title: "Başarılı", description: "Mola kaydı silindi." });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Coffee className="h-8 w-8 text-accent" />
            {b.title}
          </h2>
          <p className="text-muted-foreground mt-1">{b.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl border-slate-200"
            onClick={() => {
              setBreakLogs(readLocalArray([BREAKS_STORAGE_KEY, "app_breaks"]));
              setPersonnel(readLocalArray([PERSONNEL_STORAGE_KEY]).filter((p: any) => !p?.isDeleted));
              setBranches(readLocalArray(BRANCHES_STORAGE_KEYS));
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button
            className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
            onClick={() => setIsManualOpen(true)}
          >
            {b.manualStart}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title={b.onBreak} value={stats.active} icon={Coffee} color="text-yellow-600" bg="bg-yellow-50" />
        <KPICard title={b.totalToday} value={stats.totalToday} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title={b.exceeded} value={stats.exceeded} icon={AlertCircle} color="text-accent" bg="bg-red-50" />
        <KPICard title="Bugünkü Toplam Süre" value={`${stats.totalDuration} dk`} icon={Clock} color="text-primary" bg="bg-primary/5" />
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="relative w-full lg:w-[400px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={t.search} 
                className="pl-11 h-11 bg-white border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <Button variant="outline" className="h-11 px-5 border-slate-200">
                <Filter className="mr-2 h-4 w-4" />
                {t.filter}
              </Button>
              <Button variant="outline" className="h-11 px-5 border-slate-200 text-green-600">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {mergedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <Coffee className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{b.empty}</h3>
              <p className="text-muted-foreground max-w-xs">{b.emptySub}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">{t.personnel}</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>{b.breakType}</TableHead>
                  <TableHead>{b.startTime}</TableHead>
                  <TableHead>{b.elapsed}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="text-right pr-6">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedLogs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={log.person?.avatarUrl} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {log.person?.name?.charAt(0)}{log.person?.surname?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{getPersonnelName(log.person)}</span>
                          <span className="text-[10px] font-mono text-slate-400">{log.person?.registryNo || "-"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-primary">{log.branchName || (log.branch ? getBranchName(log.branch) : "-")}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold border-slate-200">
                        {getBreakTypeLabel(log.breakType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium">
                        <Clock className="mr-2 h-3.5 w-3.5 text-slate-400" />
                        {formatTimeTR(log.breakStart || log.startTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.status === "Active" || log.status === "on_break" ? (
                        <span className={cn(
                          "text-sm font-bold tabular-nums",
                          log.exceededLimit ? "text-accent animate-pulse" : "text-primary"
                        )}>
                          {formatElapsedTime(log.breakStart || log.startTime)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">{log.durationMinutes || log.duration || "-"} dk</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <BreakStatusBadge status={log.status} exceeded={log.exceededLimit} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <MoreHorizontal className="h-5 w-5 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                          <DropdownMenuItem onSelect={() => openDetailAfterMenuClose(log)}>
                            <Eye className="mr-3 h-4 w-4 text-slate-400" />
                            Detayları Gör
                          </DropdownMenuItem>
                          {(log.status === "Active" || log.status === "on_break") && (
                            <DropdownMenuItem className="text-accent" onClick={() => handleEndBreak(log.id)}>
                              <LogOut className="mr-3 h-4 w-4" />
                              {b.manualEnd}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-accent" onClick={() => handleDeleteBreak(log.id)}>
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

      {/* Manual Break Modal */}
      <Dialog
        open={isManualOpen}
        onOpenChange={(open) => {
          setIsManualOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[640px] p-0 border-none rounded-[28px] overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-extrabold">Manuel Mola Başlat</DialogTitle>
            <DialogDescription className="text-white/60">Personel için manuel mola kaydı oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Personel seç</label>
              <Select
                value={formData.personnelId}
                onValueChange={(value) => {
                  const selectedPerson = personnel.find((p) => p.id === value);
                  setFormData((prev) => ({
                    ...prev,
                    personnelId: value,
                    branchId: prev.branchId || selectedPerson?.branchId || "",
                  }));
                }}
              >
                <SelectTrigger className="rounded-xl border-slate-200 bg-white">
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
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Şube seç</label>
              <Select value={formData.branchId} onValueChange={(value) => setFormData((prev) => ({ ...prev, branchId: value }))}>
                <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Şube seçin" />
                </SelectTrigger>
                <SelectContent>
                  {branches.length > 0 ? (
                    branches.map((branch) => {
                      const value = (branch?.id || branch?.branchCode || "").toString();
                      if (!value) return null;
                      return (
                        <SelectItem key={value} value={value}>
                          {getBranchName(branch)}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-branches" disabled>Kayıtlı şube yok</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mola türü</label>
              <Select value={formData.breakType} onValueChange={(value) => setFormData((prev) => ({ ...prev, breakType: value }))}>
                <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Mola türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lunch">Yemek</SelectItem>
                  <SelectItem value="Tea">Çay</SelectItem>
                  <SelectItem value="Smoke">Sigara</SelectItem>
                  <SelectItem value="Rest">Dinlenme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Başlangıç saati</label>
              <Input
                {...TIME_INPUT_PROPS}
                className="rounded-xl border-slate-200"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: normalizeTimeInputTR(e.target.value) }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tahmini süre</label>
              <Input
                type="number"
                min="1"
                placeholder="Dakika"
                className="rounded-xl border-slate-200"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData((prev) => ({ ...prev, estimatedDuration: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Açıklama</label>
              <Textarea
                placeholder="Açıklama girin..."
                className="rounded-xl border-slate-200 min-h-[90px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50/50 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsManualOpen(false);
                resetForm();
              }}
              className="rounded-xl"
            >
              Vazgeç
            </Button>
            <Button className="bg-primary hover:bg-primary/90 px-8 rounded-xl" onClick={handleManualSave}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Panel */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[500px] p-0 border-none">
          {selectedLog && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-8 pb-6 border-b bg-white">
                <SheetTitle className="text-2xl font-extrabold text-primary">Mola Detayları</SheetTitle>
                <SheetDescription>Seçili mola kaydına ait geçmiş ve güncel bilgiler.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarImage src={selectedLog.person?.avatarUrl} />
                    <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                      {selectedLog.person?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-primary">{getPersonnelName(selectedLog.person)}</h4>
                    <p className="text-sm font-medium text-slate-500">{selectedLog.person?.position}</p>
                    <BreakStatusBadge status={selectedLog.status} exceeded={selectedLog.exceededLimit} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label="Mola Türü" value={getBreakTypeLabel(selectedLog.breakType)} />
                  <DetailItem label="Başlangıç" value={formatTimeTR(selectedLog.startTime, { seconds: true })} />
                  <DetailItem label="Bitiş" value={selectedLog.endTime ? formatTimeTR(selectedLog.endTime, { seconds: true }) : "Devam Ediyor..."} />
                  <DetailItem label="Toplam Süre" value={selectedLog.status === "Active" ? formatElapsedTime(selectedLog.startTime) : `${selectedLog.duration || 0} dk`} />
                  <DetailItem label="Şube" value={selectedLog.branch ? getBranchName(selectedLog.branch) : "-"} />
                  <DetailItem label="Departman" value={selectedLog.person?.departmentId || "-"} />
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">Notlar / Açıklama</h5>
                  <div className="p-4 bg-white border rounded-xl min-h-[100px] text-sm text-slate-600">
                    {selectedLog.notes || "Bu mola kaydı için herhangi bir not girilmemiş."}
                  </div>
                </div>
              </div>
              <div className="p-8 border-t bg-slate-50/50">
                <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => setIsDetailOpen(false)}>Kapat</Button>
              </div>
            </div>
          )}
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

function BreakStatusBadge({ status, exceeded }: { status: string, exceeded?: boolean }) {
  if (exceeded) return <Badge className="bg-red-50 text-accent border-red-100 font-bold px-3 py-1 rounded-lg">SÜRE AŞILDI</Badge>;
  
  switch (status) {
    case "Active":
    case "on_break":
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-100 font-bold px-3 py-1 rounded-lg">{b.status.active}</Badge>;
    case "Completed":
    case "completed":
      return <Badge className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1 rounded-lg">{b.status.completed}</Badge>;
    default:
      return <Badge className="bg-slate-50 text-slate-600 border-slate-200 font-bold px-3 py-1 rounded-lg">{status}</Badge>;
  }
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-primary">{value}</p>
    </div>
  )
}
