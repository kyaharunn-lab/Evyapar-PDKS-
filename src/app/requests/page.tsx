"use client"

import * as React from "react"
import { Bell, CheckCircle2, ClipboardList, FileText, Wallet } from "lucide-react"

import LeavesPage from "@/app/leaves/page"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type RequestTab = "leaves" | "advances" | "approvals"

function readLocalArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function isPendingStatus(status: unknown) {
  const normalized = String(status || "").trim().toLowerCase()
  return normalized === "pending" || normalized === "bekliyor"
}

export default function RequestsPage() {
  const [activeTab, setActiveTab] = React.useState<RequestTab>("leaves")
  const [counts, setCounts] = React.useState({ leaves: 0, advances: 0, approvals: 0 })
  const [leaves, setLeaves] = React.useState<any[]>([])
  const [advances, setAdvances] = React.useState<any[]>([])

  const refreshCounts = React.useCallback(() => {
    const nextLeaves = readLocalArray("app_leave_requests")
    const nextAdvances = readLocalArray("app_advance_requests")
    setLeaves(nextLeaves)
    setAdvances(nextAdvances)
    setCounts({
      leaves: nextLeaves.length,
      advances: nextAdvances.length,
      approvals: [...nextLeaves, ...nextAdvances].filter((request) => isPendingStatus(request?.status)).length,
    })
  }, [])

  React.useEffect(() => {
    refreshCounts()
    const handleStorage = (event: StorageEvent) => {
      if (["app_leave_requests", "app_advance_requests"].includes(event.key || "")) {
        refreshCounts()
      }
    }
    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", refreshCounts)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", refreshCounts)
    }
  }, [refreshCounts])

  return (
    <div className="space-y-8 pt-8 md:pt-10 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Talep Merkezi</h2>
          <p className="mt-1 text-base text-muted-foreground">İzin, avans ve onay akışlarını tek merkezden yönetin.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RequestTab)} className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            <RequestTabTrigger value="leaves" icon={ClipboardList} label="İzin Talepleri" count={counts.leaves} />
            <RequestTabTrigger value="advances" icon={FileText} label="Avans Talepleri" count={counts.advances} />
            <RequestTabTrigger value="approvals" icon={Bell} label="Onay Bekleyenler" count={counts.approvals} />
          </TabsList>
        </div>

        <TabsContent value="leaves" className="mt-0 min-h-[520px]">
          <LeavesPage />
        </TabsContent>
        <TabsContent value="advances" className="mt-0 min-h-[520px]">
          <AdvancesPanel advances={advances} />
        </TabsContent>
        <TabsContent value="approvals" className="mt-0 min-h-[520px]">
          <PendingApprovalsPanel leaves={leaves} advances={advances} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getPersonName(request: any) {
  return (
    request?.personName ||
    request?.personnelName ||
    request?.employeeName ||
    [request?.firstName || request?.name, request?.lastName || request?.surname].filter(Boolean).join(" ") ||
    "Personel"
  ).toString()
}

function getDateLabel(request: any) {
  const value = request?.createdAt || request?.requestedAt || request?.date || request?.updatedAt
  if (!value) return "-"
  const date = new Date(value?.toDate ? value.toDate() : value)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("tr-TR")
}

function statusLabel(status: unknown) {
  const normalized = String(status || "").trim().toLowerCase()
  if (normalized === "pending") return "Bekliyor"
  if (normalized === "bekliyor") return "Bekliyor"
  if (normalized === "approved") return "Onaylandı"
  if (normalized === "rejected") return "Reddedildi"
  if (normalized === "cancelled") return "İptal"
  return status ? String(status) : "-"
}

function AdvancesPanel({ advances }: { advances: any[] }) {
  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="border-b bg-slate-50/30">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Avans Talepleri</CardTitle>
          <Badge variant="secondary" className="h-10 rounded-xl bg-white px-4 text-xs font-bold text-primary shadow-sm">
            {advances.length} Toplam Talep
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {advances.length === 0 ? (
          <EmptyState icon={Wallet} title="Henüz avans talebi bulunmuyor" description="Personel avans talepleri oluştuğunda burada listelenir." />
        ) : (
          <Table>
            <TableHeader className="enterprise-table-header">
              <TableRow>
                <TableHead className="pl-6">Personel</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances.map((request, index) => (
                <TableRow key={request?.id || `advance-${index}`} className="hover:bg-slate-50/80">
                  <TableCell className="pl-6 font-bold text-primary">{getPersonName(request)}</TableCell>
                  <TableCell className="text-sm font-bold text-primary">{Number(request?.amount || 0).toLocaleString("tr-TR")} {request?.currency || "₺"}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-slate-600">{request?.reason || request?.description || "-"}</TableCell>
                  <TableCell><StatusPill status={request?.status} /></TableCell>
                  <TableCell className="text-xs text-slate-500">{getDateLabel(request)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function PendingApprovalsPanel({ leaves, advances }: { leaves: any[]; advances: any[] }) {
  const pendingRequests = React.useMemo(() => [
    ...leaves.filter((request) => isPendingStatus(request?.status)).map((request) => ({ ...request, requestType: "İzin" })),
    ...advances.filter((request) => isPendingStatus(request?.status)).map((request) => ({ ...request, requestType: "Avans" })),
  ], [advances, leaves])

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="border-b bg-slate-50/30">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Onay Bekleyenler</CardTitle>
          <Badge variant="secondary" className="h-10 rounded-xl bg-white px-4 text-xs font-bold text-primary shadow-sm">
            {pendingRequests.length} Talep Bekliyor
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {pendingRequests.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Bekleyen talep bulunmuyor" description="Pending veya bekliyor durumundaki izin ve avans talepleri burada görünür." />
        ) : (
          <Table>
            <TableHeader className="enterprise-table-header">
              <TableRow>
                <TableHead className="pl-6">Talep Türü</TableHead>
                <TableHead>Personel</TableHead>
                <TableHead>Özet</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((request, index) => (
                <TableRow key={request?.id || `approval-${index}`} className="hover:bg-slate-50/80">
                  <TableCell className="pl-6">
                    <Badge variant="outline" className="border-primary/15 bg-primary/5 text-xs font-bold text-primary">{request.requestType}</Badge>
                  </TableCell>
                  <TableCell className="font-bold text-primary">{getPersonName(request)}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-xs text-slate-600">
                    {request.requestType === "Avans"
                      ? `${Number(request?.amount || 0).toLocaleString("tr-TR")} ${request?.currency || "₺"}`
                      : request?.leaveType || request?.type || request?.description || "İzin talebi"}
                  </TableCell>
                  <TableCell><StatusPill status={request?.status} /></TableCell>
                  <TableCell className="text-xs text-slate-500">{getDateLabel(request)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function StatusPill({ status }: { status: unknown }) {
  return (
    <Badge variant="outline" className="border-amber-100 bg-amber-50 text-[10px] font-bold uppercase tracking-wider text-amber-700">
      {statusLabel(status)}
    </Badge>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center p-20 text-center">
      <div className="mb-6 rounded-full bg-secondary/50 p-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-primary">{title}</h3>
      <p className="max-w-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function RequestTabTrigger({ value, icon: Icon, label, count }: { value: RequestTab; icon: any; label: string; count: number }) {
  return (
    <TabsTrigger value={value} className="group gap-2 rounded-xl px-4 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg">
      <Icon className="mr-2 h-4 w-4" />
      {label}
      <Badge className="ml-1 h-5 min-w-5 rounded-full border-white/20 bg-slate-100 px-1.5 text-[10px] font-extrabold text-slate-700 shadow-none group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
        {count}
      </Badge>
    </TabsTrigger>
  )
}
