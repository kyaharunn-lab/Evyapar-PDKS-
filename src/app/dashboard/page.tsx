"use client"

import * as React from "react"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp, 
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Activity
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

const flowData = [
  { time: "07:00", count: 12 },
  { time: "08:00", count: 45 },
  { time: "09:00", count: 142 },
  { time: "10:00", count: 35 },
  { time: "11:00", count: 18 },
  { time: "12:00", count: 22 },
  { time: "13:00", count: 15 },
  { time: "14:00", count: 12 },
  { time: "15:00", count: 10 },
  { time: "16:00", count: 28 },
  { time: "17:00", count: 115 },
  { time: "18:00", count: 52 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">{d.totalStaff} Paneli</h2>
          <p className="text-muted-foreground mt-1">Tüm şubelerdeki personel durumuna genel bakış.</p>
        </div>
        <Badge variant="outline" className="px-4 py-2 rounded-xl bg-white shadow-sm font-medium border-dashed">
          <Activity className="w-3 h-3 mr-2 text-accent" />
          Canlı İzleme Aktif
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: d.totalStaff, value: "142", sub: "+2 yeni kayıt", icon: Users, color: "primary" },
          { title: d.activeToday, value: "128", sub: "%92 katılım oranı", icon: UserCheck, color: "green-600", trend: "up" },
          { title: d.lateArrivals, value: "12", sub: "Vardiyaların %8'i", icon: Clock, color: "accent", trend: "up" },
          { title: d.absenteeism, value: "2", sub: "-1.2% azalma", icon: UserX, color: "muted-foreground", trend: "down" },
        ].map((item, i) => (
          <Card key={i} className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.title}</CardTitle>
              <div className={cn("p-2 rounded-xl bg-secondary")}>
                <item.icon className={cn("h-4 w-4", `text-${item.color}`)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-primary">{item.value}</div>
              <p className={cn("text-xs mt-1 font-medium", 
                item.trend === "up" ? "text-green-600" : item.trend === "down" ? "text-blue-600" : "text-muted-foreground")}>
                {item.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-4 premium-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">{d.weeklyFlow}</CardTitle>
            <CardDescription>Son 7 günlük personel performans grafiği</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <RechartsTooltip 
                    cursor={{fill: '#F1F5F9'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="present" fill="#0E2B4D" radius={[6, 6, 0, 0]} name="Mevcut" barSize={32} />
                  <Bar dataKey="late" fill="#CC0000" radius={[6, 6, 0, 0]} name="Geç" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 premium-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">{d.branchDist}</CardTitle>
            <CardDescription>Lokasyon bazlı aktif personel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {branchData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {branchData.map((branch) => (
                <div key={branch.name} className="flex items-center justify-between text-sm group cursor-pointer">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{ backgroundColor: branch.color }}></div>
                    <span className="font-semibold text-primary/80 group-hover:text-primary transition-colors">{branch.name}</span>
                  </div>
                  <Badge variant="secondary" className="font-bold">{branch.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-primary">{d.traffic}</CardTitle>
            <CardDescription>Günlük giriş ve çıkış yoğunluğu (Saatlik)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowData}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0E2B4D" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0E2B4D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="count" stroke="#0E2B4D" strokeWidth={3} fillOpacity={1} fill="url(#colorFlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-primary">{d.recentField}</CardTitle>
              <CardDescription>GPS doğrulamalı uzaktan kayıtlar</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-accent font-bold">
              Tümünü Gör <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Ahmet Yılmaz", location: "İnşaat Sahası B", time: "08:15", type: "Saha" },
                { name: "Selin Demir", location: "Müşteri Ofisi - Levent", time: "09:02", type: "Mobil" },
                { name: "Caner Aydın", location: "Lojistik Merkezi", time: "09:45", type: "Saha" },
                { name: "Merve Kaya", location: "Satış Rotası 1", time: "10:10", type: "Mobil" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-border hover:bg-secondary/50 transition-all cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{item.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-primary">{item.time}</p>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold mt-1 bg-white">{item.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
