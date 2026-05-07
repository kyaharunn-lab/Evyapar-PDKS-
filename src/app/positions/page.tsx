"use client"

import * as React from "react"
import { 
  Briefcase, 
  Plus, 
  Filter, 
  CheckCircle2, 
  UserCircle2, 
  Building2,
  Users2,
  ShieldCheck,
  Settings2,
  Info,
  ChevronRight,
  Search,
  LayoutGrid
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function PositionsPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Alan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-accent" />
            Pozisyonlar
          </h2>
          <p className="text-muted-foreground mt-1">Şirket içindeki görev ve pozisyon yapılarını yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4" />
            Filtrele
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Pozisyon
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam Pozisyon" value="0" icon={LayoutGrid} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif Pozisyon" value="0" icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Personel Atanmış" value="0" icon={Users2} color="text-blue-600" bg="bg-blue-50" />
        <KPICard title="Boş Pozisyon" value="0" icon={UserCircle2} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Tablo Alanı */}
      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Pozisyon Listesi</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Pozisyon ara..." className="pl-10 h-9 rounded-lg bg-white border-slate-200" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="enterprise-table-header">
              <TableRow>
                <TableHead className="pl-6">Pozisyon Adı</TableHead>
                <TableHead>Pozisyon Kodu</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Bağlı Yönetici</TableHead>
                <TableHead>Personel Sayısı</TableHead>
                <TableHead>Yetki Seviyesi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right pr-6">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={9} className="h-[450px] text-center">
                  <div className="flex flex-col items-center justify-center p-20 text-center">
                    <div className="bg-secondary/50 p-6 rounded-full mb-6 shadow-inner">
                      <Briefcase className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">Henüz pozisyon kaydı bulunmuyor.</h3>
                    <p className="text-muted-foreground max-w-xs mb-6">Pozisyonları tanımlayarak organizasyon şemasını ve PDKS kurallarını belirleyebilirsiniz.</p>
                    <Button 
                      variant="outline" 
                      className="border-primary text-primary hover:bg-primary/5 h-11 px-8 rounded-xl font-bold"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      İlk Pozisyonu Oluştur
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Yeni Pozisyon Modalı */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[750px] p-0 border-none rounded-[32px] overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-xl">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-extrabold tracking-tight">Yeni Pozisyon Tanımla</DialogTitle>
            </div>
            <DialogDescription className="text-white/70 text-base">
              Organizasyon hiyerarşisine yeni bir pozisyon ve PDKS yetkilendirmesi ekleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {/* Temel Bilgiler */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                <Info className="h-4 w-4" />
                Temel Bilgiler
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pos-name" className="text-xs font-bold text-slate-500">Pozisyon Adı <span className="text-accent">*</span></Label>
                <Input id="pos-name" placeholder="Örn: Kıdemli Yazılım Geliştirici" className="rounded-xl border-slate-200" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pos-code" className="text-xs font-bold text-slate-500">Pozisyon Kodu <span className="text-accent">*</span></Label>
                <Input id="pos-code" placeholder="Örn: POS-DEV-01" className="rounded-xl border-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Bağlı Departman <span className="text-accent">*</span></Label>
                  <Select>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Seçiniz..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">Bilgi Teknolojileri</SelectItem>
                      <SelectItem value="hr">İnsan Kaynakları</SelectItem>
                      <SelectItem value="sales">Satış & Pazarlama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Şube</Label>
                  <Select>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Seçiniz..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merkez">Merkez Ofis</SelectItem>
                      <SelectItem value="ist">İstanbul Şube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Bağlı Olduğu Yönetici</Label>
                <Select>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Yönetici seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Henüz Atanmadı</SelectItem>
                    <SelectItem value="dir">Genel Müdür</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Yetki Seviyesi</Label>
                  <Select defaultValue="1">
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Seviye 1 (Personel)</SelectItem>
                      <SelectItem value="2">Seviye 2 (Şef/Takım Lideri)</SelectItem>
                      <SelectItem value="3">Seviye 3 (Müdür)</SelectItem>
                      <SelectItem value="4">Seviye 4 (Direktör)</SelectItem>
                      <SelectItem value="5">Seviye 5 (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500">Çalışma Türü</Label>
                  <Select defaultValue="office">
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Ofis</SelectItem>
                      <SelectItem value="field">Saha</SelectItem>
                      <SelectItem value="remote">Uzaktan</SelectItem>
                      <SelectItem value="hybrid">Hibrit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* PDKS ve Ek Bilgiler */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                <Settings2 className="h-4 w-4" />
                PDKS Yetkileri
              </div>

              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Vardiya Zorunlu</Label>
                    <p className="text-[10px] text-slate-400 font-medium">Giriş için vardiya atanmış olmalı.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Konum Doğrulama</Label>
                    <p className="text-[10px] text-slate-400 font-medium">GPS üzerinden bölge kontrolü.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">QR Zorunlu</Label>
                    <p className="text-[10px] text-slate-400 font-medium">QR kod okutmadan giriş engellenir.</p>
                  </div>
                  <Switch />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Fazla Mesai İzni</Label>
                    <p className="text-[10px] text-slate-400 font-medium">Pozisyon mesai ücreti alabilir.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pos-desc" className="text-xs font-bold text-slate-500">Pozisyon Açıklaması</Label>
                <Textarea id="pos-desc" placeholder="Görev tanımı ve sorumluluklar..." className="rounded-xl border-slate-200 min-h-[100px] resize-none" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Durum</Label>
                <Select defaultValue="active">
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50/50 border-t flex flex-row items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
            >
              Vazgeç
            </Button>
            <Button 
              className="flex-[2] h-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold text-white transition-all active:scale-95"
            >
              Pozisyonu Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KPICard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="premium-card group hover:scale-[1.02] transition-transform border-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl transition-colors", bg)}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
        </div>
        <div className="text-2xl font-extrabold text-primary tracking-tight">{value}</div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}
