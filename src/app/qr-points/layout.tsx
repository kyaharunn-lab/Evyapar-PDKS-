import type * as React from "react"

import { QrCodeGallery } from "@/components/qr-points/qr-code-gallery"

export default function QrPointsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      {children}
      <QrCodeGallery />
    </div>
  )
}
