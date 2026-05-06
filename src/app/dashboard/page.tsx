"use client"

import * as React from "react"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard
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
        {kpis.map((item, i) => (
          <Card key={i} className="premium-card relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">{item.title}</CardTitle>
              <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-primary/5 transition-colors">
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
            </CardHeader>
            <CardContent>
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
                    <Bar dataKey="present" fill="#0E2B4D" radius={[6, 6, 0, 0]} barSize={32} />
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
                        {branches.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill="#0E2B4D" />)}
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
