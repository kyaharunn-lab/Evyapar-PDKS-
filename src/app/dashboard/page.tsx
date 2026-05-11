"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  CalendarPlus,
  Coffee,
  ShieldCheck,
  UserPlus
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
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
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, Timestamp } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

const d = translations.dashboard;
const t = translations.common;

export default function DashboardPage() {
  const db = useFirestore();
  
  // Real-time collections
  const personnelQuery = React.useMemo(() => db ? collection(db, "personnel") : null, [db]);
  const { data: personnel, loading: loadingPersonnel } = useCollection(personnelQuery);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logsQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "attendance_logs"), where("entryTime", ">=", Timestamp.fromDate(today)));
  }, [db]);
  const { data: todayLogs, loading: loadingLogs } = useCollection(logsQuery);

  const branchesQuery = React.useMemo(() => db ? collection(db, "branches") : null, [db]);
  const { data: branches } = useCollection(branchesQuery);

  const kpis = React.useMemo(() => {
    const totalStaff = personnel?.length || 0;
    const activeToday = todayLogs?.filter(log => !log.exitTime).length || 0;
    const lateArrivals = todayLogs?.filter(log => log.status === "Late").length || 0;
    const absenteeism = totalStaff > 0 ? totalStaff - (todayLogs?.length || 0) : 0;

    return [
      { title: d.totalStaff, value: totalStaff.toString(), sub: `${totalStaff} kayıtlı personel`, icon: Users, color: "text-primary", trend: "up", percentage: "0%" },
      { title: d.activeToday, value: activeToday.toString(), sub: totalStaff > 0 ? `%${Math.round((activeToday / totalStaff) * 100)} katılım` : "%0 katılım", icon: UserCheck, color: "text-green-600", trend: "up", percentage: "0%" },
      { title: d.lateArrivals, value: lateArrivals.toString(), sub: todayLogs?.length ? `%${Math.round((lateArrivals / todayLogs.length) * 100)} gecikme` : "%0 gecikme", icon: Clock, color: "text-accent", trend: "down", percentage: "0%" },
      { title: d.absenteeism, value: Math.max(0, absenteeism).toString(), sub: "Gelmeyen personel", icon: UserX, color: "text-slate-400", trend: "down", percentage: "0%" },
    ];
  }, [personnel, todayLogs]);

  const quickActions = [
    { title: "Personel Ekle", href: "/personnel", icon: UserPlus, tone: "from-indigo-600 to-sky-500" },
    { title: "Vardiya Planla", href: "/shifts", icon: CalendarPlus, tone: "from-violet-600 to-fuchsia-500" },
    { title: "Mola Başlat", href: "/breaks", icon: Coffee, tone: "from-orange-500 to-amber-400" },
    { title: "Erişim Yönet", href: "/access-control", icon: ShieldCheck, tone: "from-emerald-500 to-teal-400" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight premium-gradient-text">{t.dashboard}</h2>
          <p className="text-muted-foreground mt-1 text-base">{d.kpiSummary}</p>
        </div>
        <Badge variant="outline" className="px-5 py-2.5 rounded-2xl bg-white/90 shadow-sm font-bold border-white animate-pulse text-xs tracking-wider">
          <Activity className="w-4 h-4 mr-2.5 text-accent" />
          CANLI İZLEME AKTİF
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            href={action.href}
            key={action.title}
            className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-[0_18px_55px_-36px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(79,70,229,0.45)]"
          >
            <div className={`absolute inset-y-0 right-0 w-28 bg-gradient-to-br ${action.tone} opacity-10 transition-opacity group-hover:opacity-20`} />
            <div className="relative flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${action.tone} text-white shadow-lg shadow-slate-900/10`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-primary">{action.title}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Hızlı işlem</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item, i) => (
          <Card key={i} className="premium-card relative overflow-hidden group">
            <div className="mini-sparkline" />
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">{item.title}</CardTitle>
              <div className="p-2.5 rounded-xl premium-icon-bg group-hover:scale-105 transition-transform">
                <item.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              {loadingPersonnel || loadingLogs ? (
                <Skeleton className="h-10 w-24 mb-2" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-extrabold text-primary tracking-tight">{item.value}</div>
                  <div className={cn("flex items-center text-[11px] font-bold", item.trend === "up" ? "text-green-600" : "text-accent")}>
                    {item.trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {item.percentage}
                  </div>
                </div>
              )}
              <p className="text-[12px] mt-2 font-medium text-slate-500">
                {item.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-4 premium-card">
          <CardHeader className="border-b bg-slate-50/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-primary">{d.weeklyFlow}</CardTitle>
                <CardDescription className="text-xs font-medium">Gerçek zamanlı personel performans grafiği</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200">Detaylı Rapor</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {(todayLogs?.length || 0) === 0 && !loadingLogs ? (
              <div className="h-[350px] flex flex-col items-center justify-center text-center opacity-40">
                <LayoutDashboard className="h-12 w-12 mb-4" />
                <p className="text-sm font-bold">{d.emptyLogs}</p>
              </div>
            ) : (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#94A3B8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                    <defs>
                      <linearGradient id="attendanceGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.55} />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="present" fill="url(#attendanceGradient)" radius={[10, 10, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 premium-card">
          <CardHeader className="border-b bg-slate-50/10">
            <CardTitle className="text-lg font-bold text-primary">{d.branchDist}</CardTitle>
            <CardDescription className="text-xs font-medium">Lokasyon bazlı aktif personel dağılımı</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!branches || branches.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-center opacity-40">
                <p className="text-sm font-bold">Henüz şube kaydı yok.</p>
              </div>
            ) : (
              <>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={branches} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={8} dataKey="value" strokeWidth={0}>
                        {branches.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={["#6366F1", "#0EA5E9", "#10B981", "#F97316"][index % 4]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3.5 mt-6">
                  {branches.slice(0, 4).map((branch: any) => (
                    <div key={branch.id} className="flex items-center justify-between text-sm p-2 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-3.5 h-3.5 rounded-full mr-3.5 shadow-sm ring-2 ring-white bg-primary"></div>
                        <span className="font-bold text-slate-700">{branch.name}</span>
                      </div>
                      <Badge variant="secondary" className="font-extrabold px-3 bg-white border border-slate-100 shadow-sm text-primary">0</Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
