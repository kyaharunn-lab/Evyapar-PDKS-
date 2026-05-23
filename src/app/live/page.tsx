"use client"

import * as React from "react"
import { 
  Activity, 
  Search, 
  MapPin, 
  Clock, 
  Filter, 
  MoreHorizontal, 
  ArrowRight,
  Download,
  RefreshCcw,
  UserCircle,
  AlertCircle,
  Eye,
  LogOut,
  Bell,
  Map as MapIcon,
  Loader2
} from "lucide-react"
import { differenceInMinutes } from "date-fns"

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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { formatTimeTR } from "@/lib/date-time"

const t = translations.common;
const l = translations.live;
const LIVE_PRESENCE_KEY = "app_live_presence";
const ATTENDANCE_RECORDS_KEY = "app_attendance_records";
const SHIFTS_KEY = "app_shifts";

function readArray(key: string) {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeArray(key: string, value: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function itemId(item: any) {
  return (item?.personnelId || item?.personelId || item?.personId || item?.id || "").toString();
}

function recordDate(item: any) {
  return String(item?.date || item?.tarih || item?.checkInTime || item?.entryTime || "").slice(0, 10);
}

function recordTime(item: any) {
  const value = item?.checkInTime || item?.entryTime || item?.createdAt || item?.updatedAt || item?.date || item?.tarih || "";
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function recordBranchId(item: any) {
  return String(item?.branchId || item?.branch || item?.branchCode || "");
}

function timeToMinutes(value: any) {
  const text = String(value || "").slice(0, 5);
  const [hour, minute] = text.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function shiftMatchesRecord(shift: any, record: any) {
  const personId = itemId(record);
  const branchId = recordBranchId(record);
  const shiftDate = String(shift?.startDate || shift?.date || "").slice(0, 10);
  const date = recordDate(record);
  const personnelIds = Array.isArray(shift?.personnelIds) ? shift.personnelIds.map(String) : [];
  const shiftPersonIds = [shift?.personnelId, shift?.personId].map((value) => String(value || "")).filter(Boolean);
  const shiftBranchIds = [shift?.branchId, shift?.branch, shift?.branchCode].map((value) => String(value || "")).filter(Boolean);
  return (!shiftDate || !date || shiftDate === date) && (
    (!!personId && (personnelIds.includes(personId) || shiftPersonIds.includes(personId))) ||
    (!!branchId && shiftBranchIds.includes(branchId))
  );
}

function shiftEndMinutes(shifts: any[], record: any) {
  const shift = shifts.find((item) => shiftMatchesRecord(item, record));
  return timeToMinutes(shift?.shift?.endTime || shift?.endTime || shift?.exitTime);
}

function liveOvertimeMinutes(record: any, shifts: any[], now = new Date()) {
  if (String(record?.status || "").toLowerCase() !== "inside") return 0;
  const endMinutes = shiftEndMinutes(shifts, record);
  if (endMinutes === null) return 0;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.max(0, nowMinutes - endMinutes);
}

function exitOvertimeInfo(shifts: any[], record: any, exitedAt = new Date()) {
  const endMinutes = shiftEndMinutes(shifts, record);
  if (endMinutes === null) return { isOvertime: false, overtimeMinutes: 0 };
  const exitMinutes = exitedAt.getHours() * 60 + exitedAt.getMinutes();
  const overtimeMinutes = Math.max(0, exitMinutes - endMinutes);
  return {
    isOvertime: overtimeMinutes > 0,
    overtimeMinutes,
    ...(overtimeMinutes > 0 ? { overtimeStatus: "uyarı" } : {}),
  };
}

function latestInsideByPersonDay(records: any[]) {
  const latest = new Map<string, any>();
  records
    .filter((item: any) => String(item?.status || "").toLowerCase() === "inside")
    .forEach((item: any) => {
      const key = `${itemId(item)}-${recordDate(item)}`;
      const current = latest.get(key);
      if (!current || recordTime(item) >= recordTime(current)) latest.set(key, item);
    });
  return Array.from(latest.values());
}

function personFullName(person: any, fallback = "Personel") {
  return (person?.fullName || [person?.name || person?.firstName, person?.surname || person?.lastName].filter(Boolean).join(" ") || person?.displayName || fallback).toString();
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase() || "P";
}

export default function LiveAttendancePage() {
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedLog, setSelectedLog] = React.useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isExitOpen, setIsExitOpen] = React.useState(false)
  const [exitReason, setExitReason] = React.useState("")
  const [lastRefresh, setLastRefresh] = React.useState(new Date())
  const [now, setNow] = React.useState(new Date())
  const [rawLogs, setRawLogs] = React.useState<any[]>([])
  const [personnel, setPersonnel] = React.useState<any[]>([])
  const [branches, setBranches] = React.useState<any[]>([])
  const [shifts, setShifts] = React.useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = React.useState(true)

  // Update "now" every minute to refresh durations
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const loadLocalData = React.useCallback(() => {
    setRawLogs(latestInsideByPersonDay(readArray(LIVE_PRESENCE_KEY)))
    setPersonnel(readArray("app_personnel").filter((person: any) => !person?.isDeleted))
    setBranches(readArray("app_branches"))
    setShifts(readArray(SHIFTS_KEY))
    setLoadingLogs(false)
    setLastRefresh(new Date())
  }, [])

  React.useEffect(() => {
    loadLocalData()
    const refresh = () => loadLocalData()
    window.addEventListener("storage", refresh)
    window.addEventListener("focus", refresh)
    window.addEventListener("app-live-presence-updated", refresh)
    return () => {
      window.removeEventListener("storage", refresh)
      window.removeEventListener("focus", refresh)
      window.removeEventListener("app-live-presence-updated", refresh)
    }
  }, [loadLocalData])

  // Merge log data with personnel data
  const liveLogs = React.useMemo(() => {
    if (!rawLogs || !personnel) return [];
    return rawLogs.map(log => {
      const personnelId = itemId(log);
      const person = personnel.find(p => itemId(p) === personnelId);
      const branchId = log.branchId || person?.branchId || "";
      const branch = branches?.find(b => (b.id || b.branchCode || "").toString() === branchId.toString());
      const displayName = log.personnelName || log["personelAdı"] || log["personelAdı"] || personFullName(person);
      return {
        ...log,
        personnelId,
        entryTime: log.entryTime || log.checkInTime,
        person: person || { fullName: displayName, name: displayName, surname: "" },
        branchName: log.branchName || log["şube"] || log["şube"] || branch?.branchName || branch?.name || person?.branchId || "-"
      };
    }).filter(log => 
      !searchTerm || 
      log.personnelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.person?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.person?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.person?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.person?.registryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.person?.departmentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawLogs, personnel, branches, searchTerm]);

  // KPI Calculations
  const stats = React.useMemo(() => {
    const total = liveLogs.length;
    const late = liveLogs.filter(log => log.status === "Late").length;
    const breakCount = liveLogs.filter(log => log.status === "Break").length;
    const fieldCount = liveLogs.filter(log => log.isRemote).length;
    const offShift = liveLogs.filter(log => log.status === "OffShift").length;
    
    return { total, late, breakCount, fieldCount, offShift };
  }, [liveLogs]);

  const formatDuration = (entryTime: any) => {
    if (!entryTime) return "-";
    const start = entryTime.toDate ? entryTime.toDate() : new Date(entryTime);
    const diff = differenceInMinutes(now, start);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours} sa ${minutes} dk`;
  };

  const liveStatus = (log: any) => {
    if (liveOvertimeMinutes(log, shifts, now) > 0) return "Overtime";
    return log.isLate ? "Late" : log.status;
  };

  const handleManualExit = async () => {
    if (!selectedLog || !exitReason) return;
    try {
      const exitedAt = new Date();
      const nowIso = exitedAt.toISOString();
      const overtimeInfo = exitOvertimeInfo(shifts, selectedLog, exitedAt);
      const matchesSelected = (item: any) => item?.id === selectedLog.id || itemId(item) === selectedLog.personnelId;
      writeArray(LIVE_PRESENCE_KEY, readArray(LIVE_PRESENCE_KEY).map((item: any) =>
        matchesSelected(item) ? { ...item, ...overtimeInfo, status: "outside", checkOutTime: nowIso, exitTime: nowIso, exitMethod: "Manual", exitReason, updatedAt: nowIso } : item
      ));
      writeArray(ATTENDANCE_RECORDS_KEY, readArray(ATTENDANCE_RECORDS_KEY).map((item: any) =>
        matchesSelected(item) && item?.status === "inside" ? { ...item, ...overtimeInfo, status: "outside", checkOutTime: nowIso, exitTime: nowIso, exitMethod: "Manual", exitReason, updatedAt: nowIso } : item
      ));
      window.dispatchEvent(new Event("app-live-presence-updated"));
      window.dispatchEvent(new Event("app-attendance-records-updated"));
      loadLocalData();

      toast({
        title: "Başarılı",
        description: "Manuel çıkış işlemi kaydedildi.",
      });
      setIsExitOpen(false);
      setIsDetailOpen(false);
      setExitReason("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Çıkış işlemi sırasında bir hata oluştu.",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Activity className="h-8 w-8 text-accent" />
            {l.title}
          </h2>
          <p className="text-muted-foreground mt-1">{l.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-4 hidden md:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.lastUpdate}</p>
            <p className="text-sm font-semibold text-primary">{formatTimeTR(lastRefresh, { seconds: true })}</p>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-xl"
            onClick={loadLocalData}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-10 rounded-xl border-slate-200 text-green-600 hover:text-green-700 hover:bg-green-50">
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <KPICard title={l.kpis.inOffice} value={stats.total} icon={Clock} color="text-green-600" bg="bg-green-50" />
        <KPICard title={l.kpis.onBreak} value={stats.breakCount} icon={RefreshCcw} color="text-yellow-600" bg="bg-yellow-50" />
        <KPICard title={l.kpis.late} value={stats.late} icon={AlertCircle} color="text-accent" bg="bg-red-50" />
        <KPICard title={l.kpis.offShift} value={stats.offShift} icon={Activity} color="text-slate-500" bg="bg-slate-50" />
        <KPICard title={l.kpis.onField} value={stats.fieldCount} icon={MapPin} color="text-blue-600" bg="bg-blue-50" />
        <KPICard title={l.kpis.total} value={stats.total} icon={Activity} color="text-primary" bg="bg-primary/5" />
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
              <Button variant="outline" size="sm" className="h-11 px-5 border-slate-200">
                <Filter className="mr-2 h-4 w-4" />
                {t.filter}
              </Button>
              <Badge variant="secondary" className="h-11 px-4 rounded-xl text-xs font-bold bg-white border border-slate-200 shadow-sm text-primary">
                {liveLogs.length} Aktif Giriş
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLogs ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : liveLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <Activity className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{l.noPersonnel}</h3>
              <p className="text-muted-foreground max-w-xs mb-6">{l.noPersonnelSub}</p>
              <Button variant="outline" className="border-primary text-primary" asChild>
                <a href="/attendance">{l.goToLogs}</a>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">{t.personnel}</TableHead>
                  <TableHead>Şube / Departman</TableHead>
                  <TableHead>{l.entryTime}</TableHead>
                  <TableHead>{l.duration}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{l.location}</TableHead>
                  <TableHead className="text-right pr-6">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveLogs.map((log) => (
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
                          <span className="font-bold text-primary">{log.person?.name} {log.person?.surname}</span>
                          <span className="text-[10px] font-mono text-slate-400">{log.person?.registryNo || log.personnelId}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">{log.branchName}</span>
                        <span className="text-xs text-slate-500">{log.person?.departmentId || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium">
                        <Clock className="mr-2 h-3.5 w-3.5 text-slate-400" />
                        {formatTimeTR(log.entryTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-primary">{formatDuration(log.entryTime)}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={liveStatus(log)} isRemote={log.isRemote} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs text-slate-500">
                        <MapPin className="mr-1.5 h-3 w-3" />
                        <span className="truncate max-w-[120px]">{log.location || "Konum Yok"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <MoreHorizontal className="h-5 w-5 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                          <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { setSelectedLog(log); setIsDetailOpen(true); }}>
                            <Eye className="mr-3 h-4 w-4 text-slate-400" />
                            {l.viewDetails}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-accent focus:text-accent focus:bg-accent/5" onClick={() => { setSelectedLog(log); setIsExitOpen(true); }}>
                            <LogOut className="mr-3 h-4 w-4" />
                            {l.manualExit}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Bell className="mr-3 h-4 w-4 text-slate-400" />
                            {l.sendAlert}
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

      {/* Detail Panel */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[500px] p-0 border-none">
          {selectedLog && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-8 pb-6 border-b bg-white">
                <SheetTitle className="text-2xl font-extrabold text-primary">{l.viewDetails}</SheetTitle>
                <SheetDescription>Personel canlı durum ve log detayları.</SheetDescription>
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
                    <h4 className="text-xl font-bold text-primary">{selectedLog.person?.name} {selectedLog.person?.surname}</h4>
                    <p className="text-sm font-medium text-slate-500">{selectedLog.person?.position}</p>
                    <StatusBadge status={liveStatus(selectedLog)} isRemote={selectedLog.isRemote} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label="Sicil No" value={selectedLog.person?.registryNo || "-"} />
                  <DetailItem label="Şube" value={selectedLog.branchName} />
                  <DetailItem label="Departman" value={selectedLog.person?.departmentId || "-"} />
                  <DetailItem label="Giriş Saati" value={formatTimeTR(selectedLog.entryTime)} />
                  <DetailItem label="İçeride Süre" value={formatDuration(selectedLog.entryTime)} />
                  <DetailItem label="Vardiya" value={selectedLog.shiftId || "Gündüz"} />
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">{l.location}</h5>
                  <div className="p-4 bg-white border rounded-xl flex items-start gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">{selectedLog.location || "Konum bilgisi yok"}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{selectedLog.gps || "GPS verisi yok"}</p>
                      {selectedLog.gps && (
                        <Button variant="link" className="p-0 h-auto text-blue-600 text-xs mt-2" asChild>
                          <a href={`https://www.google.com/maps?q=${selectedLog.gps}`} target="_blank">
                            <MapIcon className="mr-1.5 h-3 w-3" />
                            Haritada Göster
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t bg-slate-50/50 flex gap-3">
                <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setIsDetailOpen(false)}>Kapat</Button>
                <Button 
                  className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent/90"
                  onClick={() => setIsExitOpen(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {l.manualExit}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Manual Exit Modal */}
      <Sheet open={isExitOpen} onOpenChange={setIsExitOpen}>
        <SheetContent side="bottom" className="h-auto p-0 border-none rounded-t-[32px]">
          <div className="max-w-2xl mx-auto p-10 space-y-6">
            <SheetHeader>
              <SheetTitle className="text-2xl font-extrabold text-primary">{l.manualExit}</SheetTitle>
              <SheetDescription>Seçili personel için çıkış işlemini manuel olarak onaylayın.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">{l.exitReason} <span className="text-accent">*</span></label>
              <Textarea 
                placeholder={l.exitReasonPlaceholder}
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-accent/20"
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1 h-12 rounded-2xl" onClick={() => setIsExitOpen(false)}>{t.cancel}</Button>
              <Button 
                className="flex-1 h-12 rounded-2xl bg-accent hover:bg-accent/90"
                disabled={!exitReason}
                onClick={handleManualExit}
              >
                {l.confirmExit}
              </Button>
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

function StatusBadge({ status, isRemote }: { status: string, isRemote?: boolean }) {
  if (isRemote) return <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-bold px-3 py-1 rounded-lg">SAHADA</Badge>;
  
  switch (status) {
    case "OnTime":
      return <Badge className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1 rounded-lg">İÇERİDE</Badge>;
    case "Overtime":
      return <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold px-3 py-1 rounded-lg">FAZLA MESAİ</Badge>;
    case "Late":
      return <Badge className="bg-red-50 text-accent border-red-100 font-bold px-3 py-1 rounded-lg">GEÇ KALDI</Badge>;
    case "Break":
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-100 font-bold px-3 py-1 rounded-lg">MOLADA</Badge>;
    case "OffShift":
      return <Badge className="bg-slate-50 text-slate-600 border-slate-200 font-bold px-3 py-1 rounded-lg">VARDİYA DIŞI</Badge>;
    default:
      return <Badge className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1 rounded-lg">İÇERİDE</Badge>;
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
