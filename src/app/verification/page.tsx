"use client"

import * as React from "react"
import { Fingerprint, MapPin, QrCode, ShieldCheck, Smartphone } from "lucide-react"

import DeviceIdsPage from "@/app/device-ids/page"
import LocationRulesPage from "@/app/location-rules/page"
import QrPointsPage from "@/app/qr-points/page"
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

export default function VerificationPage() {
  const [counts, setCounts] = React.useState({ qr: 0, devices: 0, locations: 0 })

  React.useEffect(() => {
    setCounts({
      qr: readCount("app_qr_points"),
      devices: readCount("app_device_ids"),
      locations: readCount("app_location_rules"),
    })
  }, [])

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_28rem),linear-gradient(135deg,#051120_0%,#111a3b_45%,#312e81_100%)] p-8 text-white shadow-2xl shadow-slate-300/40">
        <Badge className="mb-4 rounded-full border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
          <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Verification Policy Center
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">Doğrulama Kuralları</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
          QR noktaları, Device ID eşleşmeleri ve GPS/konum politikalarını tek kurumsal merkezde yönetin.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="QR Noktası" value={counts.qr} icon={QrCode} />
          <Metric label="Device ID" value={counts.devices} icon={Smartphone} />
          <Metric label="Konum Kuralı" value={counts.locations} icon={MapPin} />
        </div>
      </div>

      <Tabs defaultValue="qr" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            <Tab value="qr" icon={QrCode} label="QR Noktaları" />
            <Tab value="device" icon={Smartphone} label="Device ID" />
            <Tab value="gps" icon={MapPin} label="GPS/Konum" />
            <Tab value="policy" icon={Fingerprint} label="Güvenlik Politikaları" />
          </TabsList>
        </div>
        <TabsContent value="qr" className="mt-0"><QrPointsPage /></TabsContent>
        <TabsContent value="device" className="mt-0"><DeviceIdsPage /></TabsContent>
        <TabsContent value="gps" className="mt-0"><LocationRulesPage /></TabsContent>
        <TabsContent value="policy"><PolicyPanel /></TabsContent>
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

function PolicyPanel() {
  const policies = [
    ["QR zorunluluğu", "app_system_settings içindeki PDKS QR politikasıyla senkron izlenir."],
    ["Device ID zorunluluğu", "Cihaz eşleşmeleri app_device_ids kayıtlarından doğrulanır."],
    ["GPS doğrulama", "Konum kuralları app_location_rules üzerinden yönetilir."],
    ["Audit entegrasyonu", "Kritik doğrulama olayları app_audit_logs içinde izlenir."],
  ]
  return (
    <Card className="rounded-[28px] border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <CardContent className="grid gap-4 p-6 md:grid-cols-2">
        {policies.map(([title, description]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ShieldCheck className="mb-4 h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-extrabold text-primary">{title}</h3>
            <p className="mt-2 text-sm font-medium text-muted-foreground">{description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
