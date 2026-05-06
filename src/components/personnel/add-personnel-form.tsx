
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
  Clock, 
  FileText, 
  PhoneCall, 
  StickyNote, 
  QrCode, 
  Camera,
  Loader2,
  X,
  Plus
} from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

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
import { Textarea } from "@/components/ui/textarea"
import { useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const personnelSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  surname: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  tcId: z.string().length(11, "TC Kimlik No 11 hane olmalıdır"),
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
  salaryType: z.string().optional(),
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
      phone: "",
      email: "",
      workType: "Office",
      status: "Active",
      role: "Personnel",
      hasAdminAccess: false,
      hasMobileAccess: true,
      faceVerification: false,
      locationVerification: true,
      offlineAccess: false,
      overtimeAllowed: true,
    },
  })

  const onSubmit = async (values: PersonnelFormValues) => {
    if (!db) return
    setIsSubmitting(true)
    try {
      const qrId = values.qrId || `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      const personnelCode = `EMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      await addDoc(collection(db, "personnel"), {
        ...values,
        fullName: `${values.name} ${values.surname}`,
        qrId,
        personnelCode,
        avatarUrl: avatarPreview || "",
        isDeleted: false,
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

  const generateCodes = () => {
    form.setValue("qrId", `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Preview and Sections */}
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
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cinsiyet</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Erkek</SelectItem>
                            <SelectItem value="Female">Kadın</SelectItem>
                            <SelectItem value="Other">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="merkez">Merkez Ofis</SelectItem>
                            <SelectItem value="istanbul">İstanbul Şube</SelectItem>
                            <SelectItem value="ankara">Ankara Bölge</SelectItem>
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
                            <SelectItem value="it">Bilgi Teknolojileri</SelectItem>
                            <SelectItem value="hr">İnsan Kaynakları</SelectItem>
                            <SelectItem value="ops">Operasyon</SelectItem>
                            <SelectItem value="sales">Satış</SelectItem>
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durum</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active">Aktif</SelectItem>
                            <SelectItem value="Inactive">Pasif</SelectItem>
                            <SelectItem value="Probation">Deneme Sürecinde</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. PDKS Doğrulama */}
            <Card className="border-none shadow-sm bg-slate-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <Fingerprint className="h-5 w-5" />
                  <h3 className="font-bold">PDKS Doğrulama Bilgileri</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="qrId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between">
                          QR ID
                          <Button 
                            type="button" 
                            variant="link" 
                            className="h-auto p-0 text-accent text-xs"
                            onClick={generateCodes}
                          >
                            Otomatik Üret
                          </Button>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" {...field} />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="locationVerification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Konum Doğrulama</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="faceVerification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Yüz Doğrulama</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview and Actions */}
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
                <p className="text-white/60 text-xs font-medium uppercase tracking-widest mt-1">
                  {form.watch("position") || "Pozisyon Belirtilmedi"}
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Departman</span>
                  <span className="font-semibold text-primary">{form.watch("departmentId") || "-"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Şube</span>
                  <span className="font-semibold text-primary">{form.watch("branchId") || "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Yetki Rolü</span>
                  <Badge variant="outline" className="font-bold border-primary/20">{form.watch("role")}</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Durum</span>
                  <Badge className={form.watch("status") === "Active" ? "bg-green-500" : "bg-slate-400"}>
                    {form.watch("status")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-900">Yetki Notu</p>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Seçilen rol personelin sistemdeki tüm yetkilerini (panel erişimi, mobil izinler vb.) belirler. İK onayı olmadan değiştirilemez.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
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
