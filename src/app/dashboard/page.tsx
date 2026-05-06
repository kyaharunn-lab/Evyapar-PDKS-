"use client"

import * as React from "react"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp, 
  MapPin,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts"

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

const d = translations.dashboard;
const t = translations.common;

const attendanceData = [
  { day: "Pzt", present: 124, late: 12, absent: 4 },
  { day: "Sal", present: 118, late: 15, absent: 7 },
  { day: "Çar", present: 132, late: 8, absent: 0 },
  { day: "Per", present: 128, late: 10, absent: 2 },
  { day: "Cum", present: 110, late: 25, absent: 5 },
  { day: "Cmt", present: 45, late: 5, absent: 2 },
  { day: "Paz", present: 32, late: 2, absent: 1 },
]

const branchData = [
  { name: "Merkez - İstanbul", value: 85, color: "#0E2B4D" },
  { name: "Ankara Bölge", value: 42, color: "#CC0000" },
  { name: "İzmir Lojistik", value: 38, color: "#455A64" },
  { name: "Bursa Fabrika", value: 25, color: "#1A237E" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">{t.dashboard}</h2>
          <p className="text-muted-foreground mt-1 text-base">{d.kpiSummary}</p>
        </div>
        <Badge variant="outline" className="px-5 py-2.5 rounded-2xl bg-white shadow-sm font-bold border-slate-200 border-dashed animate-pulse text-xs tracking-wider">
          <Activity className="w-4 h-4 mr-2.5 text-accent" />
          CANLI İZLEME AKTİF
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: d.totalStaff, value: "142", sub: "+2 yeni kayıt", icon: Users, color: "text-primary", trend: "up", percentage: "12%" },
          { title: d.activeToday, value: "128", sub: "%92 katılım oranı", icon: UserCheck, color: "text-green-600", trend: "up", percentage: "4%" },
          { title: d.lateArrivals, value: "12", sub: "Vardiyaların %8'i", icon: Clock, color: "text-accent", trend: "down", percentage: "2%" },
          { title: d.absenteeism, value: "2", sub: "-1.2% azalma", icon: UserX, color: "text-slate-400", trend: "down", percentage: "8%" },
        ].map((item, i) => (
          <Card key={i} className="premium-card relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">{item.title}</CardTitle>
              <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-primary/5 transition-colors">
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-extrabold text-primary tracking-tight">{item.value}</div>
                <div className={cn("flex items-center text-[11px] font-bold", item.trend === "up" ? "text-green-600" : "text-accent")}>
                  {item.trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {item.percentage}
                </div>
              </div>
              <p className="text-[12px] mt-2 font-medium text-slate-500">
                {item.sub}
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-4 premium-card">
          <CardHeader className="border-b bg-slate-50/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-primary">{d.weeklyFlow}</CardTitle>
                <CardDescription className="text-xs font-medium">Son 7 günlük personel performans grafiği</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200">Detaylı Rapor</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fontWeight: 700, fill: '#94A3B8'}} 
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                  <RechartsTooltip 
                    cursor={{fill: '#F8FAFC', radius: 8}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', padding: '12px' }}
                  />
                  <Bar dataKey="present" fill="#0E2B4D" radius={[6, 6, 0, 0]} name="Mevcut" barSize={32} />
                  <Bar dataKey="late" fill="#CC0000" radius={[6, 6, 0, 0]} name="Geç" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 premium-card">
          <CardHeader className="border-b bg-slate-50/10">
            <CardTitle className="text-lg font-bold text-primary">{d.branchDist}</CardTitle>
            <CardDescription className="text-xs font-medium">Lokasyon bazlı aktif personel dağılımı</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {branchData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3.5 mt-6">
              {branchData.map((branch) => (
                <div key={branch.name} className="flex items-center justify-between text-sm group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors">
                  <div className="flex items-center">
                    <div className="w-3.5 h-3.5 rounded-full mr-3.5 shadow-sm ring-2 ring-white" style={{ backgroundColor: branch.color }}></div>
                    <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{branch.name}</span>
                  </div>
                  <Badge variant="secondary" className="font-extrabold px-3 bg-white border border-slate-100 shadow-sm text-primary">{branch.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
