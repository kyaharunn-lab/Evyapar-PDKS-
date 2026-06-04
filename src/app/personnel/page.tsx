"use client"

import * as React from "react"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  QrCode, 
  Building,
  Briefcase,
  Filter,
  User,
  Eye,
  Edit2,
  Info,
  Lock,
  Download,
  Users,
  X,
  Camera,
  FileText,
  Trash2
} from "lucide-react"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { AddPersonnelForm } from "@/components/personnel/add-personnel-form"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase"
import { ensureDefaultAuthSeed } from "@/lib/default-auth-seed"
import { deleteSharedRecord, writeSharedRecord } from "@/lib/shared-data-sync"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const t = translations.common;
const p = translations.personnel;
const PERSONNEL_PHOTO_TYPES = ["image/jpeg", "image/png"]
const PERSONNEL_DOCUMENT_TYPES = ["image/jpeg", "image/png", "application/pdf"]
const PERSONNEL_PHOTO_MAX_BYTES = 5 * 1024 * 1024
const PERSONNEL_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024
const DIGITAL_ARCHIVE_CATEGORIES = ["Kimlik", "Sözleşme", "İşe Giriş Belgesi", "İzin Belgesi", "Sağlık Raporu", "Eğitim/Sertifika", "Diğer"]

async function uploadPersonnelPhoto(file: File) {
  const uploadData = new FormData()
  uploadData.append("file", file)
  uploadData.append("folder", "evyapar-pdks/personnel-photos")
  const response = await fetch("/api/upload", { method: "POST", body: uploadData })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result?.error || "Fotoğraf yüklenemedi.")
  return {
    photoUrl: result.url,
    photoPublicId: result.publicId,
    photoName: result.originalFilename || file.name,
    photoType: file.type,
    avatarUrl: result.url,
  }
}

async function uploadPersonnelDocument(file: File) {
  const uploadData = new FormData()
  uploadData.append("file", file)
  uploadData.append("folder", "evyapar-pdks/digital-archive")
  const response = await fetch("/api/upload", { method: "POST", body: uploadData })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result?.error || "Evrak yüklenemedi.")
  return result
}

function normalizeArchiveRecord(document: any, source = "manual") {
  return {
    id: document?.id || `archive-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: document?.title || document?.name || "Evrak",
    fileName: document?.fileName || document?.attachmentName || "evrak",
    fileUrl: document?.fileUrl || document?.attachmentUrl || "",
    publicId: document?.publicId || document?.attachmentPublicId || "",
    fileType: document?.fileType || document?.attachmentType || "",
    resourceType: document?.resourceType || document?.attachmentResourceType || "",
    format: document?.format || "",
    size: Number(document?.size || document?.bytes || 0),
    category: document?.category || "Diğer",
    source: document?.source || source,
    relatedLeaveRequestId: document?.relatedLeaveRequestId || "",
    uploadedAt: document?.uploadedAt || document?.attachmentUploadedAt || new Date().toISOString(),
    uploadedBy: document?.uploadedBy || "admin",
  }
}

async function downloadRemoteFile(url: string, filename: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = filename || "evrak"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

function formatFileSize(bytes: number) {
  if (!bytes) return "-"
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function syncAllPersonnelToFirestore(db: any, personnel: any[]) {
  console.log("personnel sync start", personnel.length)
  try {
    await Promise.all(personnel.map((person) => writeSharedRecord(db, "personnel", person)))
    console.log("personnel sync success")
  } catch (error) {
    console.error("personnel sync failed", error)
  }
}

export default function PersonnelPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("");

  const PERSONNEL_STORAGE_KEY = "app_personnel"
  const [employees, setEmployees] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedEmployee, setSelectedEmployee] = React.useState<any | null>(null)
  const [documentForm, setDocumentForm] = React.useState({ name: "", category: "Diğer" })
  const [documentFile, setDocumentFile] = React.useState<File | null>(null)
  const [documentUploading, setDocumentUploading] = React.useState(false)

  const [localBranches, setLocalBranches] = React.useState<any[]>([])
  const [localDepartments, setLocalDepartments] = React.useState<any[]>([])
  const [localPositions, setLocalPositions] = React.useState<any[]>([])
  const [localRoles, setLocalRoles] = React.useState<any[]>([])

  const loadEmployees = React.useCallback(() => {
    try {
      ensureDefaultAuthSeed()
      const raw = localStorage.getItem(PERSONNEL_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      setEmployees(Array.isArray(parsed) ? parsed : [])
    } catch {
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [])

  const persistEmployees = React.useCallback((next: any[]) => {
    try {
      const rawPrevious = localStorage.getItem(PERSONNEL_STORAGE_KEY)
      const parsedPrevious = rawPrevious ? JSON.parse(rawPrevious) : []
      const previous = Array.isArray(parsedPrevious) ? parsedPrevious : []
      localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(next))
      void syncAllPersonnelToFirestore(db, next)
      const nextIds = new Set(next.map((person) => (person?.id || "").toString()).filter(Boolean))
      previous.forEach((person) => {
        const id = (person?.id || "").toString()
        if (id && !nextIds.has(id)) {
          void deleteSharedRecord(db, "personnel", id)
        }
      })
      next.forEach((person) => {
        if (person?.id) {
          void writeSharedRecord(db, "personnel", person).then((ok) => {
            console.info("[Firestore personnel write]", {
              collectionPath: "personnel",
              recordId: person.id,
              status: ok ? "success" : "error",
            })
          })
        }
      })
    } catch (error) {
      console.warn("[Firestore personnel write] local persist/mirror failed", error)
      // ignore storage errors
    }
  }, [db])

  React.useEffect(() => {
    loadEmployees()

    const onStorage = (e: StorageEvent) => {
      if (e.key === PERSONNEL_STORAGE_KEY) loadEmployees()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [loadEmployees])

  React.useEffect(() => {
    const readFromLocalStorage = (keysToTry: string[]) => {
      for (const key of keysToTry) {
        try {
          const raw = localStorage.getItem(key)
          if (!raw) continue
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) return parsed
        } catch {
          // ignore and continue
        }
      }
      return []
    }

    setLocalBranches(readFromLocalStorage(["app_branches", "evyapar_pdks_branches_local_v1"]))
    setLocalDepartments(readFromLocalStorage(["app_departments", "evyapar_pdks_departments_local_v1"]))
    setLocalPositions(readFromLocalStorage(["app_positions"]))
    setLocalRoles(readFromLocalStorage(["app_roles", "evyapar_pdks_roles_local_v1"]))
  }, [])

  const upsertEmployee = React.useCallback((updated: any) => {
    void writeSharedRecord(db, "personnel", updated).then((ok) => {
      console.info("[Firestore personnel write]", {
        collectionPath: "personnel",
        recordId: updated?.id,
        status: ok ? "success" : "error",
      })
      if (!ok) {
        toast({
          variant: "destructive",
          title: "Firestore personel yazımı başarısız",
          description: "Personel localStorage'a kaydedildi; Firestore personnel koleksiyonuna yazılamadı.",
        })
      }
    })
    setEmployees((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const idx = list.findIndex((e) => e?.id === updated?.id)
      const next =
        idx >= 0
          ? [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
          : [updated, ...list]
      persistEmployees(next)
      return next
    })
  }, [db, persistEmployees, toast])

  const getBranchLabel = React.useCallback((branchId: string | undefined) => {
    if (!branchId) return "-"
    const match = localBranches.find((b) => [b?.id, b?.branchCode, b?.code].filter(Boolean).map(String).includes(branchId))
    return match?.branchName || match?.name || match?.title || branchId
  }, [localBranches])

  const getDepartmentLabel = React.useCallback((departmentId: string | undefined) => {
    if (!departmentId) return "-"
    const match = localDepartments.find((d) => [d?.id, d?.departmentCode, d?.code].filter(Boolean).map(String).includes(departmentId))
    return match?.departmentName || match?.name || match?.title || departmentId
  }, [localDepartments])

  const getPositionLabel = React.useCallback((positionId: string | undefined) => {
    if (!positionId) return "-"
    const match = localPositions.find((pos) => [pos?.id, pos?.positionCode, pos?.code].filter(Boolean).map(String).includes(positionId))
    return match?.positionName || match?.name || match?.title || positionId
  }, [localPositions])

  const getRoleLabel = React.useCallback((roleId: string | undefined) => {
    if (!roleId) return "-"
    const match = localRoles.find((r) => [r?.id, r?.roleCode, r?.code].filter(Boolean).map(String).includes(roleId))
    return match?.roleName || match?.name || match?.title || roleId
  }, [localRoles])

  const getRolePermissions = React.useCallback((roleId: string | undefined) => {
    const role = localRoles.find((item) => [item?.id, item?.roleCode, item?.code].filter(Boolean).map(String).includes(roleId || ""))
    const managerRole = /müdür|mudur/i.test((role?.roleName || role?.name || role?.title || "").toString())
    const permissions = role?.permissions || {}
    return {
      panelAccess: Boolean(permissions.panelAccess ?? role?.panelAccess ?? managerRole),
      mobileAccess: Boolean(permissions.mobileAccess ?? role?.mobileAccess ?? true),
      pageAccess: Array.from(new Set([
        ...(Array.isArray(permissions.pageAccess) ? permissions.pageAccess : []),
        ...(managerRole ? ["organization", "leave_requests", "requests"] : []),
      ])),
      branchAccess: Array.isArray(permissions.branchAccess) ? permissions.branchAccess : [],
    }
  }, [localRoles])

  const filteredEmployees = React.useMemo(() => {
    if (!employees) return [];
    return employees.filter((emp: any) => 
      !emp.isDeleted && (
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.departmentId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [employees, searchTerm]);

  const selectedArchiveItems = React.useMemo(() => {
    if (!selectedEmployee) return []
    const digitalArchive = Array.isArray(selectedEmployee.digitalArchive) ? selectedEmployee.digitalArchive : []
    const legacyDocuments = Array.isArray(selectedEmployee.documents) ? selectedEmployee.documents : []
    const seen = new Set<string>()
    return [...digitalArchive.map((item: any) => normalizeArchiveRecord(item)), ...legacyDocuments.map((item: any) => normalizeArchiveRecord(item, "employmentDocument"))]
      .filter((item) => {
        const key = item.id || item.publicId || item.fileUrl
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
  }, [selectedEmployee])

  const [editForm, setEditForm] = React.useState<any>({
    name: "",
    surname: "",
    phone: "",
    email: "",
    password: "",
    branchId: "",
    departmentId: "",
    position: "",
    workType: "Office",
    role: "",
    status: "Active",
    notes: "",
  })
  const [editPhotoFile, setEditPhotoFile] = React.useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = React.useState("")

  React.useEffect(() => {
    if (!selectedEmployee || !isEditOpen) return
    setEditForm({
      name: selectedEmployee.name || "",
      surname: selectedEmployee.surname || "",
      phone: selectedEmployee.phone || "",
      email: selectedEmployee.email || "",
      password: selectedEmployee.password || "",
      branchId: selectedEmployee.branchId || "",
      departmentId: selectedEmployee.departmentId || "",
      position: selectedEmployee.position || "",
      workType: selectedEmployee.workType || "Office",
      role: selectedEmployee.role || "",
      status: selectedEmployee.status || "Active",
      notes: selectedEmployee.notes || "",
    })
    setEditPhotoFile(null)
    setEditPhotoPreview(selectedEmployee.photoUrl || selectedEmployee.avatarUrl || "")
  }, [selectedEmployee, isEditOpen])

  const handleGenerateQr = React.useCallback((emp: any) => {
    if (!emp) return
    const qrId = emp.qrId || `QR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const updated = { ...emp, qrId, updatedAt: Date.now() }
    upsertEmployee(updated)
    toast({ title: "Başarılı", description: "QR kimliği oluşturuldu." })
  }, [toast, upsertEmployee])

  const handleSuspend = React.useCallback((emp: any) => {
    if (!emp) return
    const updated = { ...emp, status: "Inactive", updatedAt: Date.now() }
    upsertEmployee(updated)
    toast({ title: "Başarılı", description: "Hesap askıya alındı." })
  }, [toast, upsertEmployee])

  const handleDelete = React.useCallback((emp: any) => {
    if (!emp?.id) return
    setEmployees((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const next = list.filter((e) => e?.id !== emp.id)
      persistEmployees(next)
      return next
    })
    toast({ title: "Başarılı", description: "Personel silindi." })
  }, [db, persistEmployees, toast])

  const handleOpenProfile = React.useCallback((emp: any) => {
    setSelectedEmployee(emp)
    setDocumentForm({ name: "", category: "Diğer" })
    setDocumentFile(null)
    setIsProfileOpen(true)
  }, [])

  const handleOpenEdit = React.useCallback((emp: any) => {
    setSelectedEmployee(emp)
    setIsEditOpen(true)
  }, [])

  const openProfileAfterMenuClose = React.useCallback((emp: any) => {
    window.setTimeout(() => handleOpenProfile(emp), 0)
  }, [handleOpenProfile])

  const openEditAfterMenuClose = React.useCallback((emp: any) => {
    window.setTimeout(() => handleOpenEdit(emp), 0)
  }, [handleOpenEdit])

  React.useEffect(() => {
    if (isAddOpen || isProfileOpen || isEditOpen || typeof document === "undefined") return
    const cleanup = window.setTimeout(() => {
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""
      document.body.removeAttribute("data-scroll-locked")
      document.body.removeAttribute("inert")
    }, 50)
    return () => window.clearTimeout(cleanup)
  }, [isAddOpen, isProfileOpen, isEditOpen])

  const handleUploadDocument = React.useCallback(async () => {
    if (!selectedEmployee) return
    if (!documentForm.name.trim()) {
      toast({ variant: "destructive", title: "Evrak adı gerekli", description: "Lütfen evrak adını girin." })
      return
    }
    if (!documentFile) {
      toast({ variant: "destructive", title: "Dosya gerekli", description: "JPG, PNG veya PDF seçin." })
      return
    }
    if (!PERSONNEL_DOCUMENT_TYPES.includes(documentFile.type)) {
      toast({ variant: "destructive", title: "Geçersiz dosya", description: "Sadece JPG, PNG veya PDF yükleyebilirsiniz." })
      return
    }
    if (documentFile.size > PERSONNEL_DOCUMENT_MAX_BYTES) {
      toast({ variant: "destructive", title: "Dosya çok büyük", description: "Dosya boyutu en fazla 5 MB olabilir." })
      return
    }

    setDocumentUploading(true)
    try {
      const result = await uploadPersonnelDocument(documentFile)
      const now = new Date().toISOString()
      const archiveRecord = {
        id: `archive-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: documentForm.name.trim(),
        fileName: result.originalFilename || documentFile.name,
        fileType: documentFile.type,
        fileUrl: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        format: result.format,
        size: result.bytes || documentFile.size,
        uploadedAt: now,
        category: documentForm.category.trim() || "Diğer",
        source: documentForm.category === "İşe Giriş Belgesi" ? "employmentDocument" : "manual",
        uploadedBy: "admin",
      }
      const updated = {
        ...selectedEmployee,
        digitalArchive: [archiveRecord, ...(Array.isArray(selectedEmployee.digitalArchive) ? selectedEmployee.digitalArchive : [])],
        updatedAt: Date.now(),
      }
      upsertEmployee(updated)
      setSelectedEmployee(updated)
      setDocumentForm({ name: "", category: "Diğer" })
      setDocumentFile(null)
      toast({ title: "Başarılı", description: "Dijital arşiv dosyası yüklendi." })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Evrak yüklenemedi",
        description: error instanceof Error ? error.message : "Cloudinary yüklemesi başarısız oldu.",
      })
    } finally {
      setDocumentUploading(false)
    }
  }, [documentFile, documentForm.category, documentForm.name, selectedEmployee, toast, upsertEmployee])

  const handleDeleteDocument = React.useCallback((documentId: string) => {
    if (!selectedEmployee || !window.confirm("Bu evrak kaydını silmek istediğinize emin misiniz?")) return
    const updated = {
      ...selectedEmployee,
      digitalArchive: (Array.isArray(selectedEmployee.digitalArchive) ? selectedEmployee.digitalArchive : []).filter((item: any) => item?.id !== documentId),
      documents: (Array.isArray(selectedEmployee.documents) ? selectedEmployee.documents : []).filter((item: any) => item?.id !== documentId),
      updatedAt: Date.now(),
    }
    upsertEmployee(updated)
    setSelectedEmployee(updated)
    toast({ title: "Başarılı", description: "Evrak kaydı silindi." })
  }, [selectedEmployee, toast, upsertEmployee])

  const handleSaveEdit = React.useCallback(async () => {
    if (!selectedEmployee) return
    if (!editForm.name?.trim() || !editForm.surname?.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Ad ve Soyad zorunludur.",
      })
      return
    }
    if (!editForm.phone?.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Telefon zorunludur.",
      })
      return
    }
    if (!editForm.email?.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "E-posta zorunludur.",
      })
      return
    }
    if (!editForm.password?.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şifre zorunludur.",
      })
      return
    }
    if (!editForm.branchId?.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şube seçimi zorunludur.",
      })
      return
    }
    if (!editForm.role?.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Rol seçimi zorunludur.",
      })
      return
    }

    let photoFields: Record<string, string> = {}
    if (editPhotoFile) {
      if (!PERSONNEL_PHOTO_TYPES.includes(editPhotoFile.type)) {
        toast({ variant: "destructive", title: "Geçersiz fotoğraf", description: "Sadece JPG veya PNG yükleyebilirsiniz." })
        return
      }
      if (editPhotoFile.size > PERSONNEL_PHOTO_MAX_BYTES) {
        toast({ variant: "destructive", title: "Fotoğraf çok büyük", description: "Dosya boyutu en fazla 5 MB olabilir." })
        return
      }
      try {
        photoFields = await uploadPersonnelPhoto(editPhotoFile)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Fotoğraf yüklenemedi",
          description: error instanceof Error ? error.message : "Cloudinary yüklemesi başarısız oldu.",
        })
        return
      }
    }

    const rolePermissions = getRolePermissions(editForm.role)
    const updated = {
      ...selectedEmployee,
      ...editForm,
      ...photoFields,
      departmentId: editForm.departmentId || undefined,
      hasAdminAccess: rolePermissions.panelAccess,
      hasMobileAccess: rolePermissions.mobileAccess,
      pageAccess: rolePermissions.pageAccess,
      branchAccess: rolePermissions.branchAccess,
      rolePermissions,
      fullName: `${editForm.name} ${editForm.surname}`,
      updatedAt: Date.now(),
    }
    upsertEmployee(updated)
    try {
      const raw = localStorage.getItem("app_access_control")
      const parsed = raw ? JSON.parse(raw) : []
      const list = Array.isArray(parsed) ? parsed : []
      const existing = list.find((item: any) => item?.personnelId === updated.id)
      const now = Date.now()
      const accessRecord = {
        id: existing?.id || `access-${now}-${Math.random().toString(16).slice(2)}`,
        personnelId: updated.id,
        roleId: editForm.role,
        panelAccess: rolePermissions.panelAccess,
        mobileAccess: rolePermissions.mobileAccess,
        pageAccess: rolePermissions.pageAccess,
        branchAccess: rolePermissions.branchAccess,
        status: updated.status === "Inactive" ? "Inactive" : "Active",
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      }
      const nextAccess = existing ? list.map((item: any) => item.personnelId === updated.id ? accessRecord : item) : [accessRecord, ...list]
      localStorage.setItem("app_access_control", JSON.stringify(nextAccess))
      window.dispatchEvent(new Event("app-access-updated"))
    } catch {
      // ignore access sync errors
    }
    setIsEditOpen(false)
    setEditPhotoFile(null)
    toast({ title: "Başarılı", description: "Personel bilgileri güncellendi." })
  }, [editForm, editPhotoFile, getRolePermissions, selectedEmployee, toast, upsertEmployee])

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">{p.title}</h2>
          <p className="text-muted-foreground mt-1 text-base">{p.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 px-5 border-slate-200 hover:bg-slate-50 transition-colors">
            <QrCode className="mr-2 h-4 w-4" />
            {p.generateIds}
          </Button>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="h-11 px-6 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            {p.addEmployee}
          </Button>
        </div>
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="relative w-full lg:w-[450px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={t.search} 
                className="pl-11 h-11 bg-white border-slate-200 focus:ring-primary/20 transition-all"
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
                {p.totalCount.replace('{count}', (filteredEmployees?.length || 0).toString())}
              </Badge>
              <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-slate-100">
                <Download className="h-5 w-5 text-slate-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{searchTerm ? t.noData : p.empty}</h3>
              <p className="text-muted-foreground max-w-xs mb-6">
                {searchTerm ? "Farklı bir arama terimi deneyin." : p.emptySub}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  {p.addEmployee}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px] pl-6">{p.avatar}</TableHead>
                  <TableHead className="font-bold">{p.name}</TableHead>
                  <TableHead className="font-bold">{p.deptPos}</TableHead>
                  <TableHead className="font-bold">{p.location}</TableHead>
                  <TableHead className="font-bold">{p.workType}</TableHead>
                  <TableHead className="font-bold">{t.status}</TableHead>
                  <TableHead className="text-right pr-6 font-bold">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp: any) => (
                  <TableRow key={emp.id} className="group hover:bg-slate-50/80 transition-all cursor-pointer">
                    <TableCell className="pl-6">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-md transition-transform group-hover:scale-105">
                        <AvatarImage src={emp.photoUrl || emp.avatarUrl} alt={emp.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                          {emp.name?.charAt(0)}{emp.surname?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary text-base group-hover:text-accent transition-colors">{emp.name} {emp.surname}</span>
                        <span className="text-[11px] font-mono font-medium text-slate-400 mt-0.5">{emp.personnelCode || emp.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-sm font-semibold text-slate-700">
                          <Building className="mr-2 h-3.5 w-3.5 text-slate-400" />
                          {getDepartmentLabel(emp.departmentId)}
                        </div>
                        <div className="flex items-center text-[12px] font-medium text-slate-500">
                          <Briefcase className="mr-2 h-3.5 w-3.5 text-slate-400" />
                          {getPositionLabel(emp.position)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-600">
                      <div className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2.5"></span>
                        {getBranchLabel(emp.branchId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold px-3 py-1 tracking-wider border-slate-200",
                        emp.workType === "Office" ? "bg-blue-50 text-blue-700" : 
                        emp.workType === "Field" ? "bg-orange-50 text-orange-700" : "bg-purple-50 text-purple-700"
                      )}>
                        {emp.workType || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider",
                          emp.status === "Active" ? "badge-aktif" : "badge-pasif"
                        )}
                      >
                        {emp.status === "Active" ? t.active : t.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-200 transition-colors">
                            <MoreHorizontal className="h-5 w-5 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-2xl border-slate-100">
                          <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t.actions}</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer" onSelect={() => openProfileAfterMenuClose(emp)}>
                            <Eye className="mr-3 h-4 w-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">{p.viewProfile}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer" onSelect={() => openEditAfterMenuClose(emp)}>
                            <Edit2 className="mr-3 h-4 w-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">{p.editDetails}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer" onClick={() => handleGenerateQr(emp)}>
                            <QrCode className="mr-3 h-4 w-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">{p.generateQr}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1.5" />
                          <DropdownMenuItem
                            className="rounded-lg py-2.5 cursor-pointer text-accent focus:text-accent focus:bg-accent/5"
                            onClick={() => handleSuspend(emp)}
                          >
                            <Lock className="mr-3 h-4 w-4" />
                            <span className="font-bold">{p.deactivate}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-lg py-2.5 cursor-pointer text-accent focus:text-accent focus:bg-accent/5"
                            onClick={() => handleDelete(emp)}
                          >
                            <span className="font-bold">Sil</span>
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

      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent side="right" className="w-full overflow-hidden sm:max-w-[900px] p-0 border-none">
          <div className="h-full flex flex-col">
            <header className="p-8 pb-4 flex justify-between items-start bg-white border-b">
              <div className="space-y-1">
                <SheetTitle className="text-2xl font-extrabold text-primary">Yeni Personel Ekle</SheetTitle>
                <SheetDescription>
                  Personel bilgilerini eksiksiz girerek sisteme yeni çalışan kaydı oluşturun.
                </SheetDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </header>
            <ScrollArea className="flex-1 p-4 sm:p-8">
              <AddPersonnelForm 
                onSuccess={() => {
                  loadEmployees()
                  setIsAddOpen(false)
                }} 
                onCancel={() => setIsAddOpen(false)} 
              />
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Profil Detay Paneli */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <header className="p-8 pb-6 flex justify-between items-start bg-white border-b">
              <div className="space-y-1">
                <SheetTitle className="text-2xl font-extrabold text-primary">Personel Profili</SheetTitle>
                <SheetDescription>Seçilen personelin detayları.</SheetDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsProfileOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </header>
            <ScrollArea className="flex-1 p-8">
              {selectedEmployee && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                      <AvatarImage src={selectedEmployee.photoUrl || selectedEmployee.avatarUrl} alt={selectedEmployee.name} className="object-cover" />
                      <AvatarFallback className="bg-primary/5 text-primary text-lg font-extrabold">
                        {selectedEmployee.name?.charAt(0)}{selectedEmployee.surname?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xl font-extrabold text-primary">
                        {selectedEmployee.name} {selectedEmployee.surname}
                      </span>
                      <span className="text-[11px] font-mono font-medium text-slate-400 mt-0.5">
                        {selectedEmployee.personnelCode || selectedEmployee.id}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <InfoRow label="Şube" value={getBranchLabel(selectedEmployee.branchId)} />
                    <InfoRow label="Departman" value={getDepartmentLabel(selectedEmployee.departmentId)} />
                    <InfoRow label="Pozisyon" value={getPositionLabel(selectedEmployee.position)} />
                    <InfoRow label="Çalışma Türü" value={selectedEmployee.workType || "-"} />
                    <InfoRow label="Yetki Rolü" value={getRoleLabel(selectedEmployee.role)} />
                    <InfoRow label="Durum" value={selectedEmployee.status === "Active" ? t.active : t.inactive} />
                    <InfoRow label="Telefon" value={selectedEmployee.phone || "-"} />
                    <InfoRow label="E-posta" value={selectedEmployee.email || "-"} />
                  </div>
                  <Card className="overflow-hidden border-slate-100 shadow-sm">
                    <CardHeader className="border-b bg-slate-50/70">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Dijital Arsiv</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Evrak Basligi</Label>
                            <Input value={documentForm.name} onChange={(event) => setDocumentForm((prev) => ({ ...prev, name: event.target.value }))} className="h-10 rounded-xl bg-white" placeholder="Kimlik Fotokopisi" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Kategori</Label>
                            <Select value={documentForm.category} onValueChange={(value) => setDocumentForm((prev) => ({ ...prev, category: value }))}>
                              <SelectTrigger className="h-10 rounded-xl bg-white">
                                <SelectValue placeholder="Kategori sec" />
                              </SelectTrigger>
                              <SelectContent>
                                {DIGITAL_ARCHIVE_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <label className="block cursor-pointer rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50">
                          <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
                          {documentFile ? `${documentFile.name} - ${formatFileSize(documentFile.size)}` : "JPG, PNG veya PDF sec"}
                        </label>
                        <Button type="button" disabled={documentUploading} onClick={handleUploadDocument} className="h-10 rounded-xl bg-primary hover:bg-primary/90">
                          {documentUploading ? "Yukleniyor..." : "Arsive Yukle"}
                        </Button>
                      </div>

                      {selectedArchiveItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm font-bold text-slate-400">Henuz dijital arsiv dosyasi yok.</div>
                      ) : (
                        <div className="space-y-3">
                          {selectedArchiveItems.map((document: any) => (
                            <div key={document.id || document.fileUrl} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                              <div className="flex items-start gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/5 text-primary">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-extrabold text-primary">{document.title || "Evrak"}</div>
                                  <div className="mt-1 text-xs font-semibold text-slate-500">{document.fileName || "-"} - {document.fileType || "-"} - {formatFileSize(Number(document.size || 0))}</div>
                                  <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                    {document.category || "Diger"} - {document.source || "manual"} - {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString("tr-TR") : "-"}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button asChild variant="outline" size="sm" className="h-8 rounded-lg"><a href={document.fileUrl} target="_blank" rel="noopener noreferrer">Goruntule</a></Button>
                                <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => downloadRemoteFile(document.fileUrl, document.fileName || document.title || "evrak")}>Indir</Button>
                                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-accent hover:bg-red-50 hover:text-accent" onClick={() => handleDeleteDocument(document.id)}>
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                  Sil
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Personel Düzenle Paneli */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[900px] p-0 border-none">
          <div className="h-full flex flex-col">
            <header className="p-8 pb-4 flex justify-between items-start bg-white border-b">
              <div className="space-y-1">
                <SheetTitle className="text-2xl font-extrabold text-primary">Personel Detayları</SheetTitle>
                <SheetDescription>Seçilen personelin bilgilerini güncelleyin.</SheetDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </header>
            <ScrollArea className="flex-1 p-8">
              <div className="space-y-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-sm bg-slate-50/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                          <User className="h-5 w-5" />
                          <h3 className="font-bold">Profil Bilgileri</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Ad <span className="text-red-500">*</span></Label>
                            <Input value={editForm.name} onChange={(e) => setEditForm((p: any) => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Soyad <span className="text-red-500">*</span></Label>
                            <Input value={editForm.surname} onChange={(e) => setEditForm((p: any) => ({ ...p, surname: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>E-posta <span className="text-red-500">*</span></Label>
                            <Input type="email" value={editForm.email} onChange={(e) => setEditForm((p: any) => ({ ...p, email: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Şifre <span className="text-red-500">*</span></Label>
                            <Input type="password" value={editForm.password} onChange={(e) => setEditForm((p: any) => ({ ...p, password: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Telefon <span className="text-red-500">*</span></Label>
                            <Input value={editForm.phone} onChange={(e) => setEditForm((p: any) => ({ ...p, phone: e.target.value }))} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-50/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                          <Briefcase className="h-5 w-5" />
                          <h3 className="font-bold">Çalışma Bilgileri</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Şube <span className="text-red-500">*</span></Label>
                            <Select value={editForm.branchId} onValueChange={(v) => setEditForm((p: any) => ({ ...p, branchId: v }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Şube seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {localBranches?.length > 0 ? (
                                  localBranches.map((b: any) => {
                                    const value = (b?.id || b?.branchCode || "").toString()
                                    const label = (b?.branchName || b?.name || b?.title || "").toString()
                                    if (!value || !label) return null
                                    return <SelectItem key={value} value={value}>{label}</SelectItem>
                                  })
                                ) : (
                                  <SelectItem value="none" disabled>Kayıtlı şube yok</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Departman</Label>
                            <Select value={editForm.departmentId} onValueChange={(v) => setEditForm((p: any) => ({ ...p, departmentId: v }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Departman seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {localDepartments?.length > 0 ? (
                                  localDepartments.map((d: any) => {
                                    const value = (d?.id || d?.departmentCode || d?.code || "").toString()
                                    const label = (d?.departmentName || d?.name || d?.title || "").toString()
                                    if (!value || !label) return null
                                    return <SelectItem key={value} value={value}>{label}</SelectItem>
                                  })
                                ) : (
                                  <SelectItem value="none" disabled>Kayıtlı departman yok</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Pozisyon</Label>
                            <Input value={editForm.position} onChange={(e) => setEditForm((p: any) => ({ ...p, position: e.target.value }))} />
                          </div>

                          <div className="space-y-2">
                            <Label>Çalışma Türü</Label>
                            <Select value={editForm.workType} onValueChange={(v) => setEditForm((p: any) => ({ ...p, workType: v }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seçiniz" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Office">Ofis</SelectItem>
                                <SelectItem value="Field">Saha</SelectItem>
                                <SelectItem value="Remote">Uzaktan</SelectItem>
                                <SelectItem value="Hybrid">Hibrit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Yetki Rolü <span className="text-red-500">*</span></Label>
                            <Select value={editForm.role} onValueChange={(v) => setEditForm((p: any) => ({ ...p, role: v }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Rol seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {localRoles?.length > 0 ? (
                                  localRoles.map((r: any) => {
                                    const value = (r?.id || r?.roleCode || r?.code || "").toString()
                                    const label = (r?.roleName || r?.name || r?.title || "").toString()
                                    if (!value || !label) return null
                                    return <SelectItem key={value} value={value}>{label}</SelectItem>
                                  })
                                ) : (
                                  <SelectItem value="none" disabled>Kayıtlı rol yok</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Durum</Label>
                            <Select value={editForm.status} onValueChange={(v) => setEditForm((p: any) => ({ ...p, status: v }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Aktif</SelectItem>
                                <SelectItem value="Inactive">Pasif</SelectItem>
                                <SelectItem value="Probation">Deneme</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-50/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                          <Info className="h-5 w-5" />
                          <h3 className="font-bold">Notlar</h3>
                        </div>
                        <Textarea
                          className="min-h-[120px]"
                          value={editForm.notes}
                          onChange={(e) => setEditForm((p: any) => ({ ...p, notes: e.target.value }))}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="sticky top-0 border-primary/10 shadow-lg overflow-hidden">
                      <div className="bg-primary p-6 text-white text-center">
                        <div className="relative inline-block">
                          <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
                            <AvatarImage src={editPhotoPreview || selectedEmployee?.photoUrl || selectedEmployee?.avatarUrl || ""} />
                            <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">
                              {editForm.name?.charAt(0)}{editForm.surname?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            type="button"
                            size="icon"
                            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent hover:bg-accent/90 border-2 border-primary"
                            onClick={() => document.getElementById("edit-personnel-photo-input")?.click()}
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                          <input
                            id="edit-personnel-photo-input"
                            type="file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null
                              if (!file) return
                              if (!PERSONNEL_PHOTO_TYPES.includes(file.type)) {
                                toast({ variant: "destructive", title: "Geçersiz fotoğraf", description: "Sadece JPG veya PNG yükleyebilirsiniz." })
                                return
                              }
                              if (file.size > PERSONNEL_PHOTO_MAX_BYTES) {
                                toast({ variant: "destructive", title: "Fotoğraf çok büyük", description: "Dosya boyutu en fazla 5 MB olabilir." })
                                return
                              }
                              setEditPhotoFile(file)
                              setEditPhotoPreview(URL.createObjectURL(file))
                            }}
                          />
                        </div>
                        <h4 className="mt-4 text-lg font-bold truncate">
                          {editForm.name || "Ad"} {editForm.surname || "Soyad"}
                        </h4>
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                          {selectedEmployee?.registryNo ? `SİCİL: ${selectedEmployee.registryNo}` : "SİCİL NO"}
                        </p>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Şube</span>
                          <span className="font-semibold text-primary">{getBranchLabel(editForm.branchId)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Departman</span>
                          <span className="font-semibold text-primary">{getDepartmentLabel(editForm.departmentId)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Rol</span>
                          <Badge variant="outline" className="font-bold border-primary/20">{getRoleLabel(editForm.role)}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] bg-white border-t p-4 px-8 flex justify-between items-center z-50">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Vazgeç</Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => selectedEmployee && handleGenerateQr(selectedEmployee)}>
                  QR Kimlik Oluştur
                </Button>
                <Button type="button" onClick={handleSaveEdit} className="min-w-[140px] bg-primary hover:bg-primary/90">
                  Kaydet
                </Button>
              </div>
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
