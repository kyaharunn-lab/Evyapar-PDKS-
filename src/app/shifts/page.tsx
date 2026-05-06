"use client"

import * as React from "react"
import { 
  Plus,
  Settings2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { translations } from "@/lib/translations"

const s = translations.shifts;

export default function ShiftsPage() {
  const db = useFirestore();
  const shiftsQuery = React.useMemo(() => db ? collection(db, "shifts") : null, [db]);
  const { data: shifts, loading } = useCollection(shiftsQuery);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Vardiya Yönetimi</h2>
          <p className="text-muted-foreground mt-1">Sistemdeki tüm vardiya planları gerçek zamanlı listelenir.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl px-5 h-11 border-primary/20 hover:bg-primary/5">
            <Settings2 className="mr-2 h-4 w-4" />
            Yapılandır
          </Button>
          <Button className="bg-accent hover:bg-accent/90 rounded-xl px-6 h-11 shadow-lg shadow-accent/20">
            <Plus className="mr-2 h-4 w-4" />
            {s.newShift}
          </Button>
        </div>
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-secondary/20 border-b p-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg"><ChevronLeft className="h-4 w-4" /></Button>
              <h3 className="text-lg font-bold text-primary px-2">Cari Hafta Görünümü</h3>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !shifts || shifts.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center opacity-40">
              <CalendarClock className="h-12 w-12 mb-4" />
              <p className="text-lg font-bold">{s.empty}</p>
              <Button variant="outline" className="mt-4 border-primary text-primary" asChild>
                <div className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Vardiya Tanımla
                </div>
              </Button>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {shifts.map((shift: any) => (
                <div key={shift.id} className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-primary/10 text-primary border-none font-bold">
                      {shift.name}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Başlangıç:</span>
                      <span className="font-bold">{shift.startTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bitiş:</span>
                      <span className="font-bold">{shift.endTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-12">
          <Card className="premium-card bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center">
                <AlertCircle className="mr-3 h-5 w-5 text-accent" />
                {s.coverageAlerts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-70">Henüz aktif bir kapsama uyarısı bulunmamaktadır.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
