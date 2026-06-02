"use client"

import * as React from "react"
import { Download, Printer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function readArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getId(item: any) {
  return (item?.id || item?.uid || item?.code || item?.qrPointId || item?.qrCode || "").toString()
}

function branchName(branch: any) {
  return (branch?.branchName || branch?.name || branch?.title || branch?.branchCode || "Sube").toString()
}

function qrType(point: any) {
  return (point?.type || point?.qrType || point?.kind || "genel").toString()
}

function isActive(point: any) {
  const status = (point?.status || "").toString().toLowerCase()
  return point?.active === true || status.includes("aktif") || status.includes("active")
}

function qrPayload(point: any, branch: any) {
  const payload = {
    branchId: (point?.branchId || point?.branchCode || getId(branch) || "").toString(),
    branchName: (point?.branchName || branchName(branch)).toString(),
    qrPointId: getId(point),
    type: qrType(point),
  }
  return point?.qrCode || JSON.stringify(payload)
}

function qrImageUrl(value: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(value)}`
}

function QrCard({ point, branch }: { point: any; branch: any }) {
  const value = qrPayload(point, branch)
  const image = qrImageUrl(value)
  const name = (point?.name || point?.title || point?.qrPointName || "QR Noktasi").toString()
  const type = qrType(point)
  const active = isActive(point)

  const download = () => {
    if (!image) return
    const link = document.createElement("a")
    link.href = image
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-${getId(point) || "qr"}.png`
    link.click()
  }

  const printQr = () => {
    const win = window.open("", "_blank", "width=420,height=620")
    if (!win) return
    win.document.write(`
      <html>
        <head><title>${name}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px; text-align: center;">
          <h2>${name}</h2>
          <p>${point?.branchName || branchName(branch)} - ${type}</p>
          <img src="${image}" style="width: 240px; height: 240px;" />
          <pre style="white-space: pre-wrap; word-break: break-word; text-align: left; margin-top: 24px;">${value}</pre>
          <script>window.onload = () => window.print()</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-extrabold text-primary">{name}</CardTitle>
            <p className="mt-1 text-xs font-semibold text-slate-500">{point?.branchName || branchName(branch)}</p>
          </div>
          <Badge className={cn("rounded-full px-3 py-1 text-[10px] font-black", active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-500 hover:bg-slate-100")}>
            {active ? "Aktif" : "Pasif"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
          <span>QR tipi</span>
          <span>{type}</span>
        </div>
        <div className="grid place-items-center rounded-3xl border border-slate-100 bg-white p-4">
          {image ? <img src={image} alt={`${name} QR`} className="h-40 w-40" /> : <div className="grid h-40 w-40 place-items-center text-xs font-bold text-slate-400">QR hazirlaniyor</div>}
        </div>
        <p className="max-h-20 overflow-auto rounded-2xl bg-slate-950 p-3 font-mono text-[10px] leading-4 text-white/80">{value}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-2xl text-xs font-bold" onClick={download}>
            <Download className="mr-2 h-4 w-4" /> PNG indir
          </Button>
          <Button type="button" variant="outline" className="h-10 rounded-2xl text-xs font-bold" onClick={printQr}>
            <Printer className="mr-2 h-4 w-4" /> Yazdir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function QrCodeGallery() {
  const [data, setData] = React.useState({ qrPoints: [] as any[], branches: [] as any[] })

  const load = React.useCallback(() => {
    setData({
      qrPoints: readArray("app_qr_points"),
      branches: readArray("app_branches"),
    })
  }, [])

  React.useEffect(() => {
    load()
    window.addEventListener("storage", load)
    window.addEventListener("app_qr_points-updated", load)
    window.addEventListener("app_branches-updated", load)
    return () => {
      window.removeEventListener("storage", load)
      window.removeEventListener("app_qr_points-updated", load)
      window.removeEventListener("app_branches-updated", load)
    }
  }, [load])

  if (!data.qrPoints.length) return null

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-extrabold text-primary">QR Kod Gorselleri</h3>
        <p className="text-sm font-medium text-slate-500">Sube bazli QR kodlari goruntuleyin, indirin veya yazdirin.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.qrPoints.map((point) => {
          const branchId = (point?.branchId || point?.branchCode || "").toString()
          const branch = data.branches.find((item) => [item?.id, item?.branchCode, item?.code].map((value) => (value || "").toString()).includes(branchId))
          return <QrCard key={getId(point)} point={point} branch={branch} />
        })}
      </div>
    </section>
  )
}
