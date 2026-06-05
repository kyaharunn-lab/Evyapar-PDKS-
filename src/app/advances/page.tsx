
"use client"

import * as React from "react"
import { 
  Wallet, 
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
  CreditCard,
  FileSpreadsheet,
  Banknote
} from "lucide-react"
import { format } from "date-fns"

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
import { formatDateTimeTR, formatDateTR } from "@/lib/date-time"
import { Textarea } from "@/components/ui/textarea"

const t = translations.common;
const a = translations.advances;

export default function AdvanceRequestsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedRequest, setSelectedRequest] = React.useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isRejectOpen, setIsRejectOpen] = React.useState(false)
  const [isApproveOpen, setIsApproveOpen] = React.useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
  const [actionReason, setActionReason] = React.useState("")
  const [loadingAction, setLoadingAction] = React.useState(false)

  // Real-time queries
  const advancesQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "advance_requests"), orderBy("createdAt", "desc"));
  }, [db]);

  const personnelQuery = React.useMemo(() => {
    return db ? collection(db, "personnel") : null;
  }, [db]);

  const { data: rawRequests, loading: loadingAdvances } = useCollection(advancesQuery);
  const { data: personnel } = useCollection(personnelQuery);

  // Merge request data with personnel data
  const mergedRequests = React.useMemo(() => {
    if (!rawRequests || !personnel) return [];
    const requests = rawRequests as any[];
    const people = personnel as any[];
    return requests.map((req: any) => ({
      ...req,
      person: people.find((p: any) => p.id === req.personnelId)
    })).filter((req: any) =>
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
    
    // Sum of paid amounts this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidThisMonth = mergedRequests
      .filter(r => r.status === "Paid" && r.paymentDate?.toDate() >= startOfMonth)
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    
    return { pending, approved, rejected, paidThisMonth };
  }, [mergedRequests]);

  const handleUpdateStatus = async (requestId: string, status: string, additionalData: any = {}) => {
    if (!db) return;
    setLoadingAction(true);
    try {
      const requestRef = doc(db, "advance_requests", requestId);
      const updatePayload: any = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData
      };

      if (status === "Approved") updatePayload.approvedBy = user?.email || "System";
      if (status === "Rejected") updatePayload.rejectedBy = user?.email || "System";
      if (status === "Paid") {
        updatePayload.paidBy = user?.email || "System";
        updatePayload.paymentDate = serverTimestamp();
      }

      await updateDoc(requestRef, updatePayload);

      // Audit Log
      await addDoc(collection(db, "audit_logs"), {
        action: `Advance ${status}`,
        requestId,
        performedBy: user?.email || "System",
        timestamp: serverTimestamp(),
        ...additionalData
      });

      toast({
        title: t.save,
        description: `Talep durumu ${status} olarak güncellendi.`,
      });
      
      setIsRejectOpen(false);
      setIsApproveOpen(false);
      setIsPaymentOpen(false);
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

  const openDetailAfterMenuClose = React.useCallback((request: any) => {
    window.setTimeout(() => {
      setSelectedRequest(request)
      setIsDetailOpen(true)
    }, 0)
  }, [])

  const openApproveAfterMenuClose = React.useCallback((request: any) => {
    window.setTimeout(() => {
      setSelectedRequest(request)
      setIsApproveOpen(true)
    }, 0)
  }, [])

  const openRejectAfterMenuClose = React.useCallback((request: any) => {
    window.setTimeout(() => {
      setSelectedRequest(request)
      setIsRejectOpen(true)
    }, 0)
  }, [])

  const openPaymentAfterMenuClose = React.useCallback((request: any) => {
    window.setTimeout(() => {
      setSelectedRequest(request)
      setIsPaymentOpen(true)
    }, 0)
  }, [])

  React.useEffect(() => {
    if (isDetailOpen || isRejectOpen || isApproveOpen || isPaymentOpen || typeof document === "undefined") return
    const cleanup = window.setTimeout(() => {
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""
      document.body.removeAttribute("data-scroll-locked")
      document.body.removeAttribute("inert")
    }, 50)
    return () => window.clearTimeout(cleanup)
  }, [isDetailOpen, isRejectOpen, isApproveOpen, isPaymentOpen])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Wallet className="h-8 w-8 text-accent" />
            {a.title}
          </h2>
          <p className="text-muted-foreground mt-1">{a.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
            <Plus className="mr-2 h-4 w-4" />
            {a.newRequest}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title={a.pendingRequests} value={stats.pending} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" />
        <KPICard title={a.approvedAdvances} value={stats.approved} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title={a.rejectedAdvances} value={stats.rejected} icon={XCircle} color="text-accent" bg="bg-red-50" />
        <KPICard title={a.paidThisMonth} value={`${stats.paidThisMonth.toLocaleString()} ₺`} icon={Banknote} color="text-primary" bg="bg-primary/5" />
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
          {loadingAdvances ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : mergedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <Wallet className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{a.empty}</h3>
              <p className="text-muted-foreground max-w-xs">{a.emptySub}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">{t.personnel}</TableHead>
                  <TableHead>{a.amount}</TableHead>
                  <TableHead>{a.reason}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{a.paymentDate || "İşlem Tarihi"}</TableHead>
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
                      <span className="text-sm font-bold text-primary">
                        {(parseFloat(req.amount) || 0).toLocaleString()} {req.currency || "₺"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600 truncate max-w-[150px] inline-block">
                        {req.reason || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={req.status} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDateTimeTR(req.createdAt)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                            <MoreHorizontal className="h-5 w-5 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
                          <DropdownMenuItem onSelect={() => openDetailAfterMenuClose(req)}>
                            <Eye className="mr-3 h-4 w-4 text-slate-400" />
                            Detayları Gör
                          </DropdownMenuItem>
                          {req.status === "Pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-green-600" onSelect={() => openApproveAfterMenuClose(req)}>
                                <Check className="mr-3 h-4 w-4" />
                                {t.approve}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-accent" onSelect={() => openRejectAfterMenuClose(req)}>
                                <X className="mr-3 h-4 w-4" />
                                {t.decline}
                              </DropdownMenuItem>
                            </>
                          )}
                          {req.status === "Approved" && (
                            <DropdownMenuItem className="text-primary font-bold" onSelect={() => openPaymentAfterMenuClose(req)}>
                              <CreditCard className="mr-3 h-4 w-4" />
                              {t.paid}
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
          {selectedRequest && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-8 pb-6 border-b bg-white">
                <SheetTitle className="text-2xl font-extrabold text-primary">Avans Detayları</SheetTitle>
                <SheetDescription>Seçili avans talebine ait tüm bilgiler ve finansal süreç.</SheetDescription>
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
                  <DetailItem label={a.amount} value={`${(parseFloat(selectedRequest.amount) || 0).toLocaleString()} ${selectedRequest.currency || "₺"}`} />
                  <DetailItem label={a.limit} value={`${(selectedRequest.person?.salary?.advanceLimit || 0).toLocaleString()} ₺`} />
                  <DetailItem label="Talep Tarihi" value={formatDateTimeTR(selectedRequest.createdAt)} />
                  <DetailItem label={a.paymentDate} value={selectedRequest.paymentDate?.toDate ? formatDateTR(selectedRequest.paymentDate.toDate()) : (selectedRequest.status === "Approved" ? "Ödeme Bekleniyor" : "-")} />
                  <DetailItem label="IBAN" value={selectedRequest.iban || selectedRequest.person?.salary?.iban || "-"} />
                  <DetailItem label="Ödeme Yöntemi" value={selectedRequest.paymentMethod || "Banka Havalesi"} />
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">Talep Nedeni</h5>
                  <div className="p-4 bg-white border rounded-xl min-h-[80px] text-sm text-slate-600">
                    {selectedRequest.reason || "Belirtilmemiş."}
                  </div>
                </div>

                {selectedRequest.rejectionReason && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-accent mb-2">{a.rejectionReason}</h5>
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
                {selectedRequest.status === "Approved" && (
                  <Button className="flex-1 h-11 rounded-xl bg-primary" onClick={() => setIsPaymentOpen(true)}>Ödeme İşle</Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Action Dialogs */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-green-600 text-white">
            <DialogTitle className="text-2xl font-bold">Avansı Onayla</DialogTitle>
            <DialogDescription className="text-white/80">Bu avans talebini onaylamak istediğinizden emin misiniz?</DialogDescription>
          </DialogHeader>
          <div className="p-8">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Onaylanan avanslar ödeme listesine eklenecek ve muhasebe birimine bildirilecektir.
            </p>
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-11 rounded-xl" onClick={() => setIsApproveOpen(false)}>{t.cancel}</Button>
            <Button className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700" disabled={loadingAction} onClick={() => handleUpdateStatus(selectedRequest.id, "Approved")}>
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Onayla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-accent text-white">
            <DialogTitle className="text-2xl font-bold">{a.rejectionReason}</DialogTitle>
            <DialogDescription className="text-white/80">Red sebebini belirterek talebi sonlandırın.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4">
            <Textarea 
              placeholder={a.rejectionReason}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[120px] rounded-2xl border-slate-200"
            />
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-11 rounded-xl" onClick={() => setIsRejectOpen(false)}>{t.cancel}</Button>
            <Button className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent/90" disabled={!actionReason || loadingAction} onClick={() => handleUpdateStatus(selectedRequest.id, "Rejected", { rejectionReason: actionReason })}>
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reddet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">{a.confirmPayment}</DialogTitle>
            <DialogDescription className="text-white/80">Ödeme işleminin tamamlandığını onaylayın.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4">
            <Textarea 
              placeholder={a.paymentNote}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[120px] rounded-2xl border-slate-200"
            />
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" className="flex-1 h-11 rounded-xl" onClick={() => setIsPaymentOpen(false)}>{t.cancel}</Button>
            <Button className="flex-1 h-11 rounded-xl bg-primary" disabled={loadingAction} onClick={() => handleUpdateStatus(selectedRequest.id, "Paid", { paymentNote: actionReason })}>
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ödendi Olarak İşaretle"}
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
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-100 font-bold px-3 py-1 rounded-lg">{a.status.Pending}</Badge>;
    case "Approved":
      return <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-bold px-3 py-1 rounded-lg">{a.status.Approved}</Badge>;
    case "Rejected":
      return <Badge className="bg-red-50 text-accent border-red-100 font-bold px-3 py-1 rounded-lg">{a.status.Rejected}</Badge>;
    case "Paid":
      return <Badge className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1 rounded-lg">{a.status.Paid}</Badge>;
    case "Cancelled":
      return <Badge className="bg-slate-50 text-slate-600 border-slate-200 font-bold px-3 py-1 rounded-lg">{a.status.Cancelled}</Badge>;
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
