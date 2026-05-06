"use client"

import * as React from "react"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  ArrowLeftRight,
  Settings2,
  AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { translations } from "@/lib/translations"

const s = translations.shifts;
const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
const shiftTypes = [
  { time: "08:00 - 17:00", name: s.dayShift, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { time: "16:00 - 00:00", name: s.eveningShift, color: "bg-orange-100 text-orange-700 border-orange-200" },
  { time: "00:00 - 08:00", name: s.nightShift, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
]

export default function ShiftsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Vardiya Yönetimi</h2>
          <p className="text-muted-foreground mt-1">Tüm departmanlar için haftalık çalışma planlarını yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl px-5 h-11 border-primary/20 hover:bg-primary/5">
            <Settings2 className="mr-2 h-4 w-4" />
            Yapılandır
          </Button>
          <Button className="bg-accent hover:bg-accent/90 rounded-xl px-6 h-11 shadow-lg shadow-accent/20">
            <Plus className="mr-2 h-4 w-4" />
            {s.newShift}
          </Button>
        </div>
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-secondary/20 border-b p-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-bold text-primary px-2">11 Mart - 17 Mart 2024</h3>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold">11. Hafta</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="font-bold">Bugün</Button>
            <div className="h-8 w-px bg-border mx-2" />
            <Button variant="outline" size="sm" className="bg-white rounded-lg">Haftalık Görünüm</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-7 border-b bg-white/50 backdrop-blur">
              {days.map(day => (
                <div key={day} className="p-6 text-center border-r last:border-r-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px]">{day}</p>
                  <p className="text-2xl font-black text-primary mt-2">
                    {11 + days.indexOf(day)}
                  </p>
                </div>
              ))}
            </div>
            <div className="divide-y">
              {[
                { name: "Merkez Operasyon", staff: 12 },
                { name: "Saha Ekibi A", staff: 8 },
                { name: "Güvenlik Birimi 1", staff: 5 },
                { name: "Bilgi İşlem", staff: 4 },
              ].map((dept, i) => (
                <div key={i} className="grid grid-cols-7 group">
                  {days.map((_, dayIndex) => (
                    <div key={dayIndex} className="p-4 h-52 border-r last:border-r-0 hover:bg-secondary/20 transition-colors">
                      <div className="flex flex-col gap-2 h-full">
                        <p className="text-[9px] font-bold text-primary/40 mb-1 group-first:hidden">
                          {dayIndex < 5 ? dept.name : ""}
                        </p>
                        {dayIndex < 5 ? (
                          <>
                            <div className={`p-3 rounded-xl border-2 ${shiftTypes[0].color} flex flex-col shadow-sm`}>
                              <span className="font-extrabold text-[10px] leading-tight">{shiftTypes[0].name}</span>
                              <span className="text-[9px] opacity-70 mt-1">4 Personel</span>
                            </div>
                            <div className={`p-3 rounded-xl border-2 ${shiftTypes[1].color} flex flex-col shadow-sm`}>
                              <span className="font-extrabold text-[10px] leading-tight">{shiftTypes[1].name}</span>
                              <span className="text-[9px] opacity-70 mt-1">2 Personel</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold border-dashed">
                              {s.weekendReduced}
                            </Badge>
                          </div>
                        )}
                        <Button variant="ghost" className="mt-auto h-7 text-[10px] font-bold hover:bg-primary hover:text-white border-2 border-dashed border-primary/10 rounded-lg">
                          + {s.assign}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary flex items-center">
                <ArrowLeftRight className="mr-3 h-5 w-5 text-accent" />
                {s.changeRequests}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { from: "Mehmet Aksoy", to: "Caner Aydın", date: "14 Mart", shift: "Akşam", reason: "Ailevi Acil Durum" },
                { from: "Selin Demir", to: "Ahmet Yılmaz", date: "15 Mart", shift: "Gündüz", reason: "Eğitim" },
              ].map((req, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-5">
                    <div className="flex -space-x-3">
                      <Avatar className="w-10 h-10 border-4 border-white shadow-sm ring-1 ring-primary/5">
                        <AvatarFallback className="bg-primary text-white font-bold">{req.from.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Avatar className="w-10 h-10 border-4 border-white shadow-sm ring-1 ring-primary/5">
                        <AvatarFallback className="bg-accent text-white font-bold">{req.to.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{req.from} → {req.to}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{req.date} • {req.shift} Vardiyası</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" size="sm" className="text-accent font-bold h-9 px-4">{s.decline}</Button>
                    <Button variant="outline" size="sm" className="bg-primary text-white hover:bg-primary/90 h-9 px-4 rounded-xl border-none shadow-lg shadow-primary/20">{s.approve}</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4">
          <Card className="premium-card bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center">
                <AlertCircle className="mr-3 h-5 w-5 text-accent" />
                {s.coverageAlerts}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                  Düşük Kapasite Uyarısı
                </p>
                <p className="text-xs text-white/70 mt-2 leading-relaxed font-medium">
                  Lojistik merkezinde 16 Mart Akşam vardiyası için planlanan personel sayısı minimum limitin altında.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="text-sm font-bold flex items-center gap-2 text-blue-300">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Atanmamış Vardiya
                </p>
                <p className="text-xs text-white/70 mt-2 leading-relaxed font-medium">
                  Güvenlik Birimi 2 Gece vardiyası (15 Mart) için 1 personel daha gerekiyor.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
