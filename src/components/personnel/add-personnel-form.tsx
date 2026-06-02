
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  User, 
  Briefcase, 
  ShieldCheck, 
  Fingerprint, 
  Wallet,
  PhoneCall, 
  QrCode, 
  Camera,
  Loader2,
  Plus,
  Building,
  Info
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { writeSharedRecord } from "@/lib/shared-data-sync"

const personnelSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  surname: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  tcId: z.string().length(11, "TC Kimlik No 11 hane olmalıdır"),
  registryNo: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(4, "Şifre en az 4 karakter olmalıdır"),
  address: z.string().optional(),
  branchId: z.string().min(1, "Şube seçimi zorunludur"),
  departmentId: z.string().optional().or(z.literal("")),
  position: z.string().optional(),
  workType: z.enum(["Office", "Field", "Remote", "Hybrid"]),
  startDate: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Probation"]),
  role: z.string().min(1, "Rol seçimi zorunludur"),
  hasAdminAccess: z.boolean().default(false),
  hasMobileAccess: z.boolean().default(true),
  qrId: z.string().optional(),
  deviceId: z.string().optional(),
  cardId: z.string().optional(),
  faceVerification: z.boolean().default(false),
  locationVerification: z.boolean().default(true),
  offlineAccess: z.boolean().default(false),
  defaultShiftId: z.string().optional(),
  weeklyHours: z.string().optional(),
  overtimeAllowed: z.boolean().default(true),
  salaryAmount: z.string().optional(),
  salaryType: z.enum(["Monthly", "Daily", "Hourly"]),
  salaryCurrency: z.enum(["TRY", "EUR", "USD"]),
  salaryIban: z.string().optional(),
  salaryBankName: z.string().optional(),
  salaryPaymentDay: z.string().optional(),
  salaryAdvanceLimit: z.string().optional(),
  salaryOvertimeMultiplier: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
})

type PersonnelFormValues = z.infer<typeof personnelSchema>

async function syncAllPersonnelToFirestore(db: any, personnel: any[]) {
  console.log("personnel sync start", personnel.length)
  try {
    await Promise.all(personnel.map((person) => writeSharedRecord(db, "personnel", person)))
    console.log("personnel sync success")
  } catch (error) {
    console.error("personnel sync failed", error)
  }
}

interface AddPersonnelFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AddPersonnelForm({ onSuccess, onCancel }: AddPersonnelFormProps) {
  const db = useFirestore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [localBranches, setLocalBranches] = React.useState<any[]>([])
  const [loadingLocalBranches, setLoadingLocalBranches] = React.useState(true)
  const [localDepartments, setLocalDepartments] = React.useState<any[]>([])
  const [loadingLocalDepartments, setLoadingLocalDepartments] = React.useState(true)
  const [localRoles, setLocalRoles] = React.useState<any[]>([])
  const [loadingLocalRoles, setLoadingLocalRoles] = React.useState(true)

  // Real-time collection data
  // NOTE: Select/dropdown sources are intentionally localStorage-backed (no Firestore reads).

  const PERSONNEL_STORAGE_KEY = "app_personnel"
  const ACCESS_STORAGE_KEY = "app_access_control"

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

  const getRoleLabel = React.useCallback((roleId: string | undefined) => {
    if (!roleId) return "-"
    const match = localRoles.find((r) => [r?.id, r?.roleCode, r?.code].filter(Boolean).map(String).includes(roleId))
    return match?.roleName || match?.name || match?.title || roleId
  }, [localRoles])

  const getRoleById = React.useCallback((roleId: string | undefined) => {
    if (!roleId) return undefined
    return localRoles.find((role) => [role?.id, role?.roleCode, role?.code].filter(Boolean).map(String).includes(roleId))
  }, [localRoles])

  const getRolePermissions = React.useCallback((roleId: string | undefined) => {
    const role = getRoleById(roleId)
    const managerRole = /müdür|mudur/i.test((role?.roleName || role?.name || role?.title || "").toString())
    const permissions = role?.permissions || {}
    return {
      panelAccess: Boolean(permissions.panelAccess ?? role?.panelAccess ?? managerRole),
      mobileAccess: Boolean(permissions.mobileAccess ?? role?.mobileAccess ?? true),
      pageAccess: Array.from(new Set([
        ...((Array.isArray(permissions.pageAccess) ? permissions.pageAccess : [])),
        ...(managerRole ? ["organization", "leave_requests", "requests"] : []),
      ])),
      branchAccess: Array.isArray(permissions.branchAccess) ? permissions.branchAccess : [],
    }
  }, [getRoleById])

  React.useEffect(() => {
    const readBranchesFromLocalStorage = () => {
      const keysToTry = ["app_branches", "evyapar_pdks_branches_local_v1"];
      for (const key of keysToTry) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore and continue
        }
      }
      return [];
    };

    try {
      setLoadingLocalBranches(true);
      setLocalBranches(readBranchesFromLocalStorage());
    } finally {
      setLoadingLocalBranches(false);
    }
  }, []);

  React.useEffect(() => {
    const readFromLocalStorage = (keysToTry: string[]) => {
      for (const key of keysToTry) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore and continue
        }
      }
      return [];
    };

    try {
      setLoadingLocalDepartments(true);
      setLoadingLocalRoles(true);
      setLocalDepartments(readFromLocalStorage(["app_departments", "evyapar_pdks_departments_local_v1"]));
      setLocalRoles(readFromLocalStorage(["app_roles", "evyapar_pdks_roles_local_v1"]));
    } finally {
      setLoadingLocalDepartments(false);
      setLoadingLocalRoles(false);
    }
  }, []);

  const form = useForm<PersonnelFormValues>({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      name: "",
      surname: "",
      tcId: "",
      registryNo: "",
      birthDate: "",
      gender: "",
      phone: "",
      email: "",
      password: "",
      address: "",
      branchId: "",
      departmentId: "",
      position: "",
      workType: "Office",
      status: "Active",
      role: "",
      hasAdminAccess: false,
      hasMobileAccess: true,
      qrId: "",
      deviceId: "",
      cardId: "",
      faceVerification: false,
      locationVerification: true,
      offlineAccess: false,
      defaultShiftId: "",
      weeklyHours: "",
      overtimeAllowed: true,
      salaryAmount: "",
      salaryType: "Monthly",
      salaryCurrency: "TRY",
      salaryIban: "",
      salaryBankName: "",
      salaryPaymentDay: "1",
      salaryAdvanceLimit: "",
      salaryOvertimeMultiplier: "1.5",
      emergencyContactName: "",
      emergencyContactRelation: "",
      emergencyContactPhone: "",
      notes: "",
    },
  })

  const selectedRoleId = form.watch("role")

  React.useEffect(() => {
    const permissions = getRolePermissions(selectedRoleId)
    form.setValue("hasAdminAccess", permissions.panelAccess, { shouldDirty: true })
    form.setValue("hasMobileAccess", permissions.mobileAccess, { shouldDirty: true })
  }, [form, getRolePermissions, selectedRoleId])

  const onSubmit = async (values: PersonnelFormValues) => {
    setIsSubmitting(true)
    try {
      const registryNo = values.registryNo || `SICIL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const qrId = values.qrId || `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      const personnelCode = `EMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      const createdAt = Date.now()
      const rolePermissions = getRolePermissions(values.role)
      const newPersonnel = {
        id: `personnel-${createdAt}-${Math.random().toString(16).slice(2)}`,
        ...values,
        hasAdminAccess: rolePermissions.panelAccess,
        hasMobileAccess: rolePermissions.mobileAccess,
        pageAccess: rolePermissions.pageAccess,
        branchAccess: rolePermissions.branchAccess,
        rolePermissions,
        // keep department optional; normalize empty to undefined
        departmentId: values.departmentId || undefined,
        registryNo,
        fullName: `${values.name} ${values.surname}`,
        qrId,
        personnelCode,
        avatarUrl: avatarPreview || "",
        isDeleted: false,
        salary: {
          amount: parseFloat(values.salaryAmount || "0"),
          type: values.salaryType,
          currency: values.salaryCurrency,
          iban: values.salaryIban,
          bankName: values.salaryBankName,
          paymentDay: parseInt(values.salaryPaymentDay || "1"),
          advanceLimit: parseFloat(values.salaryAdvanceLimit || "0"),
          overtimeMultiplier: parseFloat(values.salaryOvertimeMultiplier || "1.5"),
        },
        createdAt,
        updatedAt: createdAt,
      }

      let next: any[] = []
      try {
        const raw = localStorage.getItem(PERSONNEL_STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        next = Array.isArray(parsed) ? parsed : []
      } catch {
        next = []
      }

      // basic uniqueness guard on registryNo if provided/derived
      if (next.some((p) => p?.registryNo === registryNo)) {
        form.setError("registryNo", { message: "Bu sicil numarası zaten kullanımda" })
        return
      }

      next = [newPersonnel, ...next]
      try {
        localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(next))
        const accessRaw = localStorage.getItem(ACCESS_STORAGE_KEY)
        const accessParsed = accessRaw ? JSON.parse(accessRaw) : []
        const accessList = Array.isArray(accessParsed) ? accessParsed : []
        const accessRecord = {
          id: `access-${createdAt}-${Math.random().toString(16).slice(2)}`,
          personnelId: newPersonnel.id,
          roleId: values.role,
          panelAccess: rolePermissions.panelAccess,
          mobileAccess: rolePermissions.mobileAccess,
          pageAccess: rolePermissions.pageAccess,
          branchAccess: rolePermissions.branchAccess,
          status: "Active",
          createdAt,
          updatedAt: createdAt,
        }
        localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify([accessRecord, ...accessList]))
        await syncAllPersonnelToFirestore(db, next)
        const firestoreOk = await writeSharedRecord(db, "personnel", newPersonnel)
        console.info("[Firestore personnel write]", {
          collectionPath: "personnel",
          recordId: newPersonnel.id,
          status: firestoreOk ? "success" : "error",
        })
        if (!firestoreOk) {
          toast({
            variant: "destructive",
            title: "Firestore personel yazımı başarısız",
            description: "Personel localStorage'a kaydedildi; Firestore personnel koleksiyonuna yazılamadı.",
          })
        }
        window.dispatchEvent(new Event("app-access-updated"))
      } catch {
        // allow flow to continue even if storage is blocked
      }

      toast({
        title: "Başarılı",
        description: "Personel başarıyla eklendi.",
      })
      onSuccess()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel kaydı oluşturulamadı. Lütfen tekrar deneyin.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full min-w-0 space-y-8 pb-20">
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="min-w-0 space-y-8 xl:col-span-2">
            {/* 1. Profil Bilgileri */}
            <Card className="border-none shadow-sm bg-slate-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <User className="h-5 w-5" />
                  <h3 className="font-bold">Profil Bilgileri</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Örn: Ahmet" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soyad <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Örn: Yılmaz" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tcId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TC Kimlik No <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="11 haneli" {...field} maxLength={11} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registryNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sicil No</FormLabel>
                        <FormControl><Input placeholder="Boş bırakılırsa üretilir" {...field} /></FormControl>
                        <FormDescription>Benzersiz personel sicil numarası.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input type="email" placeholder="ornek@evyapar.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şifre <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input type="password" placeholder="Mobil/panel giriş şifresi" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="05xx xxx xx xx" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Çalışma Bilgileri */}
            <Card className="border-none shadow-sm bg-slate-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <Briefcase className="h-5 w-5" />
                  <h3 className="font-bold">Çalışma Bilgileri</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şube <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingLocalBranches ? "Yükleniyor..." : "Şube seçin"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {localBranches?.length > 0 ? (
                              localBranches.map((b: any) => {
                                const value = (b?.id || b?.branchCode || "").toString();
                                const label = (b?.branchName || b?.name || b?.title || "").toString();
                                if (!value || !label) return null;
                                return (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem value="none" disabled>Kayıtlı şube yok</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departman <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingLocalDepartments ? "Yükleniyor..." : "Departman seçin"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {localDepartments?.length > 0 ? (
                              localDepartments.map((d: any) => {
                                const value = (d?.id || d?.departmentCode || d?.code || "").toString();
                                const label = (d?.departmentName || d?.name || d?.title || "").toString();
                                if (!value || !label) return null;
                                return (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem value="none" disabled>Kayıtlı departman yok</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Çalışma Türü</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Office">Ofis</SelectItem>
                            <SelectItem value="Field">Saha</SelectItem>
                            <SelectItem value="Remote">Uzaktan</SelectItem>
                            <SelectItem value="Hybrid">Hibrit</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yetki Rolü <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingLocalRoles ? "Yükleniyor..." : "Rol seçin"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {localRoles?.length > 0 ? (
                              localRoles.map((r: any) => {
                                const value = (r?.id || r?.roleCode || r?.code || "").toString();
                                const label = (r?.roleName || r?.name || r?.title || "").toString();
                                if (!value || !label) return null;
                                return (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem value="none" disabled>Kayıtlı rol yok</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Maaş Bilgileri */}
            <Card className="border-none shadow-sm bg-slate-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <Wallet className="h-5 w-5" />
                  <h3 className="font-bold">Maaş Bilgileri</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salaryAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maaş Tutarı</FormLabel>
                        <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Para Birimi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TRY">TRY (₺)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maaş Tipi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Monthly">Aylık</SelectItem>
                            <SelectItem value="Daily">Günlük</SelectItem>
                            <SelectItem value="Hourly">Saatlik</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryIban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl><Input placeholder="TRXX XXXX XXXX..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryBankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banka Adı</FormLabel>
                        <FormControl><Input placeholder="Örn: Garanti BBVA" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryPaymentDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ödeme Günü</FormLabel>
                        <FormControl><Input type="number" min="1" max="31" {...field} /></FormControl>
                        <FormDescription>Ayın hangi günü ödeme yapılacak?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="sticky top-0 w-full max-w-full border-primary/10 shadow-lg overflow-hidden">
              <div className="bg-primary p-6 text-white text-center">
                <div className="relative inline-block">
                  <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
                    <AvatarImage src={avatarPreview || ""} />
                    <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">
                      {form.watch("name")?.charAt(0)}{form.watch("surname")?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    type="button"
                    size="icon" 
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent hover:bg-accent/90 border-2 border-primary"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <h4 className="mt-4 text-lg font-bold truncate">
                  {form.watch("name") || "Ad"} {form.watch("surname") || "Soyad"}
                </h4>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {form.watch("registryNo") ? `SİCİL: ${form.watch("registryNo")}` : "SİCİL NO BEKLENİYOR"}
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Şube</span>
                  <span className="min-w-0 truncate font-semibold text-primary">{getBranchLabel(form.watch("branchId"))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Departman</span>
                  <span className="min-w-0 truncate font-semibold text-primary">{getDepartmentLabel(form.watch("departmentId"))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Maaş</span>
                  <span className="min-w-0 truncate font-bold text-accent">
                    {form.watch("salaryAmount") ? `${form.watch("salaryAmount")} ${form.watch("salaryCurrency")}` : "-"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Yetki Rolü</span>
                  <Badge variant="outline" className="max-w-[60%] truncate font-bold border-primary/20">{getRoleLabel(form.watch("role"))}</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-900">Maaş Gizliliği</p>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Maaş ve banka bilgileri KVKK gereği sadece İK, Muhasebe ve Admin yetkisine sahip kullanıcılar tarafından görüntülenebilir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] bg-white border-t p-4 px-8 flex justify-between items-center z-50">
          <Button type="button" variant="ghost" onClick={onCancel}>Vazgeç</Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline">Taslak Kaydet</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px] bg-primary hover:bg-primary/90">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Personeli Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
