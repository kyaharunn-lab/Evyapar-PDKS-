
"use client"

import * as React from "react"
import { 
  Bell, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCircle,
  Eye,
  AlertCircle,
  Loader2,
  Check,
  X,
  FileText,
  ClipboardList,
  Calendar,
  Zap,
  ChevronRight,
  MessageSquare
} from "lucide-react"
import { format, differenceInHours, parseISO } from "date-fns"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirestore, useCollection, useUser } from "@/firebase"
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { formatDateTimeTR } from "@/lib/date-time"
import { Textarea } from "@/components/ui/textarea"
import { useFirestoreLocalMirror, writeSharedRecord } from "@/lib/shared-data-sync"

const t = translations.common;
const a = translations.approvals;
const LEAVE_REQUESTS_KEY = "app_leave_requests";
const ADVANCE_REQUESTS_KEY = "app_advance_requests";
const PERSONNEL_KEY = "app_personnel";
const AUDIT_KEY = "app_audit_logs";

const readLocalArray = (key: string) => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalArray = (key: string, value: any[]) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getLocalPersonId = (request: any) => {
  return (request?.personnelId || request?.personId || request?.personelId || request?.employeeId || "").toString();
};

const getLocalPersonName = (person: any, request: any) => {
  return (request?.personName || request?.personelAdı || person?.fullName || [person?.name || person?.firstName, person?.surname || person?.lastName].filter(Boolean).join(" ") || "Personel").toString();
};

const isPendingStatus = (status: any) => {
  const raw = (status || "pending").toString().toLowerCase();
  return raw === "pending" || raw === "bekliyor" || raw === "wait" || raw === "waiting";
};

const asDate = (value: any) => {
  if (value?.toDate) return value.toDate();
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export default function ApprovalsCenterPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedRequest, setSelectedRequest] = React.useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isRejectOpen, setIsRejectOpen] = React.useState(false)
  const [isApproveOpen, setIsApproveOpen] = React.useState(false)
  const [actionReason, setActionReason] = React.useState("")
  const [loadingAction, setLoadingAction] = React.useState(false)
  const [now, setNow] = React.useState(new Date())
  const [localLeaves, setLocalLeaves] = React.useState<any[]>([])
  const [localAdvances, setLocalAdvances] = React.useState<any[]>([])
  const [localPersonnel, setLocalPersonnel] = React.useState<any[]>([])
  const leaveSyncTargets = React.useMemo(() => [{ collectionName: "leaveRequests", storageKey: LEAVE_REQUESTS_KEY }], [])

  const loadLocalApprovals = React.useCallback(() => {
    setLocalLeaves(readLocalArray(LEAVE_REQUESTS_KEY))
    setLocalAdvances(readLocalArray(ADVANCE_REQUESTS_KEY))
    setLocalPersonnel(readLocalArray(PERSONNEL_KEY).filter((person: any) => !person?.isDeleted))
  }, [])

  React.useEffect(() => {
    loadLocalApprovals()
    const onStorage = (event: StorageEvent) => {
      if ([LEAVE_REQUESTS_KEY, ADVANCE_REQUESTS_KEY, PERSONNEL_KEY].includes(event.key || "")) {
        loadLocalApprovals()
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [loadLocalApprovals])

  useFirestoreLocalMirror(db, leaveSyncTargets, loadLocalApprovals)

  // Update "now" every minute for wait time calc
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Real-time queries for pending requests
  const leaveQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "leaveRequests"), where("status", "==", "Pending"));
  }, [db]);

  const advanceQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "advance_requests"), where("status", "==", "Pending"));
  }, [db]);

  const personnelQuery = React.useMemo(() => {
    return db ? collection(db, "personnel") : null;
  }, [db]);

  const { data: pendingLeaves, loading: loadingLeaves } = useCollection(leaveQuery);
  const { data: pendingAdvances, loading: loadingAdvances } = useCollection(advanceQuery);
  const { data: personnel } = useCollection(personnelQuery);

  // Unified Approvals List
  const allApprovals = React.useMemo(() => {
    const people = [...(personnel || []), ...localPersonnel];
    
    const leaves = (pendingLeaves || []).map(req => ({
      ...req,
      type: "Leave",
      typeLabel: a.types.Leave,
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
      summary: `${req.totalDays} Gün ${translations.leaves.types[req.leaveType as keyof typeof translations.leaves.types] || req.leaveType}`,
      person: people.find(p => p.id === req.personnelId),
      priority: req.totalDays > 5 ? "High" : "Normal"
    }));

    const advances = (pendingAdvances || []).map(req => ({
      ...req,
      type: "Advance",
      typeLabel: a.types.Advance,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
      summary: `${(parseFloat(req.amount) || 0).toLocaleString()} ${req.currency || "₺"} Avans`,
      person: people.find(p => p.id === req.personnelId),
      priority: parseFloat(req.amount) > 10000 ? "Critical" : "Normal"
    }));

    const localLeaveApprovals = localLeaves
      .filter(req => isPendingStatus(req.status))
      .map(req => {
        const personId = getLocalPersonId(req);
        const person = people.find(p => p.id === personId);
        const totalDays = req.totalDays || req.days || 1;
        return {
          ...req,
          id: req.id || `local-leave-${personId}-${req.createdAt || req.startDate}`,
          sourceKey: LEAVE_REQUESTS_KEY,
          type: "Leave",
          typeLabel: a.types.Leave,
          icon: ClipboardList,
          color: "text-blue-600",
          bg: "bg-blue-50",
          summary: `${totalDays} Gün ${req.leaveType || req.type || "İzin"}`,
          person: person || { id: personId, name: getLocalPersonName(person, req), surname: "", registryNo: req.personnelCode || req.sicilNo },
          personnelId: personId,
          totalDays,
          priority: req.urgency === "urgent" || totalDays > 5 ? "High" : "Normal",
          createdAt: req.createdAt || req.updatedAt || new Date().toISOString(),
        };
      });

    const localAdvanceApprovals = localAdvances
      .filter(req => isPendingStatus(req.status))
      .map(req => {
        const personId = getLocalPersonId(req);
        const person = people.find(p => p.id === personId);
        const amount = parseFloat(req.amount) || 0;
        return {
          ...req,
          id: req.id || `local-advance-${personId}-${req.createdAt || amount}`,
          sourceKey: ADVANCE_REQUESTS_KEY,
          type: "Advance",
          typeLabel: a.types.Advance,
          icon: FileText,
          color: "text-green-600",
          bg: "bg-green-50",
          summary: `${amount.toLocaleString()} ${req.currency || "₺"} Avans`,
          person: person || { id: personId, name: getLocalPersonName(person, req), surname: "", registryNo: req.personnelCode || req.sicilNo },
          personnelId: personId,
          priority: amount > 10000 ? "Critical" : "Normal",
          createdAt: req.createdAt || req.updatedAt || new Date().toISOString(),
        };
      });

    return [...leaves, ...advances, ...localLeaveApprovals, ...localAdvanceApprovals]
      .sort((a, b) => {
        const dateA = asDate(a.createdAt);
        const dateB = asDate(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .filter(req => 
        !searchTerm || 
        req.person?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.person?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [pendingLeaves, pendingAdvances, personnel, localPersonnel, localLeaves, localAdvances, searchTerm]);

  // KPIs
  const stats = React.useMemo(() => {
    const total = allApprovals.length;
    const critical = allApprovals.filter(r => r.priority === "Critical").length;
    const high = allApprovals.filter(r => r.priority === "High").length;
    
    // Requests from today
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayCount = allApprovals.filter(r => r.createdAt?.toDate && r.createdAt.toDate() >= today).length;

    return { total, critical, todayCount, high };
  }, [allApprovals]);

  const handleAction = async (requestId: string, type: string, action: "Approved" | "Rejected", reason: string = "") => {
    setLoadingAction(true);
    try {
      if (selectedRequest?.sourceKey) {
        const key = selectedRequest.sourceKey;
        const records = readLocalArray(key);
        const nowIso = new Date().toISOString();
        const next = records.map((record: any) => {
          if ((record?.id || "").toString() !== requestId) return record;
          return {
            ...record,
            status: action === "Approved" ? "approved" : "rejected",
            updatedAt: nowIso,
            ...(action === "Approved"
              ? { approvedBy: user?.email || "Admin", approvedAt: nowIso }
              : { rejectedBy: user?.email || "Admin", rejectedAt: nowIso, rejectedReason: reason, rejectionReason: reason }),
          };
        });
        writeLocalArray(key, next);
        if (key === LEAVE_REQUESTS_KEY) {
          void writeSharedRecord(db, "leaveRequests", next.find((record: any) => (record?.id || "").toString() === requestId))
        }
        writeLocalArray(AUDIT_KEY, [
          {
            id: `approval-${Date.now()}`,
            action: `${type === "Leave" ? "İzin" : "Avans"} talebi ${action === "Approved" ? "onaylandı" : "reddedildi"}`,
            requestId,
            performedBy: user?.email || "Admin",
            channel: "Panel",
            category: "Onay",
            detail: reason || selectedRequest.summary || "",
            createdAt: nowIso,
            timestamp: Date.now(),
          },
          ...readLocalArray(AUDIT_KEY),
        ]);
        loadLocalApprovals();
        toast({
          title: "İşlem Tamamlandı",
          description: `Talep ${action === "Approved" ? "onaylandı" : "reddedildi"}.`,
        });
        setIsApproveOpen(false);
        setIsRejectOpen(false);
        setIsDetailOpen(false);
        setActionReason("");
        return;
      }

      if (!db) return;
      const collectionName = type === "Leave" ? "leaveRequests" : "advance_requests";
      const requestRef = doc(db, collectionName, requestId);
      
      const payload: any = {
        status: action,
        updatedAt: serverTimestamp(),
      };

      if (action === "Approved") payload.approvedBy = user?.email || "System";
      if (action === "Rejected") payload.rejectionReason = reason;

      await updateDoc(requestRef, payload);

      // Audit Log
      await addDoc(collection(db, "audit_logs"), {
        action: `${type} ${action}`,
        requestId,
        performedBy: user?.email || "System",
        timestamp: serverTimestamp(),
        reason
      });

      toast({
        title: "İşlem Tamamlandı",
        description: `Talep ${action === "Approved" ? "onaylandı" : "reddedildi"}.`,
      });
      
      setIsApproveOpen(false);
      setIsRejectOpen(false);
      setIsDetailOpen(false);
      setActionReason("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const getWaitTime = (createdAt: any) => {
    const start = asDate(createdAt);
    const diffHours = differenceInHours(now, start);
    if (diffHours < 1) return "< 1 sa";
    if (diffHours < 24) return `${diffHours} sa`;
    return `${Math.floor(diffHours / 24)} gün`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Zap className="h-8 w-8 text-accent animate-pulse" />
            {a.title}
          </h2>
          <p className="text-muted-foreground mt-1">{a.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Toplu Onay
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title={a.totalPending} value={stats.total} icon={Bell} color="text-primary" bg="bg-primary/5" />
        <KPICard title={a.criticalRequests} value={stats.critical} icon={AlertCircle} color="text-accent" bg="bg-red-50" />
        <KPICard title={a.todayRequests} value={stats.todayCount} icon={Zap} color="text-yellow-600" bg="bg-yellow-50" />
        <KPICard title={a.lateRequests} value={stats.high} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
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
                {allApprovals.length} Talep Bekliyor
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLeaves || loadingAdvances ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : allApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="bg-secondary/50 p-8 rounded-full mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{a.empty}</h3>
              <p className="text-muted-foreground max-w-xs">{a.emptySub}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6 w-[100px]">Öncelik</TableHead>
                  <TableHead>Talep Türü</TableHead>
                  <TableHead>Personel</TableHead>
                  <TableHead>Özet</TableHead>
                  <TableHead>Bekleme</TableHead>
                  <TableHead className="text-right pr-6">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allApprovals.map((req) => (
                  <TableRow key={req.id} className="group hover:bg-slate-50/80 transition-all cursor-pointer" onClick={() => { setSelectedRequest(req); setIsDetailOpen(true); }}>
                    <TableCell className="pl-6">
                      <PriorityBadge priority={req.priority} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg", req.bg)}>
                          <req.icon className={cn("h-4 w-4", req.color)} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{req.typeLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                          <AvatarImage src={req.person?.avatarUrl} />
                          <AvatarFallback className="text-[10px] font-bold bg-primary text-white">
                            {req.person?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">{req.person?.name} {req.person?.surname}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{req.person?.registryNo}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px] block">
                        {req.summary}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className={cn(
                          "text-xs font-bold",
                          differenceInHours(now, req.createdAt?.toDate ? req.createdAt.toDate() : now) > 24 ? "text-accent" : "text-slate-500"
                        )}>
                          {getWaitTime(req.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                          onClick={() => { setSelectedRequest(req); setIsApproveOpen(true); }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-accent hover:text-accent hover:bg-red-50 rounded-lg"
                          onClick={() => { setSelectedRequest(req); setIsRejectOpen(true); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                            <DropdownMenuItem onClick={() => { setSelectedRequest(req); setIsDetailOpen(true); }}>
                              <Eye className="mr-2 h-4 w-4 text-slate-400" />
                              Detayları Gör
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4 text-slate-400" />
                              Yorum Ekle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
        <SheetContent side="right" className="w-full sm:max-w-[550px] p-0 border-none">
          {selectedRequest && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-8 pb-6 border-b bg-white">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none", selectedRequest.bg, selectedRequest.color)}>
                    {selectedRequest.typeLabel}
                  </Badge>
                  <PriorityBadge priority={selectedRequest.priority} />
                </div>
                <SheetTitle className="text-2xl font-extrabold text-primary">Talep Detayları</SheetTitle>
                <SheetDescription>Merkezi workflow üzerinden talep yönetimi.</SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarImage src={selectedRequest.person?.avatarUrl} />
                    <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                      {selectedRequest.person?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-primary">{selectedRequest.person?.name} {selectedRequest.person?.surname}</h4>
                    <p className="text-sm font-medium text-slate-500">{selectedRequest.person?.position}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                      <Clock className="h-3 w-3" />
                      {getWaitTime(selectedRequest.createdAt)} önce talep edildi
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label="Talep Özeti" value={selectedRequest.summary} />
                  <DetailItem label="Talep Tarihi" value={formatDateTimeTR(selectedRequest.createdAt)} />
                  {selectedRequest.type === "Leave" ? (
                    <>
                      <DetailItem label="İzin Türü" value={translations.leaves.types[selectedRequest.leaveType as keyof typeof translations.leaves.types] || selectedRequest.leaveType} />
                      <DetailItem label="Süre" value={`${selectedRequest.totalDays} Gün`} />
                    </>
                  ) : (
                    <>
                      <DetailItem label="Tutar" value={`${(parseFloat(selectedRequest.amount) || 0).toLocaleString()} ${selectedRequest.currency || "₺"}`} />
                      <DetailItem label="IBAN" value={selectedRequest.iban || selectedRequest.person?.salary?.iban || "-"} />
                    </>
                  )}
                  <DetailItem label="Şube" value={selectedRequest.person?.branchId || "-"} />
                  <DetailItem label="Departman" value={selectedRequest.person?.departmentId || "-"} />
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">Açıklama / Notlar</h5>
                  <div className="p-4 bg-white border rounded-xl min-h-[100px] text-sm text-slate-600 italic">
                    "{selectedRequest.notes || selectedRequest.reason || "Herhangi bir açıklama girilmemiş."}"
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex gap-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-blue-900">Sistem Analizi</p>
                      <p className="text-[11px] text-blue-800 leading-relaxed mt-1">
                        Bu talep normal prosedürlere uygundur. Personelin bekleyen başka bir talebi bulunmamaktadır.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t bg-slate-50/50 flex gap-3">
                <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setIsDetailOpen(false)}>{t.cancel}</Button>
                <div className="flex-1 flex gap-2">
                  <Button variant="outline" className="flex-1 h-11 rounded-xl text-accent border-accent/20" onClick={() => setIsRejectOpen(true)}>Red</Button>
                  <Button className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700" onClick={() => setIsApproveOpen(true)}>Onayla</Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Action Dialogs */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-green-600 text-white">
            <DialogTitle className="text-2xl font-bold">Talebi Onayla</DialogTitle>
            <DialogDescription className="text-white/80">Bu talebi onaylamak istediğinizden emin misiniz?</DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Onaylanan talep ilgili birimlere (İK / Muhasebe) aktarılacak ve personel bilgilendirilecektir.
            </p>
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-11 rounded-xl" onClick={() => setIsApproveOpen(false)}>{t.cancel}</Button>
            <Button 
              className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700" 
              disabled={loadingAction} 
              onClick={() => handleAction(selectedRequest.id, selectedRequest.type, "Approved")}
            >
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Onayla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-accent text-white">
            <DialogTitle className="text-2xl font-bold">Talebi Reddet</DialogTitle>
            <DialogDescription className="text-white/80">Red sebebini belirterek işlemi sonlandırın.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4">
            <Textarea 
              placeholder="Red gerekçesini giriniz..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[120px] rounded-2xl border-slate-200"
            />
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-11 rounded-xl" onClick={() => setIsRejectOpen(false)}>{t.cancel}</Button>
            <Button 
              className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent/90" 
              disabled={!actionReason || loadingAction} 
              onClick={() => handleAction(selectedRequest.id, selectedRequest.type, "Rejected", actionReason)}
            >
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reddet"}
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

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "Critical":
      return <Badge className="bg-red-100 text-accent border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">{a.priority.Critical}</Badge>;
    case "High":
      return <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">{a.priority.High}</Badge>;
    case "Normal":
      return <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">{a.priority.Normal}</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">{a.priority.Low}</Badge>;
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
