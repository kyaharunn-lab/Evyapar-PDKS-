"use client"

import * as React from "react"
import { 
  Calendar, 
  Search, 
  Download, 
  MapPin, 
  QrCode, 
  UserCircle,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  History
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { translations } from "@/lib/translations"

const t = translations.common;

export default function AttendanceLogsPage() {
  const db = useFirestore();
  const logsQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "attendance_logs"), orderBy("entryTime", "desc"));
  }, [db]);

  const { data: logs, loading } = useCollection(logsQuery);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">{t.attendance}</h2>
          <p className="text-muted-foreground">Sistemdeki tüm giriş/çıkış hareketleri gerçek zamanlı listelenir.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-green-600 border-green-200 bg-green-50/50 hover:bg-green-50">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel Export
          </Button>
          <Button variant="outline" className="text-red-600 border-red-200 bg-red-50/50 hover:bg-red-50">
            <Download className="mr-2 h-4 w-4" />
            PDF Report
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-secondary/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Personel ara..." className="pl-9 h-9" />
              </div>
              <Button variant="outline" size="sm" className="h-9">
                <Calendar className="mr-2 h-4 w-4" />
                Tarih Seçin
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-9 px-3 border-dashed">
                <Filter className="mr-2 h-3 w-3" />
                Tüm Şubeler
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center opacity-40">
              <History className="h-12 w-12 mb-4" />
              <p className="text-lg font-bold">Henüz giriş/çıkış kaydı yok.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-transparent">
                  <TableHead>Personel ID</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Giriş</TableHead>
                  <TableHead>Çıkış</TableHead>
                  <TableHead>Yöntem</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Konum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{log.personnelId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{log.date || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        {log.entryTime?.toDate().toLocaleTimeString() || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        {log.exitTime?.toDate().toLocaleTimeString() || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-medium bg-secondary px-1.5 py-0.5 rounded">{log.verificationMethod || "QR"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {log.status === 'OnTime' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-accent" />
                        )}
                        <span className={`text-xs font-semibold ${log.status === 'OnTime' ? 'text-green-600' : 'text-accent'}`}>
                          {log.status === 'OnTime' ? 'Zamanında' : 'Gecikme'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {log.location || "-"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
