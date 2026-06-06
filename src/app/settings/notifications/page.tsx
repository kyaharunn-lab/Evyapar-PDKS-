"use client"

import * as React from "react"
import { Bell, History, Send, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { formatDateTimeTR } from "@/lib/date-time"
import { writeSharedRecord } from "@/lib/shared-data-sync"

const SETTINGS_KEY = "app_notification_settings"
const PERSONNEL_KEY = "app_personnel"

type NotificationLog = {
  id: string
  title: string
  message: string
  recipient: string
  recipientId: string
  status: "Gönderildi" | "Başarısız"
  createdAt: string
  detail?: string
  type?: string
  channel?: string
}

function readArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readNotificationSettings() {
  if (typeof window === "undefined") return { logs: [] as NotificationLog[] }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}")
    return { ...parsed, logs: Array.isArray(parsed?.logs) ? parsed.logs : [] }
  } catch {
    return { logs: [] as NotificationLog[] }
  }
}

function getPersonnelId(person: any) {
  return String(person?.id || person?.personnelId || person?.uid || person?.email || "")
}

function getPersonnelName(person: any) {
  return (person?.fullName || [person?.name || person?.firstName, person?.surname || person?.lastName].filter(Boolean).join(" ") || person?.email || getPersonnelId(person) || "Personel").toString()
}

export default function NotificationSettingsPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [personnel, setPersonnel] = React.useState<any[]>([])
  const [logs, setLogs] = React.useState<NotificationLog[]>([])
  const [title, setTitle] = React.useState("Evyapar PDKS Bildirimi")
  const [message, setMessage] = React.useState("")
  const [targetMode, setTargetMode] = React.useState<"all" | "person">("all")
  const [selectedPersonnelId, setSelectedPersonnelId] = React.useState("")
  const [sending, setSending] = React.useState(false)

  const load = React.useCallback(() => {
    setPersonnel(readArray(PERSONNEL_KEY).filter((person: any) => !person?.isDeleted))
    setLogs(readNotificationSettings().logs)
  }, [])

  React.useEffect(() => {
    load()
    const refresh = () => load()
    window.addEventListener("storage", refresh)
    window.addEventListener("app-personnel-updated", refresh)
    return () => {
      window.removeEventListener("storage", refresh)
      window.removeEventListener("app-personnel-updated", refresh)
    }
  }, [load])

  const selectedPerson = React.useMemo(() => {
    return personnel.find((person) => getPersonnelId(person) === selectedPersonnelId)
  }, [personnel, selectedPersonnelId])

  const persistLog = React.useCallback(async (log: NotificationLog) => {
    const current = readNotificationSettings()
    const next = {
      ...current,
      logs: [log, ...(current.logs || [])],
      updatedAt: Date.now(),
    }
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    setLogs(next.logs)
    await writeSharedRecord(db, "notificationLogs", log)
  }, [db])

  const resetMessage = () => {
    setMessage("")
  }

  const sendNotification = async () => {
    const cleanTitle = title.trim()
    const cleanMessage = message.trim()

    if (!cleanTitle || !cleanMessage) {
      toast({ variant: "destructive", title: "Eksik bilgi", description: "Başlık ve mesaj zorunludur." })
      return
    }

    if (targetMode === "person" && !selectedPerson) {
      toast({ variant: "destructive", title: "Personel seçin", description: "Seçili personel hedefi için personel seçimi zorunludur." })
      return
    }

    const recipient = targetMode === "all" ? "Tüm kullanıcılar" : getPersonnelName(selectedPerson)
    const recipientId = targetMode === "all" ? "all" : getPersonnelId(selectedPerson)
    const payload = targetMode === "all"
      ? { title: cleanTitle, message: cleanMessage, included_segments: ["Subscribed Users"] }
      : { title: cleanTitle, message: cleanMessage, include_external_user_ids: [recipientId] }

    setSending(true)
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result?.error || "Bildirim gönderilemedi.")
      }

      const log: NotificationLog = {
        id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: cleanTitle,
        message: cleanMessage,
        recipient,
        recipientId,
        status: "Gönderildi",
        createdAt: new Date().toISOString(),
        type: "Manuel bildirim",
        channel: "OneSignal",
        detail: result?.result?.id ? `OneSignal ID: ${result.result.id}` : "OneSignal bildirimi gönderildi.",
      }
      await persistLog(log)
      resetMessage()
      toast({ title: "Bildirim gönderildi", description: recipient })
    } catch (error) {
      const log: NotificationLog = {
        id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: cleanTitle,
        message: cleanMessage,
        recipient,
        recipientId,
        status: "Başarısız",
        createdAt: new Date().toISOString(),
        type: "Manuel bildirim",
        channel: "OneSignal",
        detail: error instanceof Error ? error.message : "Bildirim gönderilemedi.",
      }
      await persistLog(log)
      toast({ variant: "destructive", title: "Bildirim gönderilemedi", description: log.detail })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
          <Bell className="h-3.5 w-3.5" />
          OneSignal
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-primary">Bildirim Gönder</h2>
        <p className="max-w-2xl text-sm font-medium text-muted-foreground">
          Mobil kullanıcılarınıza sade ve hızlı şekilde OneSignal bildirimi gönderin.
        </p>
      </div>

      <Card className="premium-card">
        <CardHeader className="border-b bg-slate-50/40">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
            <Send className="h-5 w-5 text-accent" />
            Yeni Bildirim
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Bildirim başlığı</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Başlık yazın" />
            </div>
            <div className="space-y-2">
              <Label>Hedef seçimi</Label>
              <Select value={targetMode} onValueChange={(value: "all" | "person") => setTargetMode(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Hedef seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm kullanıcılar</SelectItem>
                  <SelectItem value="person">Seçili personel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetMode === "person" && (
            <div className="space-y-2">
              <Label>Personel</Label>
              <Select value={selectedPersonnelId} onValueChange={setSelectedPersonnelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Personel seçin" />
                </SelectTrigger>
                <SelectContent>
                  {personnel.length === 0 ? (
                    <SelectItem value="none" disabled>Personel bulunamadı</SelectItem>
                  ) : personnel.map((person) => (
                    <SelectItem key={getPersonnelId(person)} value={getPersonnelId(person)}>
                      {getPersonnelName(person)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Bildirim mesajı</Label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Kullanıcıya gönderilecek mesajı yazın"
              className="min-h-32 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={sendNotification} disabled={sending} className="h-11 rounded-2xl px-6">
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="border-b bg-slate-50/40">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
            <History className="h-5 w-5 text-accent" />
            Bildirim Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="grid min-h-56 place-items-center p-8 text-center">
              <div>
                <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-bold text-muted-foreground">Henüz bildirim geçmişi yok.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">Başlık</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>Hedef</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="pr-6">Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/80">
                    <TableCell className="pl-6 font-bold text-primary">{log.title || "-"}</TableCell>
                    <TableCell className="max-w-[360px] truncate text-sm text-slate-600">{log.message || log.detail || "-"}</TableCell>
                    <TableCell className="text-sm font-semibold text-slate-700">{log.recipient || "-"}</TableCell>
                    <TableCell>
                      <Badge className={log.status === "Gönderildi" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-rose-50 text-rose-700 hover:bg-rose-50"}>
                        {log.status || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-sm text-slate-500">{formatDateTimeTR(log.createdAt)}</TableCell>
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
