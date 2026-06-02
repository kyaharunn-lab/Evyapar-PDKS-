"use client"

import * as React from "react"
import { Download, Eye, Maximize2, Printer, X } from "lucide-react"

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

function downloadQrImage(image: string, filename: string) {
  const link = document.createElement("a")
  link.href = image
  link.download = filename
  link.click()
}

function printQrDocument(items: Array<{ name: string; branch: string; type: string; image: string; value: string }>) {
  if (!items.length) return
  const win = window.open("", "_blank", "width=720,height=820")
  if (!win) return
  win.document.write(`
    <html>
      <head><title>QR Kodlari</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        ${items.map((item) => `
          <section style="page-break-inside: avoid; text-align: center; margin-bottom: 32px;">
            <h2 style="margin: 0 0 6px;">${item.name}</h2>
            <p style="margin: 0 0 16px;">${item.branch} - ${item.type}</p>
            <img src="${item.image}" style="width: 260px; height: 260px;" />
            <pre style="white-space: pre-wrap; word-break: break-word; text-align: left; margin-top: 18px; padding: 12px; background: #f1f5f9; border-radius: 12px;">${item.value}</pre>
          </section>
        `).join("")}
        <script>window.onload = () => window.print()</script>
      </body>
    </html>
  `)
  win.document.close()
}

function QrDetailModal({ point, branch, onClose }: { point: any; branch: any; onClose: () => void }) {
  const value = qrPayload(point, branch)
  const image = qrImageUrl(value, 320)
  const name = (point?.name || point?.title || point?.qrPointName || "QR Noktasi").toString()
  const type = qrType(point)
  const active = isActive(point)
  const branchLabel = point?.branchName || branchName(branch)
  const filename = `${name.replace(/\s+/g, "-").toLowerCase()}-${getId(point) || "qr"}.png`
  const printItem = { name, branch: branchLabel, type, image, value }

  const openFullscreen = () => {
    const win = window.open("", "_blank", "width=520,height=640")
    if (!win) return
    win.document.write(`
      <html>
        <head><title>${name}</title></head>
        <body style="font-family: Arial, sans-serif; display: grid; min-height: 100vh; place-items: center; margin: 0; background: #f8fafc;">
          <main style="text-align: center; padding: 24px;">
            <h1>${name}</h1>
            <p>${branchLabel} - ${type}</p>
            <img src="${image}" style="width: min(80vw, 420px); height: min(80vw, 420px);" />
            <pre style="white-space: pre-wrap; word-break: break-word; text-align: left; max-width: 520px; margin-top: 24px;">${value}</pre>
          </main>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <Card className="max-h-[92dvh] w-full max-w-2xl overflow-auto rounded-[28px] border-white/70 bg-white shadow-2xl">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-extrabold text-primary">{name}</CardTitle>
              <p className="mt-1 text-sm font-semibold text-slate-500">{branchLabel} - {type}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="rounded-2xl" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="grid place-items-center rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <img src={image} alt={`${name} QR`} className="h-48 w-48" />
          </div>
          <div className="space-y-3">
            <InfoRow label="Sube adi" value={branchLabel} />
            <InfoRow label="QR tipi" value={type} />
            <InfoRow label="Durum" value={active ? "Aktif" : "Pasif"} />
            <div>
              <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">QR metin degeri</p>
              <p className="max-h-28 overflow-auto rounded-2xl bg-slate-950 p-3 font-mono text-[10px] leading-4 text-white/80">{value}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" className="h-10 rounded-2xl text-xs font-bold" onClick={() => downloadQrImage(image, filename)}>
                <Download className="mr-2 h-4 w-4" /> PNG
              </Button>
              <Button type="button" variant="outline" className="h-10 rounded-2xl text-xs font-bold" onClick={() => printQrDocument([printItem])}>
                <Printer className="mr-2 h-4 w-4" /> Yazdir
              </Button>
              <Button type="button" variant="outline" className="h-10 rounded-2xl text-xs font-bold" onClick={openFullscreen}>
                <Maximize2 className="mr-2 h-4 w-4" /> Tam ekran
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs">
      <span className="font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-right font-extrabold text-slate-700">{value}</span>
    </div>
  )
}

function QrCard({ point, branch, selected, onSelectedChange, onDetail }: { point: any; branch: any; selected: boolean; onSelectedChange: (checked: boolean) => void; onDetail: () => void }) {
  const value = qrPayload(point, branch)
  const image = qrImageUrl(value)
  const name = (point?.name || point?.title || point?.qrPointName || "QR Noktasi").toString()
  const type = qrType(point)
  const active = isActive(point)

  const filename = `${name.replace(/\s+/g, "-").toLowerCase()}-${getId(point) || "qr"}.png`
  const printItem = { name, branch: point?.branchName || branchName(branch), type, image, value }

  const printQr = () => {
    printQrDocument([printItem])
  }

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <input type="checkbox" checked={selected} onChange={(event) => onSelectedChange(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
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
          <Button type="button" variant="outline" className="h-10 rounded-2xl text-xs font-bold" onClick={onDetail}>
            <Eye className="mr-2 h-4 w-4" /> Detay Gor
          </Button>
          <Button type="button" variant="outline" className="h-10 rounded-2xl text-xs font-bold" onClick={() => downloadQrImage(image, filename)}>
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
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [detailPoint, setDetailPoint] = React.useState<any | null>(null)

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

  const selectedItems = data.qrPoints
    .filter((point) => selectedIds.includes(getId(point)))
    .map((point) => {
      const branchId = (point?.branchId || point?.branchCode || "").toString()
      const branch = data.branches.find((item) => [item?.id, item?.branchCode, item?.code].map((value) => (value || "").toString()).includes(branchId))
      const value = qrPayload(point, branch)
      const name = (point?.name || point?.title || point?.qrPointName || "QR Noktasi").toString()
      return {
        point,
        branch,
        name,
        branchName: point?.branchName || branchName(branch),
        type: qrType(point),
        value,
        image: qrImageUrl(value),
      }
    })

  const detailBranchId = (detailPoint?.branchId || detailPoint?.branchCode || "").toString()
  const detailBranch = data.branches.find((item) => [item?.id, item?.branchCode, item?.code].map((value) => (value || "").toString()).includes(detailBranchId))

  const exportSelectedPng = () => {
    selectedItems.forEach((item) => downloadQrImage(item.image, `${item.name.replace(/\s+/g, "-").toLowerCase()}-${getId(item.point) || "qr"}.png`))
  }

  const exportSelectedPdf = () => {
    printQrDocument(selectedItems.map((item) => ({ name: item.name, branch: item.branchName, type: item.type, image: item.image, value: item.value })))
  }

  return (
    <section className="space-y-4">
      {detailPoint ? <QrDetailModal point={detailPoint} branch={detailBranch} onClose={() => setDetailPoint(null)} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-primary">QR Kod Gorselleri</h3>
          <p className="text-sm font-medium text-slate-500">Sube bazli QR kodlari goruntuleyin, indirin veya yazdirin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-2xl text-xs font-bold" disabled={!selectedItems.length} onClick={exportSelectedPng}>Secili PNG</Button>
          <Button type="button" variant="outline" className="rounded-2xl text-xs font-bold" disabled={!selectedItems.length} onClick={exportSelectedPdf}>Secili PDF/Yazdir</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.qrPoints.map((point) => {
          const branchId = (point?.branchId || point?.branchCode || "").toString()
          const branch = data.branches.find((item) => [item?.id, item?.branchCode, item?.code].map((value) => (value || "").toString()).includes(branchId))
          const id = getId(point)
          return (
            <QrCard
              key={id}
              point={point}
              branch={branch}
              selected={selectedIds.includes(id)}
              onSelectedChange={(checked) => setSelectedIds((current) => checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id))}
              onDetail={() => setDetailPoint(point)}
            />
          )
        })}
      </div>
    </section>
  )
}
