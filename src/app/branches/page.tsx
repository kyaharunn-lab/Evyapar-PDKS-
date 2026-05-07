"use client"

import * as React from "react"
import { 
  Building2, 
  Plus, 
  MapPin, 
  Filter, 
  CheckCircle2, 
  Users, 
  QrCode,
  X,
  Mail,
  User,
  Clock,
  Settings2,
  Info,
  Map as MapIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export default function BranchesPage() {
  const [isAddOpen, setIsAddOpen] = React.useState(false)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Alan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Building2 className="h-8 w-8 text-accent" />
            Şubeler
          </h2>
          <p className="text-muted-foreground mt-1">Şirket şubelerini yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4" />
            Filtrele
          </Button>
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <MapPin className="mr-2 h-4 w-4" />
            Harita
          </Button>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="h-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Şube
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam Şube" value="0" icon={Building2} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif Şube" value="0" icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Toplam Personel" value="0" icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <KPICard title="QR Aktif" value="0" icon={QrCode} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 min-h-[400px]">
        <div className="bg-secondary/50 p-6 rounded-full mb-6">
          <Building2 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">Henüz şube kaydı bulunmuyor.</h3>
        <p className="text-muted-foreground max-w-xs mb-6">Sisteme şube ekleyerek organizasyon yapısını oluşturmaya başlayabilirsiniz.</p>
        <Button 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary/5"
          onClick={() => setIsAddOpen(true)}
        >
          İlk Şubeyi Tanımla
        </Button>
      </div>

      {/* Yeni Şube Paneli */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[550px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white relative">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">Yeni Şube Ekle</SheetTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAddOpen(false)} 
                  className="rounded-full h-8 w-8 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription className="text-slate-500 font-medium mt-1">
                Şirket bünyesine yeni bir çalışma lokasyonu ve PDKS kuralları tanımlayın.
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8 pb-32">
                
                {/* 1. Genel Bilgiler */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <div className="p-1.5 bg-primary/5 rounded-lg">
                      <Info className="h-4 w-4" />
                    </div>
                    Genel Bilgiler
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-name" className="text-[11px] font-bold text-slate-500 uppercase">Şube Adı</Label>
                      <Input id="branch-name" placeholder="Örn: Merkez Ofis" className="rounded-xl border-slate-200 h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-code" className="text-[11px] font-bold text-slate-500 uppercase">Şube Kodu</Label>
                      <Input id="branch-code" placeholder="BR-001" className="rounded-xl border-slate-200 h-10 text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-manager" className="text-[11px] font-bold text-slate-500 uppercase">Yetkili Müdür</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input id="branch-manager" placeholder="Ad Soyad" className="pl-9 rounded-xl border-slate-200 h-10 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-email" className="text-[11px] font-bold text-slate-500 uppercase">E-posta</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input id="branch-email" type="email" placeholder="sube@evyapar.com" className="pl-9 rounded-xl border-slate-200 h-10 text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-city" className="text-[11px] font-bold text-slate-500 uppercase">Şehir</Label>
                      <Input id="branch-city" placeholder="İstanbul" className="rounded-xl border-slate-200 h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-district" className="text-[11px] font-bold text-slate-500 uppercase">İlçe</Label>
                      <Input id="branch-district" placeholder="Kadıköy" className="rounded-xl border-slate-200 h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-zip" className="text-[11px] font-bold text-slate-500 uppercase">Posta Kodu</Label>
                      <Input id="branch-zip" placeholder="34000" className="rounded-xl border-slate-200 h-10 text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="branch-phone" className="text-[11px] font-bold text-slate-500 uppercase">Telefon</Label>
                    <Input id="branch-phone" placeholder="0212 XXX XX XX" className="rounded-xl border-slate-200 h-10 text-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="branch-address" className="text-[11px] font-bold text-slate-500 uppercase">Açık Adres</Label>
                    <Textarea 
                      id="branch-address" 
                      placeholder="Şube tam adresi..." 
                      className="rounded-xl border-slate-200 min-h-[80px] text-sm resize-none" 
                    />
                  </div>

                  {/* Konum Koordinat Alanları */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-lat" className="text-[11px] font-bold text-slate-500 uppercase">Enlem (Lat)</Label>
                      <Input id="branch-lat" placeholder="41.0082" className="rounded-xl border-slate-200 h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-lng" className="text-[11px] font-bold text-slate-500 uppercase">Boylam (Lng)</Label>
                      <Input id="branch-lng" placeholder="28.9784" className="rounded-xl border-slate-200 h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="branch-radius" className="text-[11px] font-bold text-slate-500 uppercase">Konum Radiusu (m)</Label>
                      <Input id="branch-radius" placeholder="100" type="number" className="rounded-xl border-slate-200 h-10 text-sm" />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full h-10 rounded-xl border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-xs">
                    <MapIcon className="mr-2 h-3.5 w-3.5" />
                    Haritadan Konum Seç
                  </Button>
                </div>

                <Separator className="bg-slate-100" />

                {/* 2. Çalışma Bilgileri */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <div className="p-1.5 bg-primary/5 rounded-lg">
                      <Clock className="h-4 w-4" />
                    </div>
                    Çalışma Bilgileri
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Açılış Saati</Label>
                        <Input type="time" defaultValue="08:00" className="rounded-xl border-slate-200 h-10 text-sm bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Kapanış Saati</Label>
                        <Input type="time" defaultValue="18:00" className="rounded-xl border-slate-200 h-10 text-sm bg-white" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-700">Hafta Sonu Açık mı?</Label>
                        <p className="text-[10px] text-slate-400 font-medium">Cumartesi-Pazar çalışma durumunu belirler.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* 3. PDKS Ayarları */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <div className="p-1.5 bg-primary/5 rounded-lg">
                      <Settings2 className="h-4 w-4" />
                    </div>
                    PDKS Ayarları
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-700">QR ile Giriş</Label>
                        <p className="text-[10px] text-slate-400 font-medium">Şube bazlı QR kod ile giriş yapılabilir.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator className="bg-slate-100/50" />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-700">Konum Doğrulama</Label>
                        <p className="text-[10px] text-slate-400 font-medium">GPS üzerinden bölge kontrolü yapılır.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator className="bg-slate-100/50" />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-700">Yüz Doğrulama</Label>
                        <p className="text-[10px] text-slate-400 font-medium">Biyometrik yüz tanıma ile kimlik doğrulama.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                {/* 4. Durum */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase">Şube Durumu</Label>
                    <Select defaultValue="active">
                      <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white">
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="text-green-600 font-bold">● Aktif</SelectItem>
                        <SelectItem value="passive" className="text-slate-500 font-bold">○ Pasif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-8 border-t bg-white/80 backdrop-blur-md flex gap-3 z-20">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={() => setIsAddOpen(false)}
              >
                İptal
              </Button>
              <Button 
                className="flex-[2] h-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold text-white transition-all active:scale-95"
              >
                Şubeyi Kaydet
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function KPICard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="premium-card group hover:scale-[1.02] transition-transform border-none">
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
