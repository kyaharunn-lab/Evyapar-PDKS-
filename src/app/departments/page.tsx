"use client"

import * as React from "react"
import { 
  Users2, 
  Plus, 
  Filter, 
  CheckCircle2, 
  UserCircle2, 
  Building2,
  FolderTree
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export default function DepartmentsPage() {
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
          <Button className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
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
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
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
