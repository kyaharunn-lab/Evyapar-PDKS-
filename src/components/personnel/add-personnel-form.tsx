
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
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"

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

const personnelSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  surname: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  tcId: z.string().length(11, "TC Kimlik No 11 hane olmalıdır"),
  registryNo: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  address: z.string().optional(),
  branchId: z.string().min(1, "Şube seçimi zorunludur"),
  departmentId: z.string().min(1, "Departman seçimi zorunludur"),
  position: z.string().optional(),
  workType: z.enum(["Office", "Field", "Remote", "Hybrid"]),
  startDate: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Probation"]),
  role: z.enum(["Personnel", "Manager", "HR", "Accountant", "Admin"]),
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

interface AddPersonnelFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AddPersonnelForm({ onSuccess, onCancel }: AddPersonnelFormProps) {
  const db = useFirestore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)

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
      address: "",
      branchId: "",
      departmentId: "",
      position: "",
      workType: "Office",
      startDate: "",
      status: "Active",
      role: "Personnel",
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

  const onSubmit = async (values: PersonnelFormValues) => {
    if (!db) return
    setIsSubmitting(true)
    try {
      // Sicil No Kontrolü
      if (values.registryNo) {
        const q = query(collection(db, "personnel"), where("registryNo", "==", values.registryNo));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          form.setError("registryNo", { message: "Bu sicil numarası zaten kullanımda" });
          setIsSubmitting(false);
          return;
        }
      }

      const registryNo = values.registryNo || `SICIL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const qrId = values.qrId || `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      const personnelCode = `EMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      await addDoc(collection(db, "personnel"), {
        ...values,
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
          overtimeMultiplier: parseFloat(values.salaryOvertimeMultiplier || "1.5")
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Şube seçin" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Merkez Ofis">Merkez Ofis</SelectItem>
                            <SelectItem value="İstanbul Şube">İstanbul Şube</SelectItem>
                            <SelectItem value="Ankara Bölge">Ankara Bölge</SelectItem>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Departman seçin" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bilgi Teknolojileri">Bilgi Teknolojileri</SelectItem>
                            <SelectItem value="İnsan Kaynakları">İnsan Kaynakları</SelectItem>
                            <SelectItem value="Operasyon">Operasyon</SelectItem>
                            <SelectItem value="Satış">Satış</SelectItem>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Rol seçin" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Personnel">Personel</SelectItem>
                            <SelectItem value="Manager">Şube Müdürü</SelectItem>
                            <SelectItem value="HR">İK</SelectItem>
                            <SelectItem value="Accountant">Muhasebe</SelectItem>
                            <SelectItem value="Admin">Süper Admin</SelectItem>
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

          <div className="space-y-6">
            <Card className="sticky top-0 border-primary/10 shadow-lg overflow-hidden">
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
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Departman</span>
                  <span className="font-semibold text-primary">{form.watch("departmentId") || "-"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Maaş</span>
                  <span className="font-bold text-accent">
                    {form.watch("salaryAmount") ? `${form.watch("salaryAmount")} ${form.watch("salaryCurrency")}` : "-"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Yetki Rolü</span>
                  <Badge variant="outline" className="font-bold border-primary/20">{form.watch("role")}</Badge>
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
