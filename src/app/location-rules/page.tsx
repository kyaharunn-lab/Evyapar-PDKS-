"use client"

import * as React from "react"
import { MapPin, Plus, Radar, Save, ShieldCheck, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

const STORAGE_KEY = "app_location_rules"

function readArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const emptyForm = {
  name: "",
  branchId: "",
  radius: "150",
  latitude: "",
  longitude: "",
  required: true,
  status: "Aktif",
}

export default function LocationRulesPage() {
  const { toast } = useToast()
  const [rules, setRules] = React.useState<any[]>([])
  const [branches, setBranches] = React.useState<any[]>([])
  const [form, setForm] = React.useState<any>(emptyForm)

  React.useEffect(() => {
    setRules(readArray(STORAGE_KEY))
    setBranches(readArray("app_branches"))
  }, [])

  const save = () => {
    if (!form.name.trim() || !form.branchId) {
      toast({ variant: "destructive", title: "Eksik bilgi", description: "Kural adı ve şube zorunludur." })
      return
    }
    const next = [
      ...rules,
      {
        ...form,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setRules(next)
    setForm(emptyForm)
    toast({ title: "Konum kuralı kaydedildi", description: "GPS doğrulama politikası localStorage ile senkronlandı." })
  }

  const remove = (id: string) => {
    const next = rules.filter((rule) => rule.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setRules(next)
    toast({ title: "Konum kuralı silindi" })
  }

  const branchName = (id: string) => branches.find((branch) => branch.id === id || branch.code === id)?.name || "Şube"

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.28),transparent_24rem),linear-gradient(135deg,#06101f_0%,#111a3b_55%,#312e81_100%)] p-8 text-white shadow-2xl shadow-slate-300/40">
        <Badge className="mb-4 rounded-full border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
          <Radar className="mr-2 h-3.5 w-3.5" /> GPS Policy Engine
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">Konum Kuralları</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
          Şube bazlı GPS doğrulama, konum yarıçapı ve mobil giriş politikalarını localStorage üzerinde yönetin.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="rounded-[28px] border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary"><Plus className="h-5 w-5" />Yeni Konum Kuralı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Kural adı" value={form.name} onChange={(value) => setForm((prev: any) => ({ ...prev, name: value }))} />
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-slate-500">Şube seç</Label>
              <Select value={form.branchId} onValueChange={(value) => setForm((prev: any) => ({ ...prev, branchId: value }))}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Şube seçin" /></SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => <SelectItem key={branch.id || branch.code || branch.name} value={(branch.id || branch.code || branch.name).toString()}>{branch.name || branch.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Enlem" value={form.latitude} onChange={(value) => setForm((prev: any) => ({ ...prev, latitude: value }))} />
              <Field label="Boylam" value={form.longitude} onChange={(value) => setForm((prev: any) => ({ ...prev, longitude: value }))} />
            </div>
            <Field label="Yarıçap (metre)" value={form.radius} onChange={(value) => setForm((prev: any) => ({ ...prev, radius: value }))} />
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <div className="text-sm font-extrabold text-primary">GPS zorunlu</div>
                <div className="text-xs font-medium text-muted-foreground">Mobil girişte konum doğrulaması ister.</div>
              </div>
              <Switch checked={form.required} onCheckedChange={(checked) => setForm((prev: any) => ({ ...prev, required: checked }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-slate-500">Durum</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev: any) => ({ ...prev, status: value }))}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Pasif">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="h-11 w-full rounded-2xl bg-primary shadow-xl" onClick={save}><Save className="mr-2 h-4 w-4" />Kaydet</Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary"><MapPin className="h-5 w-5" />Tanımlı Konum Kuralları</CardTitle>
          </CardHeader>
          <CardContent>
            {rules.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Kural</TableHead><TableHead>Şube</TableHead><TableHead>Yarıçap</TableHead><TableHead>GPS</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-bold text-primary">{rule.name}</TableCell>
                        <TableCell>{branchName(rule.branchId)}</TableCell>
                        <TableCell>{rule.radius} m</TableCell>
                        <TableCell>{rule.required ? "Zorunlu" : "Opsiyonel"}</TableCell>
                        <TableCell><Badge className={rule.status === "Aktif" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-600 hover:bg-slate-100"}>{rule.status}</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" className="rounded-xl text-rose-600" onClick={() => remove(rule.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 text-center">
                <div>
                  <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-primary/40" />
                  <div className="text-sm font-bold text-primary">Tanımlı konum kuralı bulunmuyor.</div>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">Kayıt oluşturulduğunda sayfa yenilense bile app_location_rules içinde kalır.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase text-slate-500">{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl" />
    </div>
  )
}

