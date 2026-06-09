"use client"

import * as React from "react"
import { collection, onSnapshot } from "firebase/firestore"
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
import { Skeleton } from "@/components/ui/skeleton"
import { translations } from "@/lib/translations"
import { formatDateTR, formatTimeTR } from "@/lib/date-time"
import { useFirestore } from "@/firebase"

const t = translations.common;
const ATTENDANCE_RECORDS_KEY = "app_attendance_records";
const SHIFTS_KEY = "app_shifts";
const BREAKS_KEY = "app_break_records";

function readArray(key: string) {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function displayTime(value: any) {
  if (!value) return "-";
  const text = String(value);
  if (/^\d{2}:\d{2}/.test(text)) return text.slice(0, 5);
  return formatTimeTR(value);
}

function displayStatus(status: any) {
  if (status === "inside") return "İçeride";
  if (status === "outside") return "Çıkış yaptı";
  if (status === "OnTime") return "Zamanında";
  return "Gecikme";
}

function minutesLabel(minutes: number | null) {
  if (minutes === null) return "-";
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours > 0 && mins > 0) return `${hours} sa ${mins} dk`;
  if (hours > 0) return `${hours} sa`;
  return `${mins} dk`;
}

function parseRecordDate(value: any) {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function breakPersonnelKey(item: any) {
  return String(item?.personnelId ?? item?.personelId ?? item?.personId ?? "");
}

function breakDate(item: any) {
  return parseRecordDate(item?.date || item?.breakStart || item?.startTime || item?.createdAt);
}

function breakDurationMinutes(item: any) {
  const saved = Number(item?.durationMinutes || item?.duration || 0);
  if (saved > 0) return saved;
  const start = new Date(item?.breakStart || item?.startTime || "").getTime();
  const end = new Date(item?.breakEnd || item?.endTime || "").getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 60000));
}

function totalBreakMinutesForRecord(log: any, breaks: any[]) {
  const personId = personnelKey(log);
  const date = recordDate(log);
  if (!personId || !date) return 0;
  return breaks
    .filter((item: any) => breakPersonnelKey(item) === personId && breakDate(item) === date)
    .reduce((total: number, item: any) => total + breakDurationMinutes(item), 0);
}

function totalInsideMinutes(log: any, now = new Date()) {
  const startValue = log.entryTime || log.checkInTime;
  const endValue = log.exitTime || log.checkOutTime;
  if (!startValue) return null;
  const start = new Date(startValue).getTime();
  if (Number.isNaN(start)) return null;
  const isClosed = Boolean(endValue) || String(log?.status || "").toLowerCase() === "outside" || log?.status === "Çıkış yaptı";
  if (!isClosed) return null;
  const end = new Date(endValue).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.round((end - start) / 60000));
}

function attendanceRow(log: any, shifts: any[] = [], breaks: any[] = [], now = new Date()) {
  const status = attendanceStatus(log, shifts, now);
  const overtimeMinutes = attendanceOvertimeMinutes(log, shifts, now);
  const totalMinutes = totalInsideMinutes(log, now);
  const breakMinutes = totalBreakMinutesForRecord(log, breaks);
  const netMinutes = totalMinutes === null ? null : Math.max(0, totalMinutes - breakMinutes);
  return {
    personel: log.personnelName || log["personelAdı"] || log["personelAdı"] || log.personnelId || log.personelId || "-",
    tarih: formatDateTR(recordDate(log)),
    giris: displayTime(log.entryTime || log.checkInTime || log.saat),
    cikis: displayTime(log.exitTime || log.checkOutTime),
    yontem: log.method || log.verificationMethod || log["doğrulamaYöntemi"] || log.dogrulamaYontemi || "QR",
    durum: status,
    fazlaMesai: overtimeMinutes > 0 ? `${overtimeMinutes} dk` : "-",
    toplamSure: minutesLabel(totalMinutes),
    mola: minutesLabel(breakMinutes),
    netCalisma: minutesLabel(netMinutes),
    konum: log.branchName || log.location || "-",
  };
}

function csvCell(value: any) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function htmlCell(value: any) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob(["\uFEFF", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function personnelKey(item: any) {
  return String(item?.personnelId ?? item?.personelId ?? item?.personId ?? "");
}

function recordDate(item: any) {
  return String(item?.date || item?.tarih || item?.checkInTime || item?.entryTime || "").slice(0, 10);
}

function recordTime(item: any) {
  const value = item?.checkInTime || item?.entryTime || item?.createdAt || item?.updatedAt || item?.date || item?.tarih || "";
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function recordBranchId(item: any) {
  return String(item?.branchId || item?.branch || item?.branchCode || "");
}

function timeToMinutes(value: any) {
  const text = String(value || "").slice(0, 5);
  const [hour, minute] = text.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function shiftMatchesRecord(shift: any, record: any) {
  const personId = personnelKey(record);
  const branchId = recordBranchId(record);
  const shiftDate = String(shift?.startDate || shift?.date || "").slice(0, 10);
  const date = recordDate(record);
  const personnelIds = Array.isArray(shift?.personnelIds) ? shift.personnelIds.map(String) : [];
  const shiftPersonIds = [shift?.personnelId, shift?.personId].map((value) => String(value || "")).filter(Boolean);
  const shiftBranchIds = [shift?.branchId, shift?.branch, shift?.branchCode].map((value) => String(value || "")).filter(Boolean);
  return (!shiftDate || !date || shiftDate === date) && (
    (!!personId && (personnelIds.includes(personId) || shiftPersonIds.includes(personId))) ||
    (!!branchId && shiftBranchIds.includes(branchId))
  );
}

function shiftEndMinutes(shifts: any[], record: any) {
  const shift = shifts.find((item) => shiftMatchesRecord(item, record));
  return timeToMinutes(shift?.shift?.endTime || shift?.endTime || shift?.exitTime);
}

function liveOvertimeMinutes(record: any, shifts: any[], now = new Date()) {
  if (String(record?.status || "").toLowerCase() !== "inside") return 0;
  const endMinutes = shiftEndMinutes(shifts, record);
  if (endMinutes === null) return 0;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.max(0, nowMinutes - endMinutes);
}

function savedOvertimeMinutes(record: any) {
  return Math.max(0, Number(record?.overtimeMinutes || 0));
}

function attendanceOvertimeMinutes(record: any, shifts: any[], now = new Date()) {
  return savedOvertimeMinutes(record) || liveOvertimeMinutes(record, shifts, now);
}

function attendanceStatus(record: any, shifts: any[], now = new Date()) {
  if (record?.checkOutTime || record?.exitTime || String(record?.status || "").toLowerCase() === "outside" || record?.status === "Çıkış yaptı") return "Çıkış yaptı";
  if (liveOvertimeMinutes(record, shifts, now) > 0) return "Fazla Mesai";
  if (record?.isLate) return "Gecikme";
  if (String(record?.status || "").toLowerCase() === "inside") return "İçeride";
  return displayStatus(record?.status);
}

function isActiveInside(item: any) {
  return String(item?.status || "").toLowerCase() === "inside" && !item?.checkOutTime && !item?.exitTime;
}

function filterDuplicateInside(records: any[]) {
  const latestInside = new Map<string, any>();
  records.filter(isActiveInside).forEach((item: any) => {
    const key = `${personnelKey(item)}-${recordDate(item)}`;
    const current = latestInside.get(key);
    if (!current || recordTime(item) >= recordTime(current)) latestInside.set(key, item);
  });

  return records.filter((item: any) => {
    if (!isActiveInside(item)) return true;
    const key = `${personnelKey(item)}-${recordDate(item)}`;
    return latestInside.get(key) === item;
  });
}

export default function AttendanceLogsPage() {
  const db = useFirestore();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [shifts, setShifts] = React.useState<any[]>([]);
  const [breaks, setBreaks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("");
  const [branchFilter, setBranchFilter] = React.useState("all");

  const loadLogs = React.useCallback(() => {
    setLogs(filterDuplicateInside(readArray(ATTENDANCE_RECORDS_KEY)));
    setShifts(readArray(SHIFTS_KEY));
    setBreaks([...readArray(BREAKS_KEY), ...readArray("app_breaks")]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadLogs();
    const refresh = () => loadLogs();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("app-attendance-records-updated", refresh);
    window.addEventListener("app-break-records-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("app-attendance-records-updated", refresh);
      window.removeEventListener("app-break-records-updated", refresh);
    };
  }, [loadLogs]);

  React.useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, "breaks"), (snapshot) => {
      const docs = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      setBreaks(docs);
      try {
        localStorage.setItem(BREAKS_KEY, JSON.stringify(docs));
      } catch {
        // Firestore remains the visible source for break totals
      }
    }, (error) => {
      console.warn("Firestore breaks listener failed for attendance totals; localStorage fallback active.", error);
    });
  }, [db]);

  const branchOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((log: any) => {
      const id = recordBranchId(log) || String(log?.branchName || log?.location || "");
      if (!id) return;
      map.set(id, String(log?.branchName || log?.location || id));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  const filteredLogs = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return logs.filter((log: any) => {
      const row = attendanceRow(log, shifts, breaks);
      const matchesSearch = !query || [
        row.personel,
        row.yontem,
        row.durum,
        row.konum,
        log.personnelId,
        log.personelId,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesDate = !dateFilter || recordDate(log) === dateFilter;
      const branchId = recordBranchId(log) || String(log?.branchName || log?.location || "");
      const matchesBranch = branchFilter === "all" || branchId === branchFilter;
      return matchesSearch && matchesDate && matchesBranch;
    });
  }, [branchFilter, dateFilter, logs, searchTerm, shifts, breaks]);

  const hasAttendanceFilter = Boolean(searchTerm || dateFilter || branchFilter !== "all");

  const handleExcelExport = React.useCallback(() => {
    const headers = ["Personel", "Tarih", "Giriş", "Çıkış", "Yöntem", "Durum", "Fazla Mesai", "Toplam Süre", "Mola", "Net Çalışma", "Konum"];
    const rows = filteredLogs.map((log) => {
      const row = attendanceRow(log, shifts, breaks);
      return [row.personel, row.tarih, row.giris, row.cikis, row.yontem, row.durum, row.fazlaMesai, row.toplamSure, row.mola, row.netCalisma, row.konum].map(csvCell).join(",");
    });
    const content = [headers.map(csvCell).join(","), ...rows].join("\n");
    downloadTextFile(`attendance-${new Date().toISOString().slice(0, 10)}.csv`, content, "text/csv;charset=utf-8");
  }, [breaks, filteredLogs, shifts]);

  const handlePdfReport = React.useCallback(() => {
    const rows = filteredLogs.map((log) => attendanceRow(log, shifts, breaks));
    const reportWindow = window.open("", "_blank", "width=1100,height=800");
    if (!reportWindow) {
      window.print();
      return;
    }

    reportWindow.document.write(`
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
            h1 { margin: 0 0 6px; font-size: 24px; }
            p { margin: 0 0 24px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background: #f8fafc; color: #334155; }
          </style>
        </head>
        <body>
          <h1>PDKS Attendance Report</h1>
          <p>Kayıt sayısı: ${rows.length} | Tarih: ${new Date().toLocaleDateString("tr-TR")}</p>
          <table>
            <thead>
              <tr><th>Personel</th><th>Tarih</th><th>Giriş</th><th>Çıkış</th><th>Yöntem</th><th>Durum</th><th>Fazla Mesai</th><th>Toplam Süre</th><th>Mola</th><th>Net Çalışma</th><th>Konum</th></tr>
            </thead>
            <tbody>
              ${rows.map((row) => `<tr><td>${htmlCell(row.personel)}</td><td>${htmlCell(row.tarih)}</td><td>${htmlCell(row.giris)}</td><td>${htmlCell(row.cikis)}</td><td>${htmlCell(row.yontem)}</td><td>${htmlCell(row.durum)}</td><td>${htmlCell(row.fazlaMesai)}</td><td>${htmlCell(row.toplamSure)}</td><td>${htmlCell(row.mola)}</td><td>${htmlCell(row.netCalisma)}</td><td>${htmlCell(row.konum)}</td></tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  }, [breaks, filteredLogs, shifts]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">{t.attendance}</h2>
          <p className="text-muted-foreground">Sistemdeki tüm giriş/çıkış hareketleri gerçek zamanlı listelenir.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-green-600 border-green-200 bg-green-50/50 hover:bg-green-50" onClick={handleExcelExport}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel Export
          </Button>
          <Button variant="outline" className="text-red-600 border-red-200 bg-red-50/50 hover:bg-red-50" onClick={handlePdfReport}>
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
                <Input
                  placeholder="Personel ara..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="relative">
                <Calendar className="mr-2 h-4 w-4" />
                <Input
                  type="date"
                  className="h-9 w-[150px] rounded-md border-slate-200 pl-3 text-sm"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  aria-label="Tarih seçin"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-9 px-3 border-dashed">
                <Filter className="mr-2 h-3 w-3" />
                <select
                  className="bg-transparent text-xs font-semibold outline-none"
                  value={branchFilter}
                  onChange={(event) => setBranchFilter(event.target.value)}
                  aria-label="Şube filtresi"
                >
                  <option value="all">Tüm Şubeler</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </Badge>
              {hasAttendanceFilter && (
                <Button variant="ghost" size="sm" className="h-9" onClick={() => {
                  setSearchTerm("");
                  setDateFilter("");
                  setBranchFilter("all");
                }}>
                  Sıfırla
                </Button>
              )}
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
          ) : filteredLogs.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center opacity-60">
              <History className="h-12 w-12 mb-4" />
              <p className="text-lg font-bold">Filtreye uygun kayıt bulunamadı.</p>
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
                  <TableHead>Fazla Mesai</TableHead>
                  <TableHead>Toplam Süre</TableHead>
                  <TableHead>Mola</TableHead>
                  <TableHead>Net Çalışma</TableHead>
                  <TableHead>Konum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: any) => {
                  const statusLabel = attendanceStatus(log, shifts);
                  const overtimeMinutes = attendanceOvertimeMinutes(log, shifts);
                  const row = attendanceRow(log, shifts, breaks);
                  const isOvertimeStatus = statusLabel === "Fazla Mesai";
                  const isLateStatus = statusLabel.startsWith("Geç");
                  const statusClass = isOvertimeStatus ? "text-amber-600" : isLateStatus ? "text-accent" : "text-green-600";
                  return (
                  <TableRow key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{log.personnelName || log["personelAdı"] || log["personelAdı"] || log.personnelId || log.personelId || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDateTR(recordDate(log))}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        {displayTime(log.entryTime || log.checkInTime || log.saat)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        {displayTime(log.exitTime || log.checkOutTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-medium bg-secondary px-1.5 py-0.5 rounded">{log.method || log.verificationMethod || log["doğrulamaYöntemi"] || log.dogrulamaYontemi || "QR"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {!isLateStatus && !isOvertimeStatus ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : isOvertimeStatus ? (
                          <Clock className="h-4 w-4 text-amber-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-accent" />
                        )}
                        <span className={`text-xs font-semibold ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={overtimeMinutes > 0 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                        {overtimeMinutes > 0 ? `${overtimeMinutes} dk` : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-primary">{row.toplamSure}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">{row.mola}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-green-700">{row.netCalisma}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {log.branchName || log.location || "-"}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

