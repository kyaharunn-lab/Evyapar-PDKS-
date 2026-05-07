"use client"

import * as React from "react"
import { Building2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { translations } from "@/lib/translations"

const t = translations.common;

export default function BranchesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <Building2 className="h-8 w-8 text-accent" />
            {t.branches}
          </h2>
          <p className="text-muted-foreground mt-1">Şirket şubelerini ve lokasyonlarını yönetin.</p>
        </div>
        <Button className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Şube Ekle
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 min-h-[400px]">
        <div className="bg-secondary/50 p-6 rounded-full mb-6">
          <Building2 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">Henüz şube kaydı bulunmuyor.</h3>
        <p className="text-muted-foreground max-w-xs mb-6">Sisteme şube ekleyerek organizasyon yapısını oluşturmaya başlayabilirsiniz.</p>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
          İlk Şubeyi Tanımla
        </Button>
      </div>
    </div>
  )
}
