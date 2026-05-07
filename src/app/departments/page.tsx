"use client"

import * as React from "react"
import { 
  Users2, 
  Plus, 
  Filter, 
  CheckCircle2, 
  UserCircle2, 
  Building2,
  FolderTree,
  Settings2,
  Globe,
  MapPin,
  Clock,
  Info
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
import { cn } from "@/lib/utils"

export default function DepartmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Alan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Users2 className="h-8 w-8 text-accent" />
            Departmanlar
          </h2>
          <p className="text-muted-foreground mt-1">Şirket departmanlarını ve organizasyon yapısını yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4" />
            Filtrele
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Departman
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam Departman" value="0" icon={FolderTree} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif Departman" value="0" icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Toplam Personel" value="0" icon={Users2} color="text-blue-600" bg="bg-blue-50" />
        <KPICard title="Yönetici Atanmış" value="0" icon={UserCircle2} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Tablo Alanı */}
      <Card className="premium-card overflow-hidden">
        <CardHeader className="border-b bg-slate-50/30">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Organizasyon Listesi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="enterprise-table-header">
              <TableRow>
                <TableHead className="pl-6">Departman Adı</TableHead>
                <TableHead>Departman Kodu</TableHead>
                <TableHead>Yönetici</TableHead>
                <TableHead>Personel Sayısı</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right pr-6">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="h-[400px] text-center">
                  <div className="flex flex-col items-center justify-center p-20 text-center">
                    <div className="bg-secondary/50 p-6 rounded-full mb-6">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">Henüz departman kaydı bulunmuyor.</h3>
                    <p className="text-muted-foreground max-w-xs mb-6">Sisteme departman ekleyerek organizasyon yapısını oluşturmaya başlayabilirsiniz.</p>
                    <Button 
                      variant="outline" 
                      className="border-primary text-primary hover:bg-primary/5"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      İlk Departmanı Oluştur
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Yeni Departman Modalı */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border-none rounded-[32px] overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <FolderTree className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-extrabold tracking-tight">Yeni Departman Oluştur</DialogTitle>
            </div>
            <DialogDescription className="text-white/70 text-base">
              Şirket organizasyon yapısına yeni bir departman ve PDKS kuralları tanımlayın.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Genel Bilgiler */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                <Info className="h-4 w-4" />
                Genel Bilgiler
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-name" className="text-xs font-bold text-slate-500">Departman Adı <span className="text-accent">*</span></Label>
                <Input id="dept-name" placeholder="Örn: Yazılım Geliştirme" className="rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-code" className="text-xs font-bold text-slate-500">Departman Kodu <span className="text-accent">*</span></Label>
                <Input id="dept-code" placeholder="Örn: DEPT-IT-01" className="rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Bağlı Şube</Label>
                <Select>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Şube seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merkez">Merkez Ofis</SelectItem>
                    <SelectItem value="istanbul">İstanbul Şube</SelectItem>
                    <SelectItem value="ankara">Ankara Bölge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500">Departman Yöneticisi</Label>
                <Select>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Yönetici seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Henüz Atanmadı</SelectItem>
                  </SelectContent>
                </Select>
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

            {/* PDKS Ayarları */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                <Settings2 className="h-4 w-4" />
                PDKS Ayarları
              </div>
              
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Vardiya Zorunlu</Label>
                    <p className="text-[10px] text-slate-400">Personel vardiyasız giriş yapamaz.</p>
                  </div>
                  <Switch />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Konum Doğrulama</Label>
                    <p className="text-[10px] text-slate-400">GPS koordinatı kontrol edilir.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Fazla Mesai İzni</Label>
                    <p className="text-[10px] text-slate-400">Departman geneli mesai yapabilir.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-slate-200/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Uzaktan Çalışma</Label>
                    <p className="text-[10px] text-slate-400">Mobil uygulama üzerinden giriş.</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="description" className="text-xs font-bold text-slate-500">Departman Açıklaması</Label>
                <Textarea 
                  id="description" 
                  placeholder="Departman hakkında kısa bilgi veya özel notlar..." 
                  className="rounded-xl border-slate-200 min-h-[100px] resize-none"
                />
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
              className="flex-[2] h-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold text-white"
            >
              Departmanı Oluştur
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
