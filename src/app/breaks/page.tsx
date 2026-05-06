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
  FileSpreadsheet
} from "lucide-react"
import { format, differenceInMinutes, differenceInSeconds } from "date-fns"
import { tr } from "date-fns/locale"

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
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, orderBy, Timestamp, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

const b = translations.breaks;
const t = translations.common;

export default function BreakLogsPage() {
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedLog, setSelectedLog] = React.useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [now, setNow] = React.useState(new Date())

  // Update timer every second
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Today's range
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Real-time query for today's breaks
  const breaksQuery = React.useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "break_logs"),
      where("createdAt", ">=", Timestamp.fromDate(todayStart)),
      orderBy("createdAt", "desc")
    );
  }, [db]);

  const { data: rawLogs, loading: loadingLogs } = useCollection(breaksQuery);
  const { data: personnel } = useCollection(db ? collection(db, "personnel") : null);

  // Merge log data with personnel data
  const mergedLogs = React.useMemo(() => {
    if (!rawLogs || !personnel) return [];
    return rawLogs.map(log => ({
      ...log,
      person: personnel.find(p => p.id === log.personnelId)
    })).filter(log => 
      !searchTerm || 
      log.person?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.person?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.person?.registryNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawLogs, personnel, searchTerm]);

  // KPI Calculations
  const stats = React.useMemo(() => {
    const active = mergedLogs.filter(log => log.status === "Active").length;
    const totalToday = mergedLogs.length;
    const exceeded = mergedLogs.filter(log => log.exceededLimit).length;
    
    return { active, totalToday, exceeded };
  }, [mergedLogs]);

  const formatElapsedTime = (startTime: any) => {
    if (!startTime) return "00:00";
    const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
    const diff = Math.max(0, differenceInSeconds(now, start));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreakTypeLabel = (type: string) => {
    const types: any = {
      Lunch: b.types.lunch,
      Tea: b.types.tea,
      Smoke: b.types.smoke,
      Rest: b.types.rest,
      Tech: b.types.tech,
      Personal: b.types.personal
    };
    return types[type] || type;
  };

  const handleEndBreak = async (logId: string) => {
    if (!db) return;
    const logRef = doc(db, "break_logs", logId);
    updateDoc(logRef, {
      endTime: serverTimestamp(),
      status: "Completed",
      updatedAt: serverTimestamp()
    });
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
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
            {b.manualStart}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title={b.onBreak} value={stats.active} icon={Coffee} color="text-yellow-600" bg="bg-yellow-50" />
        <KPICard title={b.totalToday} value={stats.totalToday} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title={b.exceeded} value={stats.exceeded} icon={AlertCircle} color="text-accent" bg="bg-red-50" />
        <KPICard title="Bugünkü Toplam Süre" value="14.2 sa" icon={Clock} color="text-primary" bg="bg-primary/5" />
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
          {loadingLogs ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : mergedLogs.length === 0 ? (
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
                          <span className="font-bold text-primary">{log.person?.name} {log.person?.surname}</span>
                          <span className="text-[10px] font-mono text-slate-400">{log.person?.registryNo || "-"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold border-slate-200">
                        {getBreakTypeLabel(log.breakType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium">
                        <Clock className="mr-2 h-3.5 w-3.5 text-slate-400" />
                        {log.startTime?.toDate ? format(log.startTime.toDate(), "HH:mm") : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.status === "Active" ? (
                        <span className={cn(
                          "text-sm font-bold tabular-nums",
                          log.exceededLimit ? "text-accent animate-pulse" : "text-primary"
                        )}>
                          {formatElapsedTime(log.startTime)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">{log.duration || "-"} dk</span>
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
                          <DropdownMenuItem onClick={() => { setSelectedLog(log); setIsDetailOpen(true); }}>
                            <Eye className="mr-3 h-4 w-4 text-slate-400" />
                            Detayları Gör
                          </DropdownMenuItem>
                          {log.status === "Active" && (
                            <DropdownMenuItem className="text-accent" onClick={() => handleEndBreak(log.id)}>
                              <LogOut className="mr-3 h-4 w-4" />
                              {b.manualEnd}
                            </DropdownMenuItem>
                          )}
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
                    <h4 className="text-xl font-bold text-primary">{selectedLog.person?.name} {selectedLog.person?.surname}</h4>
                    <p className="text-sm font-medium text-slate-500">{selectedLog.person?.position}</p>
                    <BreakStatusBadge status={selectedLog.status} exceeded={selectedLog.exceededLimit} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label="Mola Türü" value={getBreakTypeLabel(selectedLog.breakType)} />
                  <DetailItem label="Başlangıç" value={selectedLog.startTime?.toDate ? format(selectedLog.startTime.toDate(), "HH:mm:ss") : "-"} />
                  <DetailItem label="Bitiş" value={selectedLog.endTime?.toDate ? format(selectedLog.endTime.toDate(), "HH:mm:ss") : "Devam Ediyor..."} />
                  <DetailItem label="Toplam Süre" value={selectedLog.status === "Active" ? formatElapsedTime(selectedLog.startTime) : `${selectedLog.duration || 0} dk`} />
                  <DetailItem label="Şube" value={selectedLog.person?.branchId || "-"} />
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
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-100 font-bold px-3 py-1 rounded-lg">{b.status.active}</Badge>;
    case "Completed":
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
