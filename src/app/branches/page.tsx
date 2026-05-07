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
  X
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
        <SheetContent side="right" className="w-full sm:max-w-[450px] p-0 border-none">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">Yeni Şube Ekle</SheetTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SheetDescription>Şirket bünyesine yeni bir çalışma lokasyonu tanımlayın.</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="branch-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Şube Adı</Label>
                <Input id="branch-name" placeholder="Örn: Merkez Ofis" className="rounded-xl border-slate-200 h-11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch-code" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Şube Kodu</Label>
                <Input id="branch-code" placeholder="Örn: BR-001" className="rounded-xl border-slate-200 h-11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch-phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefon</Label>
                <Input id="branch-phone" placeholder="0212 XXX XX XX" className="rounded-xl border-slate-200 h-11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch-city" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Şehir</Label>
                <Input id="branch-city" placeholder="Örn: İstanbul" className="rounded-xl border-slate-200 h-11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch-address" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adres</Label>
                <Textarea 
                  id="branch-address" 
                  placeholder="Şube açık adresi..." 
                  className="rounded-xl border-slate-200 min-h-[100px] resize-none" 
                />
              </div>
            </div>

            <div className="p-8 border-t bg-slate-50/50 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-2xl font-bold"
                onClick={() => setIsAddOpen(false)}
              >
                İptal
              </Button>
              <Button 
                className="flex-[2] h-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold"
              >
                Kaydet
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
