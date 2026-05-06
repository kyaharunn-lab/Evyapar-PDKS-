
"use client"

import * as React from "react"
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  UserCircle,
  Eye,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  X,
  FileSpreadsheet
} from "lucide-react"
import { format, differenceInDays, parseISO } from "date-fns"
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
  serverTimestamp,
  Timestamp 
} from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

const t = translations.common;
const l = translations.leaves;

export default function LeaveRequestsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedRequest, setSelectedRequest] = React.useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isRejectOpen, setIsRejectOpen] = React.useState(false)
  const [isApproveOpen, setIsApproveOpen] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [loadingAction, setLoadingAction] = React.useState(false)

  // Real-time queries
  const leavesQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "leave_requests"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: rawRequests, loading: loadingLeaves } = useCollection(leavesQuery);
  const { data: personnel } = useCollection(db ? collection(db, "personnel") : null);

  // Merge request data with personnel data
  const mergedRequests = React.useMemo(() => {
    if (!rawRequests || !personnel) return [];
    return rawRequests.map(req => ({
      ...req,
      person: personnel.find(p => p.id === req.personnelId)
    })).filter(req => 
      !searchTerm || 
      req.person?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.person?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.person?.registryNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawRequests, personnel, searchTerm]);

  // KPI Calculations
  const stats = React.useMemo(() => {
    const pending = mergedRequests.filter(r => r.status === "Pending").length;
    const approved = mergedRequests.filter(r => r.status === "Approved").length;
    const rejected = mergedRequests.filter(r => r.status === "Rejected").length;
    const today = format(new Date(), "yyyy-MM-dd");
    const onLeaveToday = mergedRequests.filter(r => 
      r.status === "Approved" && 
      today >= r.startDate && 
      today <= r.endDate
    ).length;
    
    return { pending, approved, rejected, onLeaveToday };
  }, [mergedRequests]);

  const handleUpdateStatus = async (requestId: string, status: string, reason?: string) => {
    if (!db) return;
    setLoadingAction(true);
    try {
      const requestRef = doc(db, "leave_requests", requestId);
      await updateDoc(requestRef, {
        status,
        approvedBy: user?.email || "System",
        rejectionReason: reason || "",
        updatedAt: serverTimestamp()
      });

      // Audit Log
      await addDoc(collection(db, "audit_logs"), {
        action: `Leave ${status}`,
        requestId,
        performedBy: user?.email || "System",
        timestamp: serverTimestamp()
      });

      toast({
        title: t.save,
        description: `Talep durumu ${status} olarak güncellendi.`,
      });
      
      setIsRejectOpen(false);
      setIsApproveOpen(false);
      setIsDetailOpen(false);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-accent" />
            {l.title}
          </h2>
          <p className="text-muted-foreground mt-1">{l.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
            <Plus className="mr-2 h-4 w-4" />
            {l.newRequest}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title={l.pendingRequests} value={stats.pending} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" />
        <KPICard title={l.approvedLeaves} value={stats.approved} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title={l.rejectedLeaves} value={stats.rejected} icon={XCircle} color="text-accent" bg="bg-red-50" />
        <KPICard title={l.onLeaveToday} value={stats.onLeaveToday} icon={Calendar} color="text-primary" bg="bg-primary/5" />
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
                {mergedRequests.length} Toplam Talep
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLeaves ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : mergedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <ClipboardList className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{l.empty}</h3>
              <p className="text-muted-foreground max-w-xs">{l.emptySub}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">{t.personnel}</TableHead>
                  <TableHead>{l.leaveType}</TableHead>
                  <TableHead>{l.startDate}</TableHead>
                  <TableHead>{l.endDate}</TableHead>
                  <TableHead>{l.totalDays}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="text-right pr-6">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedRequests.map((req) => (
                  <TableRow key={req.id} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={req.person?.avatarUrl} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {req.person?.name?.charAt(0)}{req.person?.surname?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{req.person?.name} {req.person?.surname}</span>
                          <span className="text-[10px] font-mono text-slate-400">{req.person?.registryNo || "-"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold border-slate-200">
                        {l.types[req.leaveType as keyof typeof l.types] || req.leaveType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{req.startDate || "-"}</TableCell>
                    <TableCell className="text-sm font-medium">{req.endDate || "-"}</TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-primary">{req.totalDays || "0"} Gün</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={req.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <MoreHorizontal className="h-5 w-5 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                          <DropdownMenuItem onClick={() => { setSelectedRequest(req); setIsDetailOpen(true); }}>
                            <Eye className="mr-3 h-4 w-4 text-slate-400" />
                            {l.viewDetails || "Detayları Gör"}
                          </DropdownMenuItem>
                          {req.status === "Pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-green-600 focus:text-green-600 focus:bg-green-50" onClick={() => { setSelectedRequest(req); setIsApproveOpen(true); }}>
                                <Check className="mr-3 h-4 w-4" />
                                {t.approve || "Onayla"}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-accent focus:text-accent focus:bg-accent/5" onClick={() => { setSelectedRequest(req); setIsRejectOpen(true); }}>
                                <X className="mr-3 h-4 w-4" />
                                {t.decline || "Reddet"}
                              </DropdownMenuItem>
                            </>
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
          {selectedRequest && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-8 pb-6 border-b bg-white">
                <SheetTitle className="text-2xl font-extrabold text-primary">Talep Detayları</SheetTitle>
                <SheetDescription>Seçili izin talebine ait tüm bilgiler ve onay geçmişi.</SheetDescription>
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
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label={l.leaveType} value={l.types[selectedRequest.leaveType as keyof typeof l.types] || selectedRequest.leaveType} />
                  <DetailItem label={l.totalDays} value={`${selectedRequest.totalDays || 0} Gün`} />
                  <DetailItem label={l.startDate} value={selectedRequest.startDate || "-"} />
                  <DetailItem label={l.endDate} value={selectedRequest.endDate || "-"} />
                  <DetailItem label="Şube" value={selectedRequest.person?.branchId || "-"} />
                  <DetailItem label="Departman" value={selectedRequest.person?.departmentId || "-"} />
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">Talep Açıklaması</h5>
                  <div className="p-4 bg-white border rounded-xl min-h-[100px] text-sm text-slate-600 italic">
                    "{selectedRequest.notes || "Bu talep için herhangi bir açıklama girilmemiş."}"
                  </div>
                </div>

                {selectedRequest.status === "Rejected" && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-accent mb-2">{l.rejectionReason}</h5>
                    <p className="text-sm text-accent/80 leading-relaxed">{selectedRequest.rejectionReason}</p>
                  </div>
                )}
              </div>
              
              <div className="p-8 border-t bg-slate-50/50 flex gap-3">
                <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setIsDetailOpen(false)}>{t.cancel}</Button>
                {selectedRequest.status === "Pending" && (
                  <div className="flex-1 flex gap-2">
                    <Button variant="outline" className="flex-1 h-11 rounded-xl text-accent border-accent/20" onClick={() => setIsRejectOpen(true)}>Red</Button>
                    <Button className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700" onClick={() => setIsApproveOpen(true)}>Onayla</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Approve Confirmation */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-green-600 text-white">
            <DialogTitle className="text-2xl font-bold">{l.confirmApproval}</DialogTitle>
            <DialogDescription className="text-white/80">Bu izin talebini onaylamak istediğinizden emin misiniz?</DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <div className="flex items-center gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <p className="text-sm font-medium text-green-800">Personelin izin bakiyesi otomatik olarak düşülecektir.</p>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-11 rounded-xl" onClick={() => setIsApproveOpen(false)}>{t.cancel}</Button>
            <Button 
              className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700"
              disabled={loadingAction}
              onClick={() => handleUpdateStatus(selectedRequest.id, "Approved")}
            >
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Onayla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-accent text-white">
            <DialogTitle className="text-2xl font-bold">{l.confirmRejection}</DialogTitle>
            <DialogDescription className="text-white/80">Red sebebini belirterek talebi sonlandırın.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4">
            <label className="text-sm font-bold text-slate-700">{l.rejectionReason} <span className="text-accent">*</span></label>
            <Textarea 
              placeholder={l.rejectionReasonPlaceholder}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-accent/20"
            />
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-11 rounded-xl" onClick={() => setIsRejectOpen(false)}>{t.cancel}</Button>
            <Button 
              className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent/90"
              disabled={!rejectionReason || loadingAction}
              onClick={() => handleUpdateStatus(selectedRequest.id, "Rejected", rejectionReason)}
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Pending":
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-100 font-bold px-3 py-1 rounded-lg">{l.status.Pending}</Badge>;
    case "Approved":
      return <Badge className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1 rounded-lg">{l.status.Approved}</Badge>;
    case "Rejected":
      return <Badge className="bg-red-50 text-accent border-red-100 font-bold px-3 py-1 rounded-lg">{l.status.Rejected}</Badge>;
    case "Cancelled":
      return <Badge className="bg-slate-50 text-slate-600 border-slate-200 font-bold px-3 py-1 rounded-lg">{l.status.Cancelled}</Badge>;
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
