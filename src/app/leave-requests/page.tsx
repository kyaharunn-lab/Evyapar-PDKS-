"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  FileText,
  X,
  Check,
  Trash2,
  Edit2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Users
} from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { tr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { DATE_INPUT_PROPS, formatDateTimeTR, formatDateTR, formatTimeValueTR } from "@/lib/date-time"
import { deleteSharedRecord, useFirestoreLocalMirror, writeSharedRecord } from "@/lib/shared-data-sync"

const LEAVE_REQUESTS_KEY = "app_leave_requests"
const PERSONNEL_KEY = "app_personnel"

const LEAVE_TYPES = [
  { value: "annual", label: "Yıllık İzin" },
  { value: "sick", label: "Hastalık İzni" },
  { value: "excuse", label: "Mazeret İzni" },
  { value: "unpaid", label: "Ücretsiz İzin" },
  { value: "hourly", label: "Saatlik İzin" }
]

const URGENCY_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Acil" }
]

const STATUS_OPTIONS = [
  { value: "pending", label: "Bekliyor", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  { value: "approved", label: "Onaylandı", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  { value: "rejected", label: "Reddedildi", icon: XCircle, color: "text-red-600", bg: "bg-red-50" }
]

const getPersonnelName = (person: any) => {
  return (person?.fullName || [person?.name, person?.surname].filter(Boolean).join(" ") || [person?.firstName, person?.lastName].filter(Boolean).join(" ") || person?.personnelCode || "Personel").toString()
}

interface LeaveRequest {
  id: string
  personId: string
  personName: string
  leaveType: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  description: string
  urgency: "normal" | "urgent"
  coveringPersonId?: string
  coveringPersonName?: string
  attachments?: string[]
  status: "pending" | "approved" | "rejected"
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export default function LeaveRequestsPage() {
  const { toast } = useToast()
  const db = useFirestore()

  // State
  const [leaveRequests, setLeaveRequests] = React.useState<LeaveRequest[]>([])
  const [personnel, setPersonnel] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Modal states
  const [isLeaveModalOpen, setIsLeaveModalOpen] = React.useState(false)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isRejectOpen, setIsRejectOpen] = React.useState(false)
  const [selectedRequest, setSelectedRequest] = React.useState<LeaveRequest | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [isEditing, setIsEditing] = React.useState(false)

  // Form states
  const [formData, setFormData] = React.useState({
    personId: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    description: "",
    urgency: "normal",
    coveringPersonId: "",
    attachments: [] as File[]
  })
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Load data
  const loadData = React.useCallback(() => {
    try {
      const requests = localStorage.getItem(LEAVE_REQUESTS_KEY)
      const personnelData = localStorage.getItem(PERSONNEL_KEY)

      const parsedRequests = requests ? JSON.parse(requests) : []
      const parsedPersonnel = personnelData ? JSON.parse(personnelData) : []

      setLeaveRequests(Array.isArray(parsedRequests) ? parsedRequests : [])
      setPersonnel(Array.isArray(parsedPersonnel) ? parsedPersonnel.filter((p: any) => !p?.isDeleted) : [])
    } catch (error) {
      console.error("Error loading data:", error)
      setLeaveRequests([])
      setPersonnel([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LEAVE_REQUESTS_KEY || e.key === PERSONNEL_KEY) {
        loadData()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [loadData])

  const leaveSyncTargets = React.useMemo(() => [{ collectionName: "leaveRequests", storageKey: LEAVE_REQUESTS_KEY }], [])
  useFirestoreLocalMirror(db, leaveSyncTargets, loadData)

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.personId) errors.personId = "Personel seçiniz"
    if (!formData.leaveType) errors.leaveType = "İzin türü seçiniz"
    if (!formData.startDate) errors.startDate = "Başlangıç tarihi seçiniz"
    if (!formData.endDate) errors.endDate = "Bitiş tarihi seçiniz"

    if (formData.startDate && formData.endDate) {
      const start = parseISO(formData.startDate)
      const end = parseISO(formData.endDate)
      if (start > end) {
        errors.endDate = "Bitiş tarihi başlangıç tarihinden sonra olmalı"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Create leave request
  const handleCreate = () => {
    if (!validateForm()) return

    const selectedPerson = personnel.find(p => p.id === formData.personId)
    const personName = selectedPerson ? getPersonnelName(selectedPerson) : "Bilinmiyor"

    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      personId: formData.personId,
      personName,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
      urgency: "normal",
      attachments: [],
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updated = [newRequest, ...leaveRequests]
    localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(updated))
    setLeaveRequests(updated)
    void writeSharedRecord(db, "leaveRequests", newRequest)

    toast({
      title: "Başarılı",
      description: "İzin talebi oluşturuldu.",
      duration: 3000
    })

    resetForm()
    setIsCreateOpen(false)
  }

  // Update leave request
  const handleUpdate = () => {
    if (!validateForm() || !selectedRequest) return

    const selectedPerson = personnel.find(p => p.id === formData.personId)

    const updated = leaveRequests.map(req =>
      req.id === selectedRequest.id
        ? {
            ...selectedRequest,
            personId: formData.personId,
            personName: selectedPerson ? getPersonnelName(selectedPerson) : selectedRequest.personName,
            leaveType: formData.leaveType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            startTime: undefined,
            endTime: undefined,
            description: formData.description,
            urgency: "normal" as const,
            coveringPersonId: undefined,
            coveringPersonName: undefined,
            updatedAt: new Date().toISOString()
          }
        : req
    )

    localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(updated))
    setLeaveRequests(updated)
    void writeSharedRecord(db, "leaveRequests", updated.find((req) => req.id === selectedRequest.id))

    toast({
      title: "Başarılı",
      description: "İzin talebi güncellendi.",
      duration: 3000
    })

    resetForm()
    setIsCreateOpen(false)
    setIsDetailOpen(false)
  }

  // Delete leave request
  const handleDelete = (id: string) => {
    const updated = leaveRequests.filter(req => req.id !== id)
    localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(updated))
    setLeaveRequests(updated)
    void deleteSharedRecord(db, "leaveRequests", id)

    toast({
      title: "Başarılı",
      description: "İzin talebi silindi.",
      duration: 3000
    })
  }

  // Approve leave request
  const handleApprove = (id: string) => {
    const updated = leaveRequests.map(req =>
      req.id === id
        ? { ...req, status: "approved" as const, updatedAt: new Date().toISOString() }
        : req
    )

    localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(updated))
    setLeaveRequests(updated)
    void writeSharedRecord(db, "leaveRequests", updated.find((req) => req.id === id))

    toast({
      title: "Başarılı",
      description: "İzin talebi onaylandı.",
      duration: 3000
    })

    setIsDetailOpen(false)
  }

  const handleRejectById = (id: string, reason?: string) => {
    const updated = leaveRequests.map(req =>
      req.id === id
        ? {
            ...req,
            status: "rejected" as const,
            rejectionReason: reason?.trim() || undefined,
            updatedAt: new Date().toISOString()
          }
        : req
    )

    localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(updated))
    setLeaveRequests(updated)
    void writeSharedRecord(db, "leaveRequests", updated.find((req) => req.id === id))

    toast({
      title: "Başarılı",
      description: "İzin talebi reddedildi.",
      duration: 3000
    })

    setIsDetailOpen(false)
  }

  // Reject leave request
  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen reddetme nedenini giriniz.",
        variant: "destructive",
        duration: 3000
      })
      return
    }

    handleRejectById(selectedRequest.id, rejectionReason)
    setIsRejectOpen(false)
    setRejectionReason("")
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      personId: "",
      leaveType: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      description: "",
      urgency: "normal",
      coveringPersonId: "",
      attachments: []
    })
    setFormErrors({})
    setIsEditing(false)
  }

  // Open edit modal
  const openEditForm = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setFormData({
      personId: request.personId,
      leaveType: request.leaveType,
      startDate: request.startDate,
      endDate: request.endDate,
      startTime: request.startTime || "",
      endTime: request.endTime || "",
      description: request.description,
      urgency: request.urgency,
      coveringPersonId: request.coveringPersonId || "",
      attachments: []
    })
    setIsEditing(true)
    setIsDetailOpen(false)
    setIsCreateOpen(true)
  }

  // Filter data
  const filteredRequests = React.useMemo(() => {
    return leaveRequests.filter(req => {
      const matchesSearch = req.personName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || req.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [leaveRequests, searchTerm, statusFilter])

  const getStatusOption = (status: string) =>
    STATUS_OPTIONS.find(opt => opt.value === status)

  const getLeaveTypeLabel = (type: string) =>
    LEAVE_TYPES.find(t => t.value === type)?.label || type

  const calculateDays = (start: string, end: string) => {
    try {
      const diff = differenceInDays(parseISO(end), parseISO(start)) + 1
      return diff
    } catch {
      return 0
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">İzin Talepleri</h2>
          <p className="text-muted-foreground mt-1 text-base">Personel izin taleplerini yönetin</p>
        </div>
        <Button
          onClick={() => {
            alert("buton çalışıyor")
            setIsLeaveModalOpen(true)
          }}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Yeni İzin Talebi
        </Button>
      </div>

      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-primary">Yeni İzin Talebi</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsLeaveModalOpen(false)}
              className="rounded-xl h-10"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Personel adı ara..."
            className="pl-9 h-10 rounded-xl bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-10 rounded-xl border-slate-200 bg-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Durum Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Card */}
      <Card className="premium-card">
        <CardHeader className="border-b bg-slate-50/10">
          <CardTitle className="text-lg font-bold text-primary">
            İzin Talepleri ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-sm font-bold">
                {leaveRequests.length === 0 ? "Henüz izin talebi oluşturulmadı." : "Arama kriterlerine uygun sonuç bulunamadı."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50/50">
                    <TableHead className="font-bold text-slate-700">Personel</TableHead>
                    <TableHead className="font-bold text-slate-700">İzin Türü</TableHead>
                    <TableHead className="font-bold text-slate-700">Tarih Aralığı</TableHead>
                    <TableHead className="font-bold text-slate-700">Durum</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const statusOpt = getStatusOption(request.status)
                    const startFormatted = formatDateTR(request.startDate)
                    const endFormatted = formatDateTR(request.endDate)

                    return (
                      <TableRow key={request.id} className="border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="font-bold text-slate-900">
                          {request.personName}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {getLeaveTypeLabel(request.leaveType)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {startFormatted} - {endFormatted}
                          </div>
                        </TableCell>
                        <TableCell>
                          {statusOpt && (() => {
                            const StatusIcon = statusOpt.icon

                            return (
                              <Badge
                                className={cn(
                                  "font-bold border-0",
                                  statusOpt.bg,
                                  statusOpt.color
                                )}
                              >
                                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                                {statusOpt.label}
                              </Badge>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="font-bold">İşlemler</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openEditForm(request)}
                                className="cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleApprove(request.id)}
                                className="cursor-pointer text-green-600"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Onayla
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRejectById(request.id)}
                                className="cursor-pointer text-red-600"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reddet
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(request.id)}
                                className="cursor-pointer text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-primary">
              {isEditing ? "İzin Talebini Düzenle" : "Yeni İzin Talebi Oluştur"}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? "İzin talebinin detaylarını güncelleyin." : "Yeni izin talebi oluşturun."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Personel Selection */}
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Personel *</Label>
              <Select value={formData.personId} onValueChange={(value) => {
                setFormData({ ...formData, personId: value })
                if (formErrors.personId) setFormErrors({ ...formErrors, personId: "" })
              }}>
                <SelectTrigger className={cn(
                  "rounded-xl h-11 border-slate-200",
                  formErrors.personId && "border-red-500"
                )}>
                  <SelectValue placeholder="Personel seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {personnel.length > 0 ? (
                    personnel.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {getPersonnelName(person)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-personnel" disabled>Kayıtlı personel yok</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formErrors.personId && (
                <p className="text-xs text-red-600 font-medium">{formErrors.personId}</p>
              )}
            </div>

            {/* Leave Type */}
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">İzin Türü *</Label>
              <Select value={formData.leaveType} onValueChange={(value) => {
                setFormData({ ...formData, leaveType: value })
                if (formErrors.leaveType) setFormErrors({ ...formErrors, leaveType: "" })
              }}>
                <SelectTrigger className={cn(
                  "rounded-xl h-11 border-slate-200",
                  formErrors.leaveType && "border-red-500"
                )}>
                  <SelectValue placeholder="İzin türü seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.leaveType && (
                <p className="text-xs text-red-600 font-medium">{formErrors.leaveType}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Başlangıç Tarihi *</Label>
                <Input
                  {...DATE_INPUT_PROPS}
                  value={formData.startDate}
                  onChange={(e) => {
                    setFormData({ ...formData, startDate: e.target.value })
                    if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: "" })
                  }}
                  className={cn(
                    "rounded-xl h-11 border-slate-200",
                    formErrors.startDate && "border-red-500"
                  )}
                />
                {formErrors.startDate && (
                  <p className="text-xs text-red-600 font-medium">{formErrors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Bitiş Tarihi *</Label>
                <Input
                  {...DATE_INPUT_PROPS}
                  value={formData.endDate}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value })
                    if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: "" })
                  }}
                  className={cn(
                    "rounded-xl h-11 border-slate-200",
                    formErrors.endDate && "border-red-500"
                  )}
                />
                {formErrors.endDate && (
                  <p className="text-xs text-red-600 font-medium">{formErrors.endDate}</p>
                )}
              </div>
            </div>

            {/* Total Days Display */}
            {formData.startDate && formData.endDate && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs font-bold text-green-700 mb-1">TOPLAM İZİN SÜRESİ</p>
                <p className="text-2xl font-extrabold text-green-700">
                  {calculateDays(formData.startDate, formData.endDate)} gün
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Açıklama</Label>
              <Textarea
                placeholder="İzin talebi hakkında detaylı açıklama giriniz (opsiyonel)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl border-slate-200 min-h-24 resize-none"
              />
            </div>

          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false)
                resetForm()
              }}
              className="rounded-xl h-10"
            >
              İptal Et
            </Button>
            <Button
              onClick={isEditing ? handleUpdate : handleCreate}
              className="bg-primary hover:bg-primary/90 rounded-xl h-10"
            >
              {isEditing ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      {selectedRequest && (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent side="right" className="w-full sm:w-[600px] rounded-l-2xl">
            <SheetHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-2xl font-extrabold text-primary">
                    İzin Talebi Detayı
                  </SheetTitle>
                  <SheetDescription className="text-slate-500 font-medium mt-1">
                    Talebinin tam bilgileri
                  </SheetDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-full h-8 w-8 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Personnel Card */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-600 mb-3">PERSONELİ</p>
                <p className="text-lg font-extrabold text-slate-900">
                  {selectedRequest.personName}
                </p>
              </div>

              {/* Leave Type & Days */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-600 mb-2">İZİN TÜRÜ</p>
                  <p className="font-bold text-slate-900">
                    {getLeaveTypeLabel(selectedRequest.leaveType)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-600 mb-2">TOPLAM</p>
                  <p className="text-2xl font-extrabold text-primary">
                    {selectedRequest.leaveType === "hourly" ? (
                      <>
                        <span className="text-sm font-bold">
                          {formatTimeValueTR(selectedRequest.startTime)} - {formatTimeValueTR(selectedRequest.endTime)}
                        </span>
                      </>
                    ) : (
                      `${calculateDays(selectedRequest.startDate, selectedRequest.endDate)} gün`
                    )}
                  </p>
                </div>
              </div>

              {/* Urgency */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-600 mb-3">ACİLİYET DURUMU</p>
                <Badge
                  className={cn(
                    "font-bold border-0",
                    selectedRequest.urgency === "urgent"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  )}
                >
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  {selectedRequest.urgency === "urgent" ? "Acil" : "Normal"}
                </Badge>
              </div>

              {/* Date Range */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-600 mb-3">TARİH ARALIGI</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-bold text-slate-900">
                      {formatDateTR(selectedRequest.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-bold text-slate-900">
                      {formatDateTR(selectedRequest.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-600 mb-3">DURUM</p>
                {(() => {
                  const statusOpt = getStatusOption(selectedRequest.status)
                  if (!statusOpt) return null
                  const StatusIcon = statusOpt.icon

                  return (
                    <Badge
                      className={cn(
                        "font-bold border-0 text-sm",
                        statusOpt.bg,
                        statusOpt.color
                      )}
                    >
                      <StatusIcon className="h-4 w-4 mr-2" />
                      {statusOpt.label}
                    </Badge>
                  )
                })()}
              </div>

              {/* Description */}
              {selectedRequest.description && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-600 mb-3">AÇIKLAMA</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedRequest.description}
                  </p>
                </div>
              )}

              <LeaveAttachmentBlock request={selectedRequest} />

              {/* Hourly Time Info */}
              {selectedRequest.leaveType === "hourly" && selectedRequest.startTime && selectedRequest.endTime && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 mb-3">SAATLİK İZİN SÜRESİ</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-slate-900">
                      {formatTimeValueTR(selectedRequest.startTime)} - {formatTimeValueTR(selectedRequest.endTime)}
                    </span>
                  </div>
                </div>
              )}

              {/* Covering Personnel */}
              {selectedRequest.coveringPersonName && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-600 mb-3">YERİNE BAKACAK PERSONELİ</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="font-bold text-slate-900">{selectedRequest.coveringPersonName}</p>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-700 mb-3">REDDETME NEDENİ</p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                  <div>
                    <p className="font-bold mb-1">Oluşturulma</p>
                    <p>{formatDateTimeTR(selectedRequest.createdAt)}</p>
                  </div>
                  <div>
                    <p className="font-bold mb-1">Son Güncelleme</p>
                    <p>{formatDateTimeTR(selectedRequest.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedRequest.status === "pending" && (
                <div className="space-y-3 pt-4 border-t">
                  <Button
                    onClick={() => openEditForm(selectedRequest)}
                    variant="outline"
                    className="w-full rounded-xl h-10"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="bg-green-600 hover:bg-green-700 rounded-xl h-10"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Onayla
                    </Button>
                    <Button
                      onClick={() => setIsRejectOpen(true)}
                      variant="destructive"
                      className="rounded-xl h-10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reddet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Rejection Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-primary">
              İzin Talebini Reddet
            </DialogTitle>
            <DialogDescription>
              Reddetme nedenini belirtiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Reddetme nedenini giriniz..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="rounded-xl border-slate-200 min-h-24 resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectOpen(false)
                setRejectionReason("")
              }}
              className="rounded-xl h-10"
            >
              İptal Et
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              className="rounded-xl h-10"
            >
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LeaveAttachmentBlock({ request }: { request: any }) {
  const url = request?.attachmentUrl
  const name = request?.attachmentName || "Ek dosya"
  const type = String(request?.attachmentType || "")
  const size = Number(request?.attachmentSize || 0)
  const sizeLabel = size ? `${(size / 1024 / 1024).toFixed(2)} MB` : ""

  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <p className="text-xs font-bold text-slate-600 mb-3">EK</p>
      {!url ? (
        <p className="text-sm font-bold text-slate-400">Ek yok</p>
      ) : (
        <div className="space-y-3">
          {type.startsWith("image/") ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl bg-slate-950">
              <img src={url} alt={name} className="max-h-60 w-full object-contain" />
            </a>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900">{name}</p>
                <p className="text-xs font-semibold text-slate-500">{type || "Dosya"}{sizeLabel ? ` · ${sizeLabel}` : ""}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="h-9 rounded-xl">
              <a href={url} target="_blank" rel="noopener noreferrer">{type === "application/pdf" ? "PDF Aç" : "Aç"}</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
