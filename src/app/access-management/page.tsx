"use client"

import * as React from "react"
import { Building2, KeyRound, LockKeyhole, MonitorSmartphone, ShieldCheck, UserCog } from "lucide-react"

import AccessControlPage from "@/app/access-control/page"
import RolesPage from "@/app/roles/page"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function readArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export default function AccessManagementPage() {
  const [stats, setStats] = React.useState({ roles: 0, access: 0, personnel: 0, branches: 0 })

  React.useEffect(() => {
    setStats({
      roles: readArray("app_roles").length,
      access: [...readArray("app_access_controls"), ...readArray("accessControls")].length,
      personnel: readArray("app_personnel").filter((person: any) => !person?.isDeleted).length,
      branches: readArray("app_branches").length,
    })
  }, [])

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.34),transparent_28rem),linear-gradient(135deg,#06101f_0%,#101a3a_50%,#1e1b4b_100%)] p-8 text-white shadow-2xl shadow-slate-300/40">
        <Badge className="mb-4 rounded-full border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
          <KeyRound className="mr-2 h-3.5 w-3.5" /> Access Governance Center
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">Yetki & Erişim Yönetimi</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
          Rol, sayfa, şube, kullanıcı ve mobil erişim politikalarını merkezi bir enterprise panelde yönetin.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Tanımlı Rol" value={stats.roles} icon={ShieldCheck} />
          <Metric label="Erişim Kaydı" value={stats.access} icon={LockKeyhole} />
          <Metric label="Personel" value={stats.personnel} icon={UserCog} />
          <Metric label="Şube" value={stats.branches} icon={Building2} />
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            <Tab value="roles" icon={ShieldCheck} label="Roller" />
            <Tab value="pages" icon={LockKeyhole} label="Sayfa Yetkileri" />
            <Tab value="branches" icon={Building2} label="Şube Yetkileri" />
            <Tab value="overrides" icon={UserCog} label="Kullanıcı Override" />
            <Tab value="mobile" icon={MonitorSmartphone} label="Mobil Yetkileri" />
          </TabsList>
        </div>
        <TabsContent value="roles" className="mt-0"><RolesPage /></TabsContent>
        <TabsContent value="pages" className="mt-0"><AccessControlPage /></TabsContent>
        <TabsContent value="branches"><AccessMatrix title="Şube Yetkileri" description="Şube bazlı erişim kuralları mevcut erişim kayıtlarından okunur." mode="branch" /></TabsContent>
        <TabsContent value="overrides"><AccessMatrix title="Kullanıcı Override" description="Personel özelinde tanımlanan istisnai yetkiler burada izlenir." mode="user" /></TabsContent>
        <TabsContent value="mobile"><AccessMatrix title="Mobil Yetkileri" description="Mobil uygulama erişimi ve cihaz bazlı kullanım izinleri." mode="mobile" /></TabsContent>
      </Tabs>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return <Card className="rounded-2xl border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-xl"><CardContent className="p-4"><Icon className="mb-3 h-5 w-5 text-sky-200" /><div className="text-2xl font-extrabold">{value}</div><div className="text-[11px] font-bold uppercase tracking-widest text-slate-300">{label}</div></CardContent></Card>
}

function Tab({ value, icon: Icon, label }: { value: string; icon: any; label: string }) {
  return <TabsTrigger value={value} className="rounded-xl px-4 py-2.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"><Icon className="mr-2 h-4 w-4" />{label}</TabsTrigger>
}

function AccessMatrix({ title, description, mode }: { title: string; description: string; mode: string }) {
  const [rows, setRows] = React.useState<any[]>([])
  React.useEffect(() => {
    const access = [...readArray("app_access_controls"), ...readArray("accessControls")]
    setRows(access)
  }, [])
  return (
    <Card className="rounded-[28px] border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary"><KeyRound className="h-5 w-5" />{title}</CardTitle>
        <p className="text-sm font-medium text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.slice(0, 9).map((row, index) => (
              <div key={`${mode}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-extrabold text-primary">{row.personnelName || row.userName || row.roleName || "Erişim kaydı"}</div>
                <div className="mt-1 text-xs font-semibold text-muted-foreground">{row.branchName || row.module || row.page || "Merkezi yetki politikası"}</div>
                <Badge className="mt-3 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{row.status || "Aktif"}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm font-semibold text-muted-foreground">
            Kayıtlı erişim verisi bulunmuyor. Yetkiler tanımlandığında bu panel localStorage üzerinden güncellenecek.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
