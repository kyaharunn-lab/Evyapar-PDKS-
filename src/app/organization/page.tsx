"use client"

import * as React from "react"
import { Briefcase, Building2, Network, Users2 } from "lucide-react"

import BranchesPage from "@/app/branches/page"
import DepartmentsPage from "@/app/departments/page"
import PositionsPage from "@/app/positions/page"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function readCount(key: string) {
  if (typeof window === "undefined") return 0
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(value) ? value.length : 0
  } catch {
    return 0
  }
}

export default function OrganizationPage() {
  const [counts, setCounts] = React.useState({ branches: 0, departments: 0, positions: 0 })

  React.useEffect(() => {
    setCounts({
      branches: readCount("app_branches"),
      departments: readCount("app_departments"),
      positions: readCount("app_positions"),
    })
  }, [])

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_28rem),linear-gradient(135deg,#071426_0%,#111a3b_48%,#312e81_100%)] p-8 text-white shadow-2xl shadow-slate-300/40">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 rounded-full border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
              <Network className="mr-2 h-3.5 w-3.5" /> Enterprise Organization Center
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight">Organizasyon Yapısı</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              Şube, departman ve pozisyon yönetimini tek merkezden yönetin. Eski route yapıları aktif kalmaya devam eder.
            </p>
          </div>
          <div className="grid min-w-[320px] grid-cols-3 gap-3">
            <Metric icon={Building2} label="Şube" value={counts.branches} />
            <Metric icon={Users2} label="Departman" value={counts.departments} />
            <Metric icon={Briefcase} label="Pozisyon" value={counts.positions} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="branches" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            <Tab value="branches" icon={Building2} label="Şubeler" />
            <Tab value="departments" icon={Users2} label="Departmanlar" />
            <Tab value="positions" icon={Briefcase} label="Pozisyonlar" />
          </TabsList>
        </div>
        <TabsContent value="branches" className="mt-0"><BranchesPage /></TabsContent>
        <TabsContent value="departments" className="mt-0"><DepartmentsPage /></TabsContent>
        <TabsContent value="positions" className="mt-0"><PositionsPage /></TabsContent>
      </Tabs>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="rounded-2xl border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-xl">
      <CardContent className="p-4">
        <Icon className="mb-3 h-5 w-5 text-sky-200" />
        <div className="text-2xl font-extrabold">{value}</div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-300">{label}</div>
      </CardContent>
    </Card>
  )
}

function Tab({ value, icon: Icon, label }: { value: string; icon: any; label: string }) {
  return (
    <TabsTrigger value={value} className="rounded-xl px-4 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg">
      <Icon className="mr-2 h-4 w-4" />{label}
    </TabsTrigger>
  )
}
