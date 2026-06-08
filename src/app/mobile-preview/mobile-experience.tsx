"use client"

import * as React from "react"
import {
  Bell,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock3,
  Download,
  Fingerprint,
  Home,
  IdCard,
  LocateFixed,
  LogOut,
  MapPin,
  QrCode,
  RefreshCw,
  Save,
  Smartphone,
  UserRound,
  Wifi,
  XCircle,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth, useFirestore } from "@/firebase"
import { collection, getDocs } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { ACCESS_STORAGE_KEYS, readCurrentAccess } from "@/lib/access-permissions"
import { loginWithLocalPersonnel, logoutLocalSession } from "@/lib/auth-session"
import { loginWithFirebasePersonnel } from "@/lib/firebase-auth-personnel"
import { formatDateTR } from "@/lib/date-time"
import { syncOneSignalSubscription } from "@/lib/onesignal-client"
import { deleteSharedRecord, useFirestoreLocalMirror, writeSharedRecord } from "@/lib/shared-data-sync"
import { cn } from "@/lib/utils"

const SETTINGS_KEY = "app_mobile_preview_settings"
const ATTENDANCE_KEY = "app_mobile_attendance_preview"
const ATTENDANCE_RECORDS_KEY = "app_attendance_records"
const LIVE_PRESENCE_KEY = "app_live_presence"
const AUDIT_KEY = "app_audit_logs"
const NONE = "__none__"
const MOBILE_ACCESS_STORAGE_KEYS = ["app_personnel", "app_auth_session", ...ACCESS_STORAGE_KEYS] as const
const MAX_GPS_DISTANCE_METERS = 150
const LEAVE_ATTACHMENT_ACCEPT = ["image/jpeg", "image/png", "application/pdf"]
const LEAVE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024

const screens = ["Ana", "Giriş", "QR", "GPS", "Vardiya", "İzin", "Mola", "Bildirim", "Profil"]
const themes = ["Koyu Premium", "Açık Kurumsal", "Evyapar Kırmızı", "Mavi/Mor Premium"]
const devices = ["iPhone", "Android", "Tablet"]
const states = ["Mesai dışında", "Mesai başladı", "Geç kaldı", "İçeride", "Molada", "Çıkış yaptı", "GPS dışında", "QR bekleniyor"]

function readArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function readObject(key: string) {
  if (typeof window === "undefined") return {}
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}")
    return value && typeof value === "object" && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

function writeArray(key: string, value: any[]) {
  localStorage.setItem(key, JSON.stringify(value))
}

function upsertLocalArrayRecord(key: string, record: any) {
  const current = readArray(key)
  const recordId = getId(record)
  const next = recordId
    ? [record, ...current.filter((item: any) => getId(item) !== recordId)]
    : [record, ...current]
  writeArray(key, next)
  window.dispatchEvent(new StorageEvent("storage", { key }))
}

function getId(item: any) {
  return (item?.id || item?.uid || item?.code || item?.branchCode || item?.departmentCode || item?.personnelCode || "").toString()
}

function qrPointMatchesBranch(point: any, branch: any) {
  const branchId = getId(branch)
  if (!branchId) return false
  return [point?.branchId, point?.branchCode, point?.locationId].map((value) => (value || "").toString()).includes(branchId)
}

function isActiveQrPoint(point: any) {
  return point?.active === true || isActive(point?.status)
}

function parseQrPayload(value: string) {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

function qrValueMatchesPoint(qrCode: string, point: any) {
  const payload = parseQrPayload(qrCode)
  if (payload) {
    const payloadBranchId = (payload.branchId || "").toString()
    const payloadPointId = (payload.qrPointId || payload.id || "").toString()
    const payloadType = (payload.type || "").toString().toLowerCase()
    const pointId = getId(point)
    const pointBranchId = (point?.branchId || point?.branchCode || point?.locationId || "").toString()
    const pointType = (point?.type || "").toString().toLowerCase()
    return Boolean(
      payloadPointId &&
      payloadPointId === pointId &&
      (!payloadBranchId || payloadBranchId === pointBranchId) &&
      (!payloadType || !pointType || payloadType === pointType)
    )
  }
  const value = (point?.qrCode || point?.code || point?.id || "").toString()
  return Boolean(value && value === qrCode)
}

function normalizeQrType(point: any) {
  return normalizeActionText(point?.type || point?.qrType || point?.kind || "Genel")
}

function isQrEntryOnly(point: any) {
  const type = normalizeQrType(point)
  return type.includes("giris") && !type.includes("cikis") && !type.includes("genel")
}

function isQrExitOnly(point: any) {
  const type = normalizeQrType(point)
  return type.includes("cikis") && !type.includes("giris") && !type.includes("genel")
}

function normalizeActionText(value: any) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
}

function isCheckInAction(value: any) {
  const text = normalizeActionText(value)
  return text.includes("giris") || text.includes("entry") || text.includes("checkin")
}

function isCheckOutAction(value: any) {
  const text = normalizeActionText(value)
  return text.includes("cikis") || text.includes("exit") || text.includes("checkout")
}

function vibrate(pattern: number | number[] = 80) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
  }
}

function formatWorkDuration(record: any) {
  const start = new Date(record?.checkInTime || record?.entryTime || record?.createdAt || Date.now()).getTime()
  const diff = Math.max(0, Date.now() - (Number.isNaN(start) ? Date.now() : start))
  const minutes = Math.max(1, Math.round(diff / 60000))
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return hours ? `${hours} saat ${remaining} dk` : `${remaining} dk`
}

const LATE_TOLERANCE_MINUTES = 10

function dateKeyFromValue(value: any) {
  if (!value) return ""
  if (typeof value === "string") return value.slice(0, 10)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function lateTimeToMinutes(value: any) {
  const text = (value || "").toString().slice(0, 5)
  const [hour, minute] = text.split(":").map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  return hour * 60 + minute
}

function attendanceEntryTime(record: any) {
  const value = record?.checkInTime || record?.entryTime || record?.time || record?.createdAt
  if (!value) return ""
  if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) return value.slice(0, 5)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.toString().slice(0, 5)
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
}

function shiftContainsPerson(shift: any, personId: string) {
  const assigned = Array.isArray(shift?.assignedPersonnel) ? shift.assignedPersonnel : []
  const assignedIds = [
    ...assigned.map((item: any) => (typeof item === "object" ? item?.id || item?.personnelId || item?.personId : item).toString()),
    ...((Array.isArray(shift?.personnelIds) ? shift.personnelIds : []).map((item: any) => item.toString())),
  ]
  return assignedIds.includes(personId)
}

function findTodayShiftForAttendance(record: any, shifts: any[]) {
  const personId = attendancePersonId(record)
  const today = dateKeyFromValue(record?.date || record?.checkInTime || record?.entryTime || record?.createdAt || new Date().toISOString())
  if (!personId || !today) return null
  return shifts.find((shift: any) => {
    const shiftDate = dateKeyFromValue(shift?.startDate || shift?.date || shift?.createdAt)
    return shiftDate === today && shiftContainsPerson(shift, personId)
  }) || null
}

function enrichAttendanceLateData(record: any, shifts: any[]) {
  if (record?.checkOutTime || record?.status === "outside") return record
  const shift = findTodayShiftForAttendance(record, shifts)
  if (!shift) return record
  const entryMinutes = lateTimeToMinutes(attendanceEntryTime(record))
  const shiftMinutes = lateTimeToMinutes(shift?.startTime || shift?.entryTime)
  if (entryMinutes === null || shiftMinutes === null) return record
  const lateMinutes = Math.max(0, entryMinutes - shiftMinutes - LATE_TOLERANCE_MINUTES)
  return {
    ...record,
    isLate: lateMinutes > 0,
    lateMinutes,
    lateText: lateMinutes > 0 ? `${lateMinutes} dk geç` : "",
    lateToleranceMinutes: LATE_TOLERANCE_MINUTES,
    shiftId: shift?.id || record?.shiftId,
    shiftName: shift?.name || shift?.shiftName || record?.shiftName,
  }
}

function personName(person: any) {
  return (person?.fullName || [person?.name || person?.firstName, person?.surname || person?.lastName].filter(Boolean).join(" ") || person?.displayName || "Personel").toString()
}

function branchName(branch: any) {
  return (branch?.branchName || branch?.name || branch?.title || branch?.branchCode || "Şube").toString()
}

function departmentName(department: any) {
  return (department?.departmentName || department?.name || department?.title || "Departman").toString()
}

function positionName(position: any) {
  return (position?.positionName || position?.name || position?.title || "Pozisyon").toString()
}

function valueText(value: any, fallback = "-") {
  return value === undefined || value === null || value === "" ? fallback : String(value)
}

function normalizeRoleToken(value: any) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "")
}

function findRoleForPerson(person: any, roles: any[]) {
  if (!person || !Array.isArray(roles)) return null
  const assigned = [
    person?.roleId,
    person?.role,
    person?.roleName,
    person?.assignedRole,
    person?.accessRole,
    person?.permissionRole,
  ].flatMap((value) => {
    if (value && typeof value === "object") {
      return [value.id, value.roleCode, value.code, value.roleName, value.name].map(normalizeRoleToken)
    }
    return [normalizeRoleToken(value)]
  }).filter(Boolean)
  if (!assigned.length) return null

  return roles.find((role) => {
    const tokens = [role?.id, role?.roleCode, role?.code, role?.roleName, role?.name]
      .map(normalizeRoleToken)
      .filter(Boolean)
    return tokens.some((token) => assigned.includes(token))
  }) || null
}

function normalizeStatus(value: any) {
  const raw = valueText(value, "Bekliyor").toLowerCase()
  if (raw.includes("approved") || raw.includes("onay")) return "Onaylandı"
  if (raw.includes("reject") || raw.includes("red")) return "Reddedildi"
  return "Bekliyor"
}

function canCreateMobileLeaveRequest(person: any, role: any = null) {
  if (!person) return false
  const permissions = {
    ...(role?.permissions || {}),
    ...(person?.permissions || person?.rolePermissions || {}),
  }
  return permissions?.canCreateLeaveRequest === true ||
    permissions?.leaveCreate === true ||
    permissions?.createLeaveRequest === true ||
    permissions?.manageLeaves === true
  const searchable = [
    person?.role,
    person?.roleName,
    person?.position,
    person?.positionName,
    person?.title,
  ].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR")
  return ["müdür", "mudur", "manager", "admin", "yönetici", "yonetici"].some((keyword) => searchable.includes(keyword))
}
function isActive(value: any) {
  if (typeof value === "boolean") return value
  const raw = valueText(value, "Active").toLowerCase()
  return ["active", "aktif", "true", "1"].includes(raw)
}

function hasBranchLocation(branch: any) {
  return Boolean(branch?.latitude || branch?.lat || branch?.location?.latitude) && Boolean(branch?.longitude || branch?.lng || branch?.location?.longitude)
}

function toCoordinate(value: any) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function getCoordinates(item: any) {
  const latitude = toCoordinate(item?.latitude ?? item?.lat ?? item?.location?.latitude ?? item?.location?.lat ?? item?.gps?.latitude ?? item?.gps?.lat)
  const longitude = toCoordinate(item?.longitude ?? item?.lng ?? item?.lon ?? item?.location?.longitude ?? item?.location?.lng ?? item?.location?.lon ?? item?.gps?.longitude ?? item?.gps?.lng)
  return latitude === null || longitude === null ? null : { latitude, longitude }
}

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadius = 6371000
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function verifyGpsDistance(branch: any, person: any, settings: any) {
  const branchCoordinates = getCoordinates(branch)
  if (!branchCoordinates) return { ok: true, status: "Şube konumu tanımlı değil", distance: null }

  const currentCoordinates = getCoordinates(settings) || getCoordinates(person)
  if (!currentCoordinates) return { ok: true, status: "Kullanıcı konumu tanımlı değil", distance: null }
  const distance = distanceMeters(currentCoordinates, branchCoordinates)
  const ok = distance <= MAX_GPS_DISTANCE_METERS
  return { ok, status: ok ? "GPS başarılı" : "GPS başarısız", distance }
}

function normalizeScreen(screen: any) {
  const raw = valueText(screen, "Ana")
  const map: Record<string, string> = {
    "Ana Sayfa": "Ana",
    "Giriş / Çıkış": "Giriş",
    "QR Okutma": "QR",
    "GPS Konum": "GPS",
    "Vardiyalarım": "Vardiya",
    "İzin Taleplerim": "İzin",
    "Bildirimler": "Bildirim",
    "Profilim": "Profil",
  }
  return screens.includes(raw) ? raw : map[raw] || "Ana"
}

function matchesPerson(record: any, personId: string) {
  const ids = [record?.personnelId, record?.personelId, record?.personId, record?.employeeId, record?.userId].map((v) => valueText(v, ""))
  return ids.includes(personId) || (Array.isArray(record?.personnelIds) && record.personnelIds.map(String).includes(personId))
}

function matchesBranch(record: any, branchId: string) {
  return [record?.branchId, record?.branchCode, record?.locationId].map((v) => valueText(v, "")).includes(branchId)
}

function todayDateKeyTR() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function shiftDisplayName(shift: any) {
  return valueText(shift?.name || shift?.shiftName || shift?.title, "Vardiya")
}

function shiftDateKey(shift: any) {
  return dateKeyFromValue(shift?.startDate || shift?.date || shift?.shiftDate || shift?.day || shift?.createdAt)
}

function shiftBranchLabel(shift: any, fallbackBranch: any) {
  return valueText(shift?.branchName || shift?.branchLabel || shift?.branch || (fallbackBranch ? branchName(fallbackBranch) : ""), "Tanımlı değil")
}

function findTodayMobileShift(shifts: any[], personId: string, branchId: string) {
  const today = todayDateKeyTR()
  return (Array.isArray(shifts) ? shifts : []).find((shift: any) => {
    const date = shiftDateKey(shift)
    if (date !== today) return false
    return matchesPerson(shift, personId) || matchesBranch(shift, branchId)
  }) || null
}

function getShiftEntryWarning(shifts: any[], personId: string, branchId: string, now = new Date()) {
  const shift = findTodayMobileShift(shifts, personId, branchId)
  if (!shift) return "Bugün için atanmış vardiyanız bulunmuyor."

  const start = timeToMinutes(shift?.startTime || shift?.entryTime || shift?.shift?.startTime)
  const end = timeToMinutes(shift?.endTime || shift?.exitTime || shift?.shift?.endTime)
  if (start === null || end === null) return null

  const current = now.getHours() * 60 + now.getMinutes()
  const outsideShiftHours = end >= start
    ? current < start || current > end
    : current < start && current > end

  return outsideShiftHours ? "Vardiya saatleri dışında giriş yaptınız." : null
}

function timeToMinutes(value: any) {
  const text = valueText(value, "").slice(0, 5)
  const [hour, minute] = text.split(":").map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  return hour * 60 + minute
}

function calculateLateInfo(shifts: any[], personId: string, branchId: string, checkIn: Date) {
  const today = checkIn.toISOString().slice(0, 10)
  const shift = shifts.find((item: any) => {
    const shiftDate = valueText(item?.startDate || item?.date, "").slice(0, 10)
    return (!shiftDate || shiftDate === today) && (matchesPerson(item, personId) || matchesBranch(item, branchId))
  })
  if (!shift) return null
  const shiftMinutes = timeToMinutes(shift?.shift?.startTime || shift?.startTime || shift?.entryTime)
  if (shiftMinutes === null) return null
  const checkInMinutes = checkIn.getHours() * 60 + checkIn.getMinutes()
  const lateToleranceMinutes = 10
  const rawLateMinutes = Math.max(0, checkInMinutes - shiftMinutes)
  const isLate = rawLateMinutes > lateToleranceMinutes
  return { isLate, lateMinutes: isLate ? rawLateMinutes : 0, lateToleranceMinutes }
}

function calculateOvertimeInfo(shifts: any[], personId: string, branchId: string, checkOut: Date) {
  const today = checkOut.toISOString().slice(0, 10)
  const shift = shifts.find((item: any) => {
    const shiftDate = valueText(item?.startDate || item?.date, "").slice(0, 10)
    return (!shiftDate || shiftDate === today) && (matchesPerson(item, personId) || matchesBranch(item, branchId))
  })
  const shiftEndMinutes = timeToMinutes(shift?.shift?.endTime || shift?.endTime || shift?.exitTime)
  if (shiftEndMinutes === null) return { isOvertime: false, overtimeMinutes: 0 }

  const checkOutMinutes = checkOut.getHours() * 60 + checkOut.getMinutes()
  const rawOvertimeMinutes = Math.max(0, checkOutMinutes - shiftEndMinutes)
  const overtimeMinutes = rawOvertimeMinutes > 15 ? rawOvertimeMinutes : 0
  return {
    isOvertime: overtimeMinutes > 0,
    overtimeMinutes,
    ...(overtimeMinutes > 0 ? { overtimeStatus: "uyarı" } : {}),
  }
}

function attendancePersonId(record: any) {
  return String(record?.personnelId ?? record?.personelId ?? record?.personId ?? "")
}

function attendanceDate(record: any) {
  return String(record?.date || record?.tarih || record?.checkInTime || record?.entryTime || "").slice(0, 10)
}

function attendanceTime(record: any) {
  const value = record?.checkInTime || record?.entryTime || record?.createdAt || record?.updatedAt || record?.date || record?.tarih || ""
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function isOpenAttendance(record: any, personId: string) {
  const status = String(record?.status || "").toLowerCase()
  return attendancePersonId(record) === String(personId)
    && (status === "inside" || status === "fazla mesai" || record?.status === "Fazla Mesai")
    && !record?.checkOutTime
    && !record?.exitTime
}

function isActiveLivePresence(record: any, personId: string) {
  if (!matchesPerson(record, personId)) return false
  const status = String(record?.status || "").toLowerCase()
  const isClosed = Boolean(record?.checkOutTime || record?.exitTime) || status === "outside" || status.includes("çıkış")
  if (isClosed) return false
  return !status || status === "inside" || status === "on_break" || status === "molada"
}

function latestOpenAttendance(records: any[], personId: string) {
  return records
    .filter((record) => isOpenAttendance(record, personId))
    .sort((a, b) => attendanceTime(b) - attendanceTime(a))[0]
}

function saveFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function downloadArchiveFile(url: string, filename: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = filename || "dosya"
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

function notifyAttendanceSync() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event("app-mobile-attendance-updated"))
  window.dispatchEvent(new Event("app-attendance-records-updated"))
  window.dispatchEvent(new Event("app-live-presence-updated"))
}

function isMobileUserModeRequested() {
  if (typeof window === "undefined") return false
  return new URLSearchParams(window.location.search).get("mode") === "user"
}

export function MobileExperience({ variant = "preview" }: { variant?: "preview" | "app" }) {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const isStandaloneApp = variant === "app"
  const [accessState, setAccessState] = React.useState(() => readCurrentAccess())
  const [userModeParam, setUserModeParam] = React.useState(() => isMobileUserModeRequested())
  const [data, setData] = React.useState<any>({
    personnel: [],
    branches: [],
    departments: [],
    positions: [],
    shifts: [],
    leaves: [],
    breaks: [],
    devices: [],
    qrPoints: [],
    roles: [],
    kvkk: [],
    notificationSettings: {},
    companySettings: {},
    systemSettings: {},
  })
  const [settings, setSettings] = React.useState<any>({
    personnelId: NONE,
    branchId: NONE,
    theme: "Mavi/Mor Premium",
    screen: "Ana",
    device: "iPhone",
    state: "Mesai dışında",
    qrStatus: "QR bekleniyor",
    gpsStatus: "Bekleniyor",
    isInside: false,
    currentStatus: "outside",
    activeAttendanceId: null,
    activePresenceId: null,
  })
  const [firestoreBootstrapped, setFirestoreBootstrapped] = React.useState(false)
  const sharedSyncTargets = React.useMemo(() => [
    { collectionName: "branches", storageKey: "app_branches" },
    { collectionName: "personnel", storageKey: "app_personnel" },
    { collectionName: "qrPoints", storageKey: "app_qr_points" },
    { collectionName: "shifts", storageKey: "app_shifts" },
    { collectionName: "roles", storageKey: "app_roles" },
    { collectionName: "leaveRequests", storageKey: "app_leave_requests" },
    { collectionName: "attendance", storageKey: "app_attendance_records" },
    { collectionName: "livePresence", storageKey: "app_live_presence" },
  ], [])

  const load = React.useCallback(() => {
    const saved = readObject(SETTINGS_KEY)
    const currentAccess = readCurrentAccess()
    const nextData = {
      personnel: readArray("app_personnel").filter((person: any) => !person?.isDeleted),
      branches: readArray("app_branches"),
      departments: readArray("app_departments"),
      positions: readArray("app_positions"),
      shifts: readArray("app_shifts"),
      leaves: readArray("app_leave_requests"),
      breaks: readArray("app_break_records"),
      devices: readArray("app_device_ids"),
      qrPoints: readArray("app_qr_points"),
      roles: readArray("app_roles"),
      kvkk: readArray("app_kvkk_consents"),
      notificationSettings: readObject("app_notification_settings"),
      companySettings: readObject("app_company_settings"),
      systemSettings: readObject("app_system_settings"),
    }
    const sessionPersonId = currentAccess.user ? getId(currentAccess.user) : ""
    const shouldUseSessionPerson = Boolean(sessionPersonId && (isStandaloneApp || isMobileUserModeRequested() || (!currentAccess.panelAccess && currentAccess.mobileAccess)))
    const sessionPersonExists = shouldUseSessionPerson && nextData.personnel.some((person: any) => getId(person) === sessionPersonId)
    const savedPersonExists = nextData.personnel.some((person: any) => getId(person) === saved.personnelId)
    const savedBranchExists = nextData.branches.some((branch: any) => getId(branch) === saved.branchId)
    setData(nextData)
    setSettings((current: any) => ({
      ...current,
      ...saved,
      screen: normalizeScreen(saved.screen || current.screen),
      theme: themes.includes(saved.theme) ? saved.theme : current.theme,
      state: states.includes(saved.state) ? saved.state : current.state,
      personnelId: sessionPersonExists ? sessionPersonId : savedPersonExists ? saved.personnelId : getId(nextData.personnel[0]) || NONE,
      branchId: savedBranchExists ? saved.branchId : getId(nextData.branches[0]) || NONE,
    }))
  }, [isStandaloneApp])

  React.useEffect(() => {
    if (isStandaloneApp && db && !firestoreBootstrapped) return
    load()
  }, [db, firestoreBootstrapped, isStandaloneApp, load])

  useFirestoreLocalMirror(db, sharedSyncTargets, load)

  React.useEffect(() => {
    if (!db || typeof window === "undefined") return

    const syncAttendanceToFirestore = async () => {
      const shifts = readArray("app_shifts")
      const attendanceRecords = readArray(ATTENDANCE_RECORDS_KEY).map((record: any) => enrichAttendanceLateData(record, shifts))
      const liveRecords = readArray(LIVE_PRESENCE_KEY).map((record: any) => {
        const personId = attendancePersonId(record)
        const activeAttendance = attendanceRecords.find((item: any) => attendancePersonId(item) === personId && item?.status === "inside" && !item?.checkOutTime)
        return activeAttendance ? {
          ...record,
          isLate: activeAttendance.isLate,
          lateMinutes: activeAttendance.lateMinutes,
          lateToleranceMinutes: activeAttendance.lateToleranceMinutes,
          shiftId: activeAttendance.shiftId,
          shiftName: activeAttendance.shiftName,
        } : record
      })

      writeArray(ATTENDANCE_RECORDS_KEY, attendanceRecords)
      writeArray(LIVE_PRESENCE_KEY, liveRecords)

      await Promise.all(attendanceRecords.map((record: any) => writeSharedRecord(db, "attendance", record)))
      await Promise.all(liveRecords.map((record: any) => writeSharedRecord(db, "livePresence", record)))

      try {
        const liveSnapshot = await getDocs(collection(db, "livePresence"))
        const localIds = new Set(liveRecords.map((record: any) => getId(record) || (record?.personnelId || "").toString()).filter(Boolean))
        await Promise.all(liveSnapshot.docs.map((item) => {
          const data = item.data()
          const remoteKey = item.id || getId(data) || (data?.personnelId || "").toString()
          return localIds.has(remoteKey) ? Promise.resolve() : deleteSharedRecord(db, "livePresence", item.id)
        }))
      } catch (error) {
        console.warn("[Firestore attendance sync] livePresence cleanup failed", error)
      }

      console.info("[Firestore attendance sync] mobile attendance mirrored", {
        attendanceCount: attendanceRecords.length,
        livePresenceCount: liveRecords.length,
      })
    }

    const onAttendanceSync = () => {
      void syncAttendanceToFirestore()
    }

    window.addEventListener("app-mobile-attendance-updated", onAttendanceSync)

    return () => {
      window.removeEventListener("app-mobile-attendance-updated", onAttendanceSync)
    }
  }, [db])

  React.useEffect(() => {
    if (!isStandaloneApp || typeof window === "undefined") return
    if (!db) {
      setFirestoreBootstrapped(true)
      return
    }

    let cancelled = false

    const bootstrapFromFirestore = async () => {
      for (const target of sharedSyncTargets) {
        try {
          const snapshot = await getDocs(collection(db, target.collectionName))
          const docs = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))
          window.localStorage.setItem(target.storageKey, JSON.stringify(docs))
          window.dispatchEvent(new Event(`${target.storageKey}-updated`))
          console.info("[mobile-app firestore bootstrap]", {
            collectionPath: target.collectionName,
            storageKey: target.storageKey,
            count: docs.length,
          })
        } catch (error) {
          console.warn("[mobile-app firestore bootstrap] collection read failed; localStorage fallback kept", {
            collectionPath: target.collectionName,
            storageKey: target.storageKey,
            errorMessage: error instanceof Error ? error.message : String(error),
            code: (error as any)?.code,
          })
        }
      }

      if (!cancelled) {
        setFirestoreBootstrapped(true)
        load()
      }
    }

    void bootstrapFromFirestore()

    return () => {
      cancelled = true
    }
  }, [db, isStandaloneApp, load, sharedSyncTargets])

  React.useEffect(() => {
    const refreshAccess = () => {
      setAccessState(readCurrentAccess())
      setUserModeParam(isMobileUserModeRequested())
    }
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || MOBILE_ACCESS_STORAGE_KEYS.includes(event.key as any)) refreshAccess()
    }

    refreshAccess()
    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", refreshAccess)
    window.addEventListener("app-access-updated", refreshAccess)
    window.addEventListener("app-auth-updated", refreshAccess)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", refreshAccess)
      window.removeEventListener("app-access-updated", refreshAccess)
      window.removeEventListener("app-auth-updated", refreshAccess)
    }
  }, [])

  const hasMobileAccess = accessState.mobileAccess
  const isUserMode = userModeParam || (!accessState.panelAccess && accessState.mobileAccess)

  const selectedPerson = data.personnel.find((person: any) => getId(person) === settings.personnelId)
  const selectedBranch =
    data.branches.find((branch: any) => getId(branch) === settings.branchId) ||
    data.branches.find((branch: any) => getId(branch) === selectedPerson?.branchId)
  const selectedDepartment = data.departments.find((department: any) => getId(department) === selectedPerson?.departmentId)
  const selectedPosition = data.positions.find((position: any) => getId(position) === selectedPerson?.positionId || positionName(position) === selectedPerson?.position)
  const selectedRole = findRoleForPerson(selectedPerson, data.roles)
  const selectedPersonWithPermissions = selectedPerson ? {
    ...selectedPerson,
    rolePermissions: selectedRole?.permissions || selectedPerson?.rolePermissions || {},
    permissions: {
      ...(selectedRole?.permissions || {}),
      ...(selectedPerson?.permissions || {}),
    },
  } : selectedPerson
  const canCreateLeaveRequests = canCreateMobileLeaveRequest(selectedPersonWithPermissions, selectedRole)
  const personId = selectedPerson ? getId(selectedPerson) : ""
  const branchId = selectedBranch ? getId(selectedBranch) : ""
  const personShifts = data.shifts.filter((shift: any) => matchesPerson(shift, personId) || matchesBranch(shift, branchId))
  const personLeaves = data.leaves.filter((leave: any) => matchesPerson(leave, personId))
  const personBreaks = data.breaks.filter((item: any) => matchesPerson(item, personId))
  const personDevice = data.devices.find((device: any) => matchesPerson(device, personId))
  const personKvkk = data.kvkk.find((item: any) => matchesPerson(item, personId))
  const branchQrPoints = data.qrPoints.filter((point: any) => matchesBranch(point, branchId))
  const livePresence = readArray(LIVE_PRESENCE_KEY)
  const attendanceRecords = readArray(ATTENDANCE_RECORDS_KEY)
  const liveRecord = livePresence.find((item: any) => isActiveLivePresence(item, personId))
  const activeBreak = readArray("app_break_records").find((item: any) => {
    const status = String(item?.status || "").toLowerCase()
    return matchesPerson(item, personId) && (status === "active" || status === "on_break") && !item?.endTime && !item?.breakEnd
  })
  const openAttendance = latestOpenAttendance(attendanceRecords, personId)
  const isPersonInside = Boolean(liveRecord)
  const latestAttendance = attendanceRecords
    .filter((item: any) => matchesPerson(item, personId))
    .sort((a: any, b: any) => attendanceTime(b) - attendanceTime(a))[0]
  const shiftEntryWarning = isPersonInside ? getShiftEntryWarning(data.shifts, personId, branchId) : null
  const currentStatus = String(settings.currentStatus || "").toLowerCase()
  const latestAttendanceIsExit = Boolean(latestAttendance && (
    latestAttendance?.checkOutTime ||
    latestAttendance?.exitTime ||
    String(latestAttendance?.status || "").toLowerCase().includes("outside") ||
    String(latestAttendance?.status || "").includes("Çıkış")
  ))
  const latestAttendanceIsEntry = Boolean(latestAttendance && !latestAttendanceIsExit && String(latestAttendance?.status || "").toLowerCase() === "inside")
  const homeStatusSource = liveRecord
    ? "livePresence"
    : currentStatus
      ? "currentStatus"
      : latestAttendance
        ? "attendance"
        : "settings.state"
  const presenceState = activeBreak || String(liveRecord?.status || "").toLowerCase() === "on_break" || currentStatus === "active" || currentStatus === "on_break"
    ? "Molada"
    : liveRecord
      ? shiftEntryWarning
        ? "İçeride (Vardiya Dışı)"
        : "İçeride"
      : currentStatus === "inside"
        ? "İçeride"
      : currentStatus === "outside"
        ? "Dışarıda"
      : latestAttendanceIsEntry
        ? "İçeride"
      : latestAttendanceIsExit
        ? "Dışarıda"
        : settings.state
  console.log("[mobile-home-status]", {
    livePresenceFound: Boolean(liveRecord),
    updatedCurrentStatus: settings.currentStatus || null,
    homeStatusSource,
    personnelId: personId,
  })

  const handleEnableNotifications = React.useCallback(async () => {
    if (!selectedPerson || !personId) {
      toast({ variant: "destructive", title: "Bildirimler açılamadı", description: "Personel oturumu bulunamadı." })
      return
    }

    try {
      const result = await syncOneSignalSubscription(personId, { requestPermission: true })
      if (!result.permission) {
        const deniedPatch = {
          oneSignalPermission: "denied",
          oneSignalSdkReady: Boolean(result.sdkReady),
          oneSignalSubscribed: false,
          oneSignalSubscriptionError: "Tarayici bildirim izni reddedildi.",
          lastNotificationSync: new Date().toISOString(),
        }
        const deniedPerson = { ...selectedPerson, ...deniedPatch }
        upsertLocalArrayRecord("app_personnel", deniedPerson)
        setData((current: any) => ({
          ...current,
          personnel: current.personnel.map((person: any) => getId(person) === personId ? deniedPerson : person),
        }))
        await writeSharedRecord(db, "personnel", deniedPerson)
        toast({
          variant: "destructive",
          title: "Bildirim izni verilmedi",
          description: "Tarayıcı bildirim izni kapalı. Bildirim almak için izin vermeniz gerekir.",
        })
        return
      }

      const patch = {
        oneSignalId: result.oneSignalId,
        oneSignalSubscriptionId: result.oneSignalSubscriptionId,
        oneSignalSubscriptionToken: result.oneSignalSubscriptionToken,
        oneSignalSubscribed: Boolean(result.subscribed),
        oneSignalPermission: result.permission ? "granted" : "denied",
        oneSignalSdkReady: Boolean(result.sdkReady),
        oneSignalSubscriptionError: result.subscribed ? "" : "Bildirim aboneliği oluşmadı.",
        lastNotificationSync: new Date().toISOString(),
      }
      const updatedPerson = { ...selectedPerson, ...patch }
      upsertLocalArrayRecord("app_personnel", updatedPerson)
      setData((current: any) => ({
        ...current,
        personnel: current.personnel.map((person: any) => getId(person) === personId ? updatedPerson : person),
      }))
      const firestoreOk = await writeSharedRecord(db, "personnel", updatedPerson)
      console.info(`[OneSignal mobile] Sync ${firestoreOk ? "success" : "failed"}`, {
        personnelId: personId,
        oneSignalId: result.oneSignalId,
        oneSignalSubscriptionId: result.oneSignalSubscriptionId,
        oneSignalSubscriptionToken: result.oneSignalSubscriptionToken ? "var" : "yok",
        subscribed: result.subscribed,
        firestoreOk,
      })
      toast({
        title: result.subscribed ? "Bildirimler aktif" : "Abonelik tamamlanamadı",
        description: result.subscribed ? "Mobil bildirim izniniz kaydedildi." : "Bildirim aboneliği oluşmadı.",
      })
    } catch (error) {
      console.warn("[OneSignal mobile] manual permission sync failed", error)
      const errorMessage = error instanceof Error ? error.message : "OneSignal baglantisi kurulamadi."
      const errorPatch = {
        oneSignalSdkReady: false,
        oneSignalSubscribed: false,
        oneSignalSubscriptionError: errorMessage,
        lastNotificationSync: new Date().toISOString(),
      }
      const errorPerson = { ...selectedPerson, ...errorPatch }
      upsertLocalArrayRecord("app_personnel", errorPerson)
      setData((current: any) => ({
        ...current,
        personnel: current.personnel.map((person: any) => getId(person) === personId ? errorPerson : person),
      }))
      await writeSharedRecord(db, "personnel", errorPerson)
      toast({
        variant: "destructive",
        title: "Bildirimler açılamadı",
        description: error instanceof Error ? error.message : "OneSignal bağlantısı kurulamadı.",
      })
    }
  }, [db, personId, selectedPerson, toast])

  const updateSettings = (patch: any) => {
    if (patch?.screen === "QR" && patch?.qrStatus === "Başarılı" && selectedPerson && !patch?.attendanceHandled) {
      const activePoint = branchQrPoints.find((point: any) => isActive(point?.status))
      if (activePoint) {
        const now = new Date()
        const nowIso = now.toISOString()
        const today = nowIso.slice(0, 10)
        const samePersonnel = (item: any) => String(item?.personnelId ?? item?.personelId ?? item?.personId ?? "") === String(personId)
        const recordDate = (item: any) => String(item?.date || item?.tarih || item?.checkInTime || item?.entryTime || "").slice(0, 10)
        const hasNoCheckout = (item: any) => item?.checkOutTime === undefined || item?.checkOutTime === null || item?.checkOutTime === ""
        const isInside = (item: any) => String(item?.status || "").toLowerCase() === "inside"
        const isOpenRecord = (item: any) =>
          samePersonnel(item) &&
          recordDate(item) === today &&
          isInside(item) &&
          !item?.exitTime &&
          !item?.["çıkışSaati"] &&
          !item?.["cikisSaati"]
        const isActiveAttendanceRecord = (item: any) =>
          samePersonnel(item) &&
          recordDate(item) === today &&
          isInside(item) &&
          hasNoCheckout(item)
        const attendanceRecords = readArray(ATTENDANCE_RECORDS_KEY)
        const livePresence = readArray(LIVE_PRESENCE_KEY)
        const liveRecord = livePresence.find((item: any) => isActiveLivePresence(item, personId))
        const currentMinute = nowIso.slice(0, 16)
        const sameMinuteQr = [...attendanceRecords, ...readArray(ATTENDANCE_KEY)].some((item: any) => {
          const actionMinute = String(item?.checkInTime || item?.checkOutTime || item?.entryTime || item?.exitTime || item?.createdAt || item?.updatedAt || "").slice(0, 16)
          const method = String(item?.method || item?.verificationMethod || item?.dogrulamaYontemi || item?.["doğrulamaYöntemi"] || "").toLowerCase()
          return samePersonnel(item) && actionMinute === currentMinute && method.includes("qr")
        })
        if (liveRecord || sameMinuteQr) return
        const hasOpenAttendance = false
        const lateInfo = calculateLateInfo(data.shifts, personId, branchId, now)
        const gpsCheck = verifyGpsDistance(selectedBranch, selectedPerson, settings)
        if (!gpsCheck.ok) {
          updateSettings({ screen: "QR", qrStatus: "Başarısız", gpsStatus: gpsCheck.status, state: "GPS dışında" })
          toast({ variant: "destructive", title: "Şube konumu dışında", description: `GPS başarısız. Maksimum mesafe ${MAX_GPS_DISTANCE_METERS} m.` })
          return
        }

        if (hasOpenAttendance) {
          const closePatch = {
            checkOutTime: nowIso,
            exitTime: nowIso,
            status: "outside",
            statusLabel: "Çıkış yaptı",
            durum: "Çıkış yaptı",
            updatedAt: nowIso,
          }
          writeArray(ATTENDANCE_RECORDS_KEY, attendanceRecords.map((item: any) => isActiveAttendanceRecord(item) ? { ...item, ...closePatch } : item))
          writeArray(LIVE_PRESENCE_KEY, livePresence.filter((item: any) => !samePersonnel(item)))
          notifyAttendanceSync()
        } else {
          const record = {
          id: `qr-att-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          personnelId: personId,
          personnelName: personName(selectedPerson),
          branchId,
          branchName: selectedBranch ? branchName(selectedBranch) : "",
          checkInTime: nowIso,
          date: nowIso.slice(0, 10),
          method: "QR",
          qrPointId: getId(activePoint),
          qrPointName: activePoint?.pointName || activePoint?.name || "QR",
          status: "inside",
          ...(lateInfo || {}),
                    gpsStatus: gpsCheck.status,
          deviceStatus: personDevice ? "Tanımlı" : "Tanımsız",
          personelId: personId,
          personelAdi: personName(selectedPerson),
          branchLabel: selectedBranch ? branchName(selectedBranch) : "",
          tarih: nowIso.slice(0, 10),
          saat: now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          islemTipi: "Giriş",
          dogrulamaYontemi: "QR",
          entryTime: nowIso,
          verificationMethod: "QR",
          deviceId: personDevice?.deviceId || personDevice?.id || "",
          qrStatus: "Başarılı",
        }
        writeArray(ATTENDANCE_KEY, [record, ...readArray(ATTENDANCE_KEY)])
        writeArray(ATTENDANCE_RECORDS_KEY, [record, ...readArray(ATTENDANCE_RECORDS_KEY)])
        writeArray(LIVE_PRESENCE_KEY, [record, ...readArray(LIVE_PRESENCE_KEY).filter((item: any) => !matchesPerson(item, personId))])
          notifyAttendanceSync()
        }
      }
    }
    setSettings((current: any) => {
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      return next
    })
  }

  const addAudit = React.useCallback((action: string, detail: string, type = "Mobil") => {
    const log = {
      id: `mobile-audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      action,
      detail,
      category: type,
      channel: "Mobil",
      user: personName(selectedPerson),
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    }
    writeArray(AUDIT_KEY, [log, ...readArray(AUDIT_KEY)])
  }, [selectedPerson])

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }))
    toast({ title: "Mobil önizleme ayarları kaydedildi", description: "Seçimler app_mobile_preview_settings içinde saklandı." })
  }

  const exportJson = () => {
    saveFile("mobile-preview.json", JSON.stringify({ settings, selectedPerson, selectedBranch, personShifts, personLeaves, personDevice, personKvkk, branchQrPoints }, null, 2))
  }

  const handleAttendance = (type: "Giriş" | "Çıkış") => {
    if (!selectedPerson) return
    const now = new Date()
    const nowIso = now.toISOString()
    const time = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    const isEntry = isCheckInAction(type) && !isCheckOutAction(type)
    const qrStatus = settings.qrStatus === "Başarılı" || branchQrPoints.some((point: any) => isActive(point?.status)) ? "Başarılı" : "QR bekleniyor"
    const gpsStatus = settings.state === "GPS dışında" ? "GPS dışında" : hasBranchLocation(selectedBranch) ? "Doğrulandı" : "Şube konumu tanımlı değil"
    const method = qrStatus === "QR bekleniyor" ? (gpsStatus.includes("GPS") || gpsStatus.includes("konumu") ? "Mobil" : "GPS") : "QR"
    const livePresence = readArray(LIVE_PRESENCE_KEY)
    const attendanceRecords = readArray(ATTENDANCE_RECORDS_KEY)
    const liveRecord = livePresence.find((item: any) => isActiveLivePresence(item, personId))
    const openAttendance = latestOpenAttendance(attendanceRecords, personId)
    const isCurrentlyInside = Boolean(liveRecord)
    const lastAttendance = attendanceRecords
      .filter((item: any) => matchesPerson(item, personId))
      .sort((a: any, b: any) => attendanceTime(b) - attendanceTime(a))[0]
    const lastAttendanceAction = lastAttendance
      ? lastAttendance?.checkOutTime || lastAttendance?.exitTime || isCheckOutAction(lastAttendance?.status) || isCheckOutAction(lastAttendance?.["işlemTipi"] || lastAttendance?.islemTipi)
        ? "checkOut"
        : "checkIn"
      : "none"
    console.log("[mobile-qr-attendance]", {
      personnelId: personId,
      lastAttendanceAction,
      hasActivePresence: isCurrentlyInside,
      selectedAction: isEntry ? "checkIn" : "checkOut",
    })
    if (isEntry && isCurrentlyInside) {
      toast({ title: "Personel zaten içeride." })
      return
    }
    if (!isEntry && !isCurrentlyInside) {
      toast({ title: "Personel zaten dışarıda." })
      return
    }
    if (isEntry && method === "QR") {
      const currentMinute = nowIso.slice(0, 16)
      const sameMinuteQr = [...readArray(ATTENDANCE_RECORDS_KEY), ...readArray(ATTENDANCE_KEY)].some((item: any) => {
        const actionMinute = String(item?.checkInTime || item?.checkOutTime || item?.entryTime || item?.exitTime || item?.createdAt || item?.updatedAt || "").slice(0, 16)
        const recordMethod = String(item?.method || item?.verificationMethod || item?.dogrulamaYontemi || item?.["doğrulamaYöntemi"] || "").toLowerCase()
        return matchesPerson(item, personId) && actionMinute === currentMinute && recordMethod.includes("qr")
      })
      if (sameMinuteQr) {
        toast({ variant: "destructive", title: "Duplicate QR engellendi", description: "Aynı dakika içinde QR işlemi zaten yapıldı." })
        return
      }
    }
    const gpsCheck = verifyGpsDistance(selectedBranch, selectedPerson, settings)
    if (isEntry && method === "QR" && !gpsCheck.ok) {
      updateSettings({ screen: "QR", qrStatus: "Başarısız", gpsStatus: gpsCheck.status, state: "GPS dışında" })
      toast({ variant: "destructive", title: "Şube konumu dışında", description: `GPS başarısız. Maksimum mesafe ${MAX_GPS_DISTANCE_METERS} m.` })
      return
    }
    const effectiveGpsStatus = isEntry && method === "QR" ? gpsCheck.status : gpsStatus
    const lateInfo = isEntry ? calculateLateInfo(data.shifts, personId, branchId, now) : null
    const overtimeInfo = !isEntry ? calculateOvertimeInfo(data.shifts, personId, branchId, now) : { isOvertime: false, overtimeMinutes: 0 }
    if (!isEntry) {
      const closePatch = {
        ...overtimeInfo,
        status: "Çıkış yaptı",
        checkOutTime: nowIso,
        exitTime: nowIso,
        updatedAt: nowIso,
      }
      const exitRecord = openAttendance
        ? null
        : {
            ...(liveRecord || {}),
            id: `mobile-exit-${Date.now()}`,
            personnelId: personId,
            personnelName: personName(selectedPerson),
            branchId,
            branchName: selectedBranch ? branchName(selectedBranch) : "",
            date: nowIso.slice(0, 10),
            method,
            verificationMethod: method,
            ...closePatch,
          }
      writeArray(ATTENDANCE_RECORDS_KEY, openAttendance
        ? attendanceRecords.map((item: any) => isOpenAttendance(item, personId) ? { ...item, ...closePatch } : item)
        : [exitRecord, ...attendanceRecords])
      const previewRecords = readArray(ATTENDANCE_KEY)
      writeArray(ATTENDANCE_KEY, openAttendance
        ? previewRecords.map((item: any) => isOpenAttendance(item, personId) ? { ...item, ...closePatch } : item)
        : [exitRecord, ...previewRecords])
      writeArray(LIVE_PRESENCE_KEY, livePresence.filter((item: any) => !matchesPerson(item, personId)))
      console.log("[mobile-qr-attendance] livePresence updated", { action: "checkOut", personnelId: personId })
      notifyAttendanceSync()
      console.log("[mobile-qr-state]", { qrAction: "checkOut", updatedCurrentStatus: "outside", livePresenceFound: false, personnelId: personId })
      updateSettings({
        state: "Dışarıda",
        screen: "Giriş",
        gpsStatus: effectiveGpsStatus,
        qrStatus,
        isInside: false,
        currentStatus: "outside",
        activeAttendanceId: null,
        activePresenceId: null,
        lastQrVerifiedAt: method === "QR" ? nowIso : settings.lastQrVerifiedAt,
        lastGpsVerifiedAt: gpsCheck.ok ? nowIso : settings.lastGpsVerifiedAt,
      })
      addAudit("Mobil çıkış simülasyonu yapıldı", `${personName(selectedPerson)} için çıkış kaydı kapatıldı.`)
      return
    }
    const record = {
      id: `mobile-att-${Date.now()}`,
      personnelId: personId,
      personnelName: personName(selectedPerson),
      personnelEmail: selectedPerson?.email || "",
      branchId,
      branchName: selectedBranch ? branchName(selectedBranch) : "",
      checkInTime: isEntry ? nowIso : undefined,
      checkOutTime: isEntry ? undefined : nowIso,
      date: nowIso.slice(0, 10),
      method,
      status: isEntry ? "inside" : "outside",
      ...(lateInfo || {}),
      ...overtimeInfo,
      deviceStatus: personDevice ? "Tanımlı" : "Tanımsız",
      personelId: personId,
      "personelAdı": personName(selectedPerson),
      "şube": selectedBranch ? branchName(selectedBranch) : "",
      tarih: now.toISOString().slice(0, 10),
      saat: now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      "işlemTipi": type,
      "doğrulamaYöntemi": qrStatus === "Başarılı" ? "QR" : effectiveGpsStatus === "Doğrulandı" || effectiveGpsStatus === "GPS başarılı" ? "GPS" : "Mobil",
      entryTime: isEntry ? nowIso : undefined,
      exitTime: isEntry ? undefined : nowIso,
      verificationMethod: method,
      deviceId: personDevice?.deviceId || personDevice?.id || "",
      gpsStatus: effectiveGpsStatus,
      qrStatus,
    }
    writeArray(ATTENDANCE_KEY, [record, ...readArray(ATTENDANCE_KEY)])
    writeArray(ATTENDANCE_RECORDS_KEY, [record, ...readArray(ATTENDANCE_RECORDS_KEY)])
    if (record.status === "inside") {
      writeArray(LIVE_PRESENCE_KEY, [record, ...livePresence.filter((item: any) => !matchesPerson(item, personId))])
      console.log("[mobile-qr-attendance] livePresence updated", { action: "checkIn", personnelId: personId })
    } else {
      writeArray(LIVE_PRESENCE_KEY, livePresence.map((item: any) =>
        matchesPerson(item, personId) ? { ...item, ...overtimeInfo, status: "outside", checkOutTime: nowIso, exitTime: nowIso, updatedAt: nowIso } : item
      ))
    }
    notifyAttendanceSync()
    console.log("[mobile-qr-state]", { qrAction: "checkIn", updatedCurrentStatus: "inside", livePresenceFound: true, personnelId: personId })
    updateSettings({
      state: "İçeride",
      screen: "Giriş",
      gpsStatus: effectiveGpsStatus,
      qrStatus,
      isInside: true,
      currentStatus: "inside",
      lastQrVerifiedAt: method === "QR" ? nowIso : settings.lastQrVerifiedAt,
      lastGpsVerifiedAt: gpsCheck.ok ? nowIso : settings.lastGpsVerifiedAt,
      activeAttendanceId: record.id,
      activePresenceId: record.id,
    })
    addAudit(`Mobil ${type.toLowerCase()} simülasyonu yapıldı`, `${personName(selectedPerson)} için ${type.toLowerCase()} kaydı oluşturuldu.`)
  }

  const handleQrSimulation = (scannedPoint?: any) => {
    const activeBranchPoint = branchQrPoints.find((point: any) => isActiveQrPoint(point) && qrPointMatchesBranch(point, selectedBranch))
    if (!activeBranchPoint) {
      vibrate([80, 40, 80])
      toast({ variant: "destructive", title: "QR doğrulanamadı", description: scannedPoint ? "Yanlış şube QR kodu." : "Bu şubeye ait aktif QR noktası yok." })
      return
    }
    const scannedCode = (scannedPoint?.qrCode || scannedPoint?.code || scannedPoint?.id || "").toString()
    const activeCode = (activeBranchPoint?.qrCode || activeBranchPoint?.code || activeBranchPoint?.id || "").toString()
    if (scannedPoint && scannedCode && activeCode && !qrValueMatchesPoint(scannedCode, activeBranchPoint)) {
      vibrate([80, 40, 80])
      toast({ variant: "destructive", title: "QR doğrulanamadı", description: "Yanlış şube QR kodu." })
      return
    }
    const liveRecords = readArray(LIVE_PRESENCE_KEY)
    const activePresence = liveRecords.find((item: any) => isActiveLivePresence(item, personId))
    const inside = Boolean(activePresence)
    const qrAttendanceRecords = readArray(ATTENDANCE_RECORDS_KEY)
    const openAttendance = latestOpenAttendance(qrAttendanceRecords, personId)
    const lastAttendance = qrAttendanceRecords
      .filter((item: any) => matchesPerson(item, personId))
      .sort((a: any, b: any) => attendanceTime(b) - attendanceTime(a))[0]
    const lastAttendanceAction = lastAttendance
      ? lastAttendance?.checkOutTime || lastAttendance?.exitTime || isCheckOutAction(lastAttendance?.status) || isCheckOutAction(lastAttendance?.["işlemTipi"] || lastAttendance?.islemTipi)
        ? "checkOut"
        : "checkIn"
      : "none"
    const selectedAction = inside ? "checkOut" : "checkIn"
    console.log("[mobile-qr-toggle]", {
      personnelId: personId,
      lastAttendanceAction,
      hasActivePresence: inside,
      selectedAction,
    })
    const showEntrySuccess = () => {
      vibrate(90)
      toast({
        title: "Giriş oluşturuldu",
        description: `${personName(selectedPerson)} • ${selectedBranch ? branchName(selectedBranch) : "Şube"} • Giriş saati: ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`,
        duration: 3000,
      })
    }
    const showExitSuccess = () => {
      vibrate([70, 35, 70])
      toast({
        title: "Çıkış oluşturuldu",
        description: `${personName(selectedPerson)} • ${selectedBranch ? branchName(selectedBranch) : "Şube"} • Çalışma süresi: ${formatWorkDuration(openAttendance)}`,
        duration: 3000,
      })
    }
    const showShiftEntryWarning = () => {
      const warning = getShiftEntryWarning(data.shifts, personId, branchId)
      if (!warning) return
      toast({
        variant: "destructive",
        title: "Vardiya Uyarısı",
        description: warning,
        duration: 3500,
      })
    }
    if (isQrEntryOnly(activeBranchPoint)) {
      if (inside) {
        vibrate([80, 40, 80])
        toast({ variant: "destructive", title: "QR işlemi durduruldu", description: "Personel zaten içeride." })
        return
      }
      showEntrySuccess()
      handleAttendance("Giriş")
      showShiftEntryWarning()
      return
    }
    if (isQrExitOnly(activeBranchPoint)) {
      if (!inside) {
        vibrate([80, 40, 80])
        toast({ variant: "destructive", title: "QR işlemi durduruldu", description: "Personel zaten dışarıda." })
        return
      }
      showExitSuccess()
      handleAttendance("Çıkış")
      return
    }
    if (inside) {
      showExitSuccess()
      handleAttendance("Çıkış")
      return
    }
    showEntrySuccess()
    handleAttendance("Giriş")
    showShiftEntryWarning()
    return
    const activePoint = branchQrPoints.find((point: any) => isActive(point?.status))
    const success = Boolean(activePoint && selectedPerson)
    if (success) {
      const livePresence = readArray(LIVE_PRESENCE_KEY)
      const liveRecord = livePresence.find((item: any) => matchesPerson(item, personId))
      const currentMinute = new Date().toISOString().slice(0, 16)
      const sameMinuteQr = [...readArray(ATTENDANCE_RECORDS_KEY), ...readArray(ATTENDANCE_KEY)].some((item: any) => {
        const actionMinute = String(item?.checkInTime || item?.checkOutTime || item?.entryTime || item?.exitTime || item?.createdAt || item?.updatedAt || "").slice(0, 16)
        const method = String(item?.method || item?.verificationMethod || item?.dogrulamaYontemi || item?.["doğrulamaYöntemi"] || "").toLowerCase()
        return matchesPerson(item, personId) && actionMinute === currentMinute && method.includes("qr")
      })
      if (liveRecord?.status === "inside") {
        toast({ title: "Personel zaten içeride." })
        return
      }
      if (sameMinuteQr) {
        toast({ variant: "destructive", title: "Duplicate QR engellendi", description: "Aynı dakika içinde QR işlemi zaten yapıldı." })
        return
      }
      const now = new Date()
      const nowIso = now.toISOString()
      const lateInfo = calculateLateInfo(data.shifts, personId, branchId, now)
      const gpsCheck = verifyGpsDistance(selectedBranch, selectedPerson, settings)
      if (!gpsCheck.ok) {
        updateSettings({ screen: "QR", qrStatus: "Başarısız", gpsStatus: gpsCheck.status, state: "GPS dışında", attendanceHandled: true })
        addAudit("QR doğrulama simülasyonu yapıldı", "Şube konumu dışında olduğu için QR girişi engellendi.", "QR")
        toast({ variant: "destructive", title: "Şube konumu dışında", description: `GPS başarısız. Maksimum mesafe ${MAX_GPS_DISTANCE_METERS} m.` })
        return
      }
      const record = {
        id: `qr-att-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        personnelId: personId,
        personnelName: personName(selectedPerson),
        branchId,
        branchName: selectedBranch ? branchName(selectedBranch) : "",
        checkInTime: nowIso,
        date: nowIso.slice(0, 10),
        method: "QR",
        qrPointId: getId(activePoint),
        qrPointName: activePoint?.pointName || activePoint?.name || "QR",
        status: "inside",
        ...(lateInfo || {}),
        gpsStatus: gpsCheck.status,
        deviceStatus: personDevice ? "Tanımlı" : "Tanımsız",
        personelId: personId,
        personelAdi: personName(selectedPerson),
        branchLabel: selectedBranch ? branchName(selectedBranch) : "",
        tarih: nowIso.slice(0, 10),
        saat: now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        islemTipi: "Giriş",
        dogrulamaYontemi: "QR",
        entryTime: nowIso,
        verificationMethod: "QR",
        deviceId: personDevice?.deviceId || personDevice?.id || "",
        qrStatus: "Başarılı",
      }
      writeArray(ATTENDANCE_KEY, [record, ...readArray(ATTENDANCE_KEY)])
      writeArray(ATTENDANCE_RECORDS_KEY, [record, ...readArray(ATTENDANCE_RECORDS_KEY)])
      writeArray(LIVE_PRESENCE_KEY, [record, ...livePresence.filter((item: any) => !matchesPerson(item, personId))])
      notifyAttendanceSync()
    }
    updateSettings({ screen: "QR", qrStatus: success ? "Başarılı" : "Başarısız", state: success ? "Mesai başladı" : "QR bekleniyor", gpsStatus: success ? "GPS başarılı" : settings.gpsStatus, attendanceHandled: success })
    addAudit("QR doğrulama simülasyonu yapıldı", success ? `${branchName(selectedBranch)} QR noktası doğrulandı.` : "Seçili şubede aktif QR noktası bulunamadı.", "QR")
    toast({ variant: success ? "default" : "destructive", title: success ? "QR doğrulandı" : "QR doğrulanamadı", description: success ? activePoint?.pointName || activePoint?.name : "Bu şubeye ait aktif QR noktası bulunamadı." })
  }

  const handleGpsSimulation = () => {
    const gpsCheck = verifyGpsDistance(selectedBranch, selectedPerson, settings)
    const success = gpsCheck.ok && hasBranchLocation(selectedBranch)
    const gpsStatus = success ? "GPS başarılı" : gpsCheck.status
    updateSettings({ screen: "GPS", gpsStatus, state: success ? "Mesai başladı" : "GPS dışında" })
    addAudit("GPS doğrulama simülasyonu yapıldı", `${branchName(selectedBranch)} için sonuç: ${gpsStatus}.`, "GPS")
    toast({ variant: success ? "default" : "destructive", title: success ? "GPS başarılı" : "GPS başarısız", description: success ? "Personel şube konumu içinde." : "Şube konumu dışında" })
  }

  const handleBreak = async () => {
    if (!selectedPerson) return
    const livePresence = readArray(LIVE_PRESENCE_KEY)
    const liveRecord = livePresence.find((item: any) => isActiveLivePresence(item, personId))
    const breakRecords = readArray("app_break_records")
    const active = breakRecords.find((item: any) => {
      const status = String(item?.status || "").toLowerCase()
      return matchesPerson(item, personId) && (status === "active" || status === "on_break") && !item?.endTime && !item?.breakEnd
    })
    if (active) {
      const ended = new Date()
      const breakStart = active.breakStart || active.startTime || active.startedAt || active.createdAt || ended.toISOString()
      const startedAt = new Date(breakStart).getTime()
      const durationMinutes = Math.max(1, Math.round((ended.getTime() - (Number.isNaN(startedAt) ? ended.getTime() : startedAt)) / 60000))
      const updatedBreak = { ...active, breakEnd: ended.toISOString(), endTime: ended.toISOString(), durationMinutes, status: "completed", updatedAt: ended.toISOString() }
      writeArray("app_break_records", breakRecords.map((item: any) => item.id === active.id ? updatedBreak : item))
      writeArray(LIVE_PRESENCE_KEY, livePresence.map((item: any) => matchesPerson(item, personId) ? { ...item, status: "inside", currentStatus: "inside", updatedAt: ended.toISOString() } : item))
      await writeSharedRecord(db, "breaks", updatedBreak)
      notifyAttendanceSync()
      window.dispatchEvent(new Event("app-break-records-updated"))
      updateSettings({ state: "İçeride", currentStatus: "inside", isInside: true, screen: "Mola" })
      addAudit("Mobil mola bitirildi", `${personName(selectedPerson)} mola kaydını bitirdi.`, "Mobil")
      toast({ title: "Molayı Bitir", description: `${durationMinutes} dk mola tamamlandı.` })
      load()
      return
    }
    const isInsideForBreak = Boolean(liveRecord) && String(liveRecord?.status || "").toLowerCase() !== "on_break"
    if (!isInsideForBreak) {
      toast({ variant: "destructive", title: "Mola başlatılamadı", description: "Mola başlatmak için önce giriş yapmalısınız." })
      return
    }
    const now = new Date()
    const nowIso = now.toISOString()
    const record = {
      id: `mobile-break-${Date.now()}`,
      personId,
      personnelId: personId,
      personelId: personId,
      personnelName: personName(selectedPerson),
      personName: personName(selectedPerson),
      branchId,
      branchName: selectedBranch ? branchName(selectedBranch) : "",
      startTime: nowIso,
      endTime: null,
      breakStart: nowIso,
      breakType: "Standart Mola",
      status: "active",
      startedAt: nowIso,
      createdAt: nowIso,
      date: nowIso.slice(0, 10),
      source: isStandaloneApp ? "mobile-app" : "mobile-preview",
    }
    writeArray("app_break_records", [record, ...breakRecords])
    writeArray(LIVE_PRESENCE_KEY, livePresence.map((item: any) => matchesPerson(item, personId) ? { ...item, status: "on_break", currentStatus: "on_break", breakStart: record.breakStart, updatedAt: record.breakStart } : item))
    await writeSharedRecord(db, "breaks", record)
    notifyAttendanceSync()
    window.dispatchEvent(new Event("app-break-records-updated"))
    updateSettings({ state: "Molada", currentStatus: "on_break", isInside: true, screen: "Mola" })
    addAudit("Mobil mola başlatıldı", `${personName(selectedPerson)} için mola kaydı oluşturuldu.`)
    toast({ title: "Mola Başlatıldı", description: "Aktif mola kaydı oluşturuldu." })
    load()
  }

  const createLeave = async (form: any) => {
    if (!selectedPerson) {
      toast({ variant: "destructive", title: "Izin kaydedilemedi", description: "Personel bulunamadi." })
      return false
    }
    if (!canCreateLeaveRequests) {
      toast({ variant: "destructive", title: "Yetki yok", description: "İzin talebi oluşturma yetkiniz yok." })
      return false
    }
    const targetPersonnelId = String(form.selectedPersonnelId || "").trim()
    const targetPerson = data.personnel.find((person: any) => getId(person) === targetPersonnelId)
    if (!targetPerson) {
      toast({ variant: "destructive", title: "Personel seçin", description: "İzin talebi için personel seçimi zorunludur." })
      return false
    }
    const targetPersonId = getId(targetPerson)
    const targetBranchId = String(targetPerson?.branchId || "")
    if (targetPersonId !== personId && targetBranchId !== String(selectedPerson?.branchId || branchId || "")) {
      toast({ variant: "destructive", title: "Yetki yok", description: "Sadece kendi şubenizdeki personel için talep oluşturabilirsiniz." })
      return false
    }
    const attachmentFile = form.attachmentFile as File | null | undefined
    const leaveRequestId = `mobile-leave-${Date.now()}`
    let attachment: Record<string, any> = {}
    let archiveRecord: Record<string, any> | null = null

    if (attachmentFile) {
      try {
        const uploadData = new FormData()
        uploadData.append("file", attachmentFile)
        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        })
        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(result?.error || "Cloudinary yuklemesi basarisiz oldu.")
        }

        attachment = {
          attachmentUrl: result.url,
          attachmentPublicId: result.publicId,
          attachmentName: result.originalFilename || attachmentFile.name,
          attachmentType: attachmentFile.type,
          attachmentResourceType: result.resourceType,
          attachmentFormat: result.format,
          attachmentSize: result.bytes || attachmentFile.size,
        }
        const archiveTitle = form.type?.trim()
          ? `${form.type.trim()} Belgesi`
          : result.originalFilename || attachmentFile.name
        archiveRecord = {
          id: `archive-${leaveRequestId}`,
          title: archiveTitle,
          fileName: result.originalFilename || attachmentFile.name,
          fileUrl: result.url,
          publicId: result.publicId,
          fileType: attachmentFile.type,
          resourceType: result.resourceType,
          format: result.format,
          size: result.bytes || attachmentFile.size,
          category: "İzin Belgesi",
          source: "leaveRequest",
          relatedLeaveRequestId: leaveRequestId,
          uploadedAt: new Date().toISOString(),
          uploadedBy: selectedPerson?.email || personName(selectedPerson),
        }
      } catch (error) {
        console.error("leave attachment upload failed", error)
        toast({
          variant: "destructive",
          title: "Dosya yuklenemedi",
          description: error instanceof Error ? error.message : "Cloudinary yuklemesi basarisiz oldu.",
        })
        return false
      }
    }

    const record = {
      id: leaveRequestId,
      personId: targetPersonId,
      personnelId: targetPersonId,
      personelId: targetPersonId,
      employeeId: targetPersonId,
      staffId: targetPersonId,
      userId: targetPersonId,
      personName: personName(targetPerson),
      personnelName: personName(targetPerson),
      employeeName: personName(targetPerson),
      staffName: personName(targetPerson),
      personelName: personName(targetPerson),
      fullName: personName(targetPerson),
      personnelEmail: targetPerson?.email || "",
      employeeEmail: targetPerson?.email || "",
      branchId: targetPerson?.branchId || "",
      branchName: targetPerson?.branchName || (selectedBranch && String(targetPerson?.branchId || "") === branchId ? branchName(selectedBranch) : ""),
      requestedById: personId,
      requestedByName: personName(selectedPerson),
      requestedByEmail: selectedPerson?.email || "",
      requestedByRole: "manager",
      "personelAdı": personName(selectedPerson),
      ["personelAdı"]: personName(targetPerson),
      type: form.type,
      leaveType: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      status: "Bekliyor",
      source: isStandaloneApp ? "mobile-app" : "mobile-preview",
      createdAt: new Date().toISOString(),
      ...attachment,
    }
    const previousLeaves = readArray("app_leave_requests")
    writeArray("app_leave_requests", [record, ...previousLeaves])
    const firestoreOk = await writeSharedRecord(db, "leaveRequests", record)
    if (!firestoreOk) {
      writeArray("app_leave_requests", [record, ...previousLeaves])
    }
    if (archiveRecord) {
      const latestPersonnel = readArray("app_personnel").find((person: any) => matchesPerson(person, targetPersonId)) || targetPerson
      const existingArchive = Array.isArray(latestPersonnel.digitalArchive) ? latestPersonnel.digitalArchive : []
      const updatedPerson = {
        ...latestPersonnel,
        digitalArchive: [archiveRecord, ...existingArchive.filter((item: any) => item?.id !== archiveRecord?.id)],
        updatedAt: Date.now(),
      }
      upsertLocalArrayRecord("app_personnel", updatedPerson)
      await writeSharedRecord(db, "personnel", updatedPerson)
    }
    addAudit("Mobil izin talebi oluşturuldu", `${personName(selectedPerson)} için ${form.type} talebi oluşturuldu.`, "İzin")
    updateSettings({ screen: "İzin" })
    load()
    toast({
      title: firestoreOk ? "Izin talebi kaydedildi" : "Izin talebi yerel kaydedildi",
      description: firestoreOk ? `${form.startDate} - ${form.endDate} Firestore'a yazildi.` : `${form.startDate} - ${form.endDate} localStorage fallback ile kaydedildi.`,
      variant: firestoreOk ? undefined : "destructive",
    })
    return true
  }

  const handleMobileLogin = React.useCallback(async (email: string, password: string) => {
    const firebaseResult = await loginWithFirebasePersonnel(auth, db, email, password)
    if (firebaseResult.ok) {
      setAccessState(readCurrentAccess())
      load()
      toast({ title: "Giris basarili", description: "Firebase Auth ile mobil uygulama acildi." })
      return ""
    }
    const result = loginWithLocalPersonnel(email, password)
    if (!result.ok) return result.error || "Giriş yapılamadı."
    setAccessState(readCurrentAccess())
    load()
    toast({ title: "Giriş başarılı", description: "Mobil uygulama açıldı." })
    return ""
  }, [auth, db, load, toast])

  const phoneContent = data.personnel.length === 0 ? (
    <div className="grid min-h-[520px] w-full place-items-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 text-center">
      <div>
        <UserRound className="mx-auto mb-4 h-14 w-14 text-primary/35" />
        <h3 className="text-xl font-extrabold text-primary">HenÃ¼z personel bulunamadÄ±.</h3>
        <p className="mt-2 text-sm font-medium text-muted-foreground">Personel oluÅŸturulduÄŸunda mobil Ã¶nizleme localStorage Ã¼zerinden gÃ¼ncellenecek.</p>
      </div>
    </div>
  ) : (
    <PhoneMockup
      settings={settings}
      person={selectedPersonWithPermissions}
      branch={selectedBranch}
      department={selectedDepartment}
      position={selectedPosition}
      shifts={personShifts}
      leaves={personLeaves}
      breaks={personBreaks}
      device={personDevice}
      kvkk={personKvkk}
      qrPoints={branchQrPoints}
      isPersonInside={isPersonInside}
      presenceState={presenceState}
      notificationSettings={data.notificationSettings}
      company={data.companySettings}
      personnel={data.personnel}
      isStandaloneApp={isStandaloneApp}
      canCreateLeaveRequests={canCreateLeaveRequests}
      setScreen={(screen: string) => updateSettings({ screen })}
      onAttendance={handleAttendance}
      onQr={handleQrSimulation}
      onGps={handleGpsSimulation}
      onBreak={handleBreak}
      onLeaveCreate={createLeave}
      onEnableNotifications={handleEnableNotifications}
    />
  )

  if (isStandaloneApp && !accessState.session) {
    return <MobileLoginScreen onLogin={handleMobileLogin} />
  }

  if (!hasMobileAccess) {
    return <MobileAccessDenied />
  }

  if (isStandaloneApp) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 animate-fade-in">
        {data.personnel.length === 0 ? (
          <div className="grid min-h-dvh w-full place-items-center bg-slate-50 p-6 text-center">
            <div>
              <UserRound className="mx-auto mb-4 h-14 w-14 text-primary/35" />
              <h3 className="text-xl font-extrabold text-primary">HenÃ¼z personel bulunamadÄ±.</h3>
              <p className="mt-2 text-sm font-medium text-muted-foreground">Mobil ekran iÃ§in personel kaydÄ± bekleniyor.</p>
            </div>
          </div>
        ) : (
          <MobileAppShell
            settings={settings}
            person={selectedPersonWithPermissions}
            branch={selectedBranch}
            department={selectedDepartment}
            position={selectedPosition}
            shifts={personShifts}
            leaves={personLeaves}
            breaks={personBreaks}
            device={personDevice}
            kvkk={personKvkk}
            qrPoints={branchQrPoints}
            isPersonInside={isPersonInside}
            presenceState={presenceState}
            notificationSettings={data.notificationSettings}
            company={data.companySettings}
            personnel={data.personnel}
            isStandaloneApp={isStandaloneApp}
            canCreateLeaveRequests={canCreateLeaveRequests}
            setScreen={(screen: string) => updateSettings({ screen })}
            onAttendance={handleAttendance}
            onQr={handleQrSimulation}
            onGps={handleGpsSimulation}
            onBreak={handleBreak}
            onLeaveCreate={createLeave}
            onEnableNotifications={handleEnableNotifications}
          />
        )}
      </div>
    )
  }

  if (isUserMode) {
    return (
      <div className="grid min-h-[calc(100vh-8rem)] place-items-center p-3 animate-fade-in sm:p-6">
        {phoneContent}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.28),transparent_28rem),linear-gradient(135deg,#06101f_0%,#111a3b_50%,#312e81_100%)] p-8 text-white shadow-2xl shadow-slate-300/40">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 rounded-full border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
              <Smartphone className="mr-2 h-3.5 w-3.5" /> Mobile Companion Preview
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight">Mobil Uygulama Önizleme</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
              Admin panel localStorage verileriyle çalışan, QR/GPS/vardiya/izin akışlarını simüle eden mobil PDKS önizlemesi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Önizlemeyi Yenile</Button>
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => window.print()}><Camera className="mr-2 h-4 w-4" />Mobil ekran görüntüsü al</Button>
            <Button className="h-11 rounded-2xl bg-white text-primary hover:bg-slate-100" onClick={saveSettings}><Save className="mr-2 h-4 w-4" />Mobil ayarları kaydet</Button>
            <Button variant="outline" className="h-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={exportJson}><Download className="mr-2 h-4 w-4" />JSON indir</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <ControlPanel data={data} settings={settings} setField={(key: string, value: string) => updateSettings({ [key]: value })} />
        <Card className="overflow-hidden rounded-[32px] border-white/70 bg-white/80 shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
          <CardContent className="grid min-h-[760px] place-items-center p-3 sm:p-6 md:p-10">
            {data.personnel.length === 0 ? (
              <div className="grid min-h-[520px] w-full place-items-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 text-center">
                <div>
                  <UserRound className="mx-auto mb-4 h-14 w-14 text-primary/35" />
                  <h3 className="text-xl font-extrabold text-primary">Henüz personel bulunamadı.</h3>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">Personel oluşturulduğunda mobil önizleme localStorage üzerinden güncellenecek.</p>
                </div>
              </div>
            ) : (
              <PhoneMockup
                settings={settings}
                person={selectedPersonWithPermissions}
                branch={selectedBranch}
                department={selectedDepartment}
                position={selectedPosition}
                shifts={personShifts}
                leaves={personLeaves}
                breaks={personBreaks}
                device={personDevice}
                kvkk={personKvkk}
                qrPoints={branchQrPoints}
                isPersonInside={isPersonInside}
                presenceState={presenceState}
                notificationSettings={data.notificationSettings}
                company={data.companySettings}
                personnel={data.personnel}
                isStandaloneApp={isStandaloneApp}
                canCreateLeaveRequests={canCreateLeaveRequests}
                setScreen={(screen: string) => updateSettings({ screen })}
                onAttendance={handleAttendance}
                onQr={handleQrSimulation}
                onGps={handleGpsSimulation}
                onBreak={handleBreak}
                onLeaveCreate={createLeave}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MobileAccessDenied() {
  return (
    <div className="flex min-h-[calc(100vh-180px)] items-center justify-center">
      <Card className="premium-card w-full max-w-xl overflow-hidden border-none">
        <CardContent className="p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
            <Smartphone className="h-8 w-8" />
          </div>
          <Badge className="mb-4 rounded-full bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-50">
            Mobil Yetki
          </Badge>
          <h2 className="text-2xl font-extrabold tracking-tight text-primary">Bu kullanıcının mobil erişim izni yok.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-muted-foreground">
            Mobil önizleme, aktif kullanıcı için mobileAccess izni açıldığında tekrar kullanılabilir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function MobileLoginScreen({ onLogin }: { onLogin: (email: string, password: string) => string | Promise<string> }) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = await onLogin(email, password)
    setError(message)
  }

  return (
    <div className="fixed inset-0 z-50 grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-950 p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.24),transparent_26rem),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.2),transparent_24rem)]" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm rounded-[32px] border border-white/10 bg-white/10 p-6 text-white shadow-2xl shadow-black/30 backdrop-blur-2xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-44 items-center justify-center rounded-3xl bg-white/15 px-5">
            <img src="/assets/evyapar-logo-beyaz.png" alt="Evyapar" className="h-auto w-full object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Evyapar Mobil</h1>
          <p className="mt-2 text-sm font-semibold text-white/55">Personel hesabınızla giriş yapın.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase tracking-widest text-white/55">Email</Label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/35" placeholder="personel@evyapar.com" required />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase tracking-widest text-white/55">Şifre</Label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/35" placeholder="Şifreniz" required />
          </div>
          {error && <div className="rounded-2xl border border-rose-300/20 bg-rose-500/15 px-4 py-3 text-sm font-bold text-rose-100">{error}</div>}
          <Button type="submit" className="h-12 w-full rounded-2xl bg-white font-black text-slate-950 hover:bg-white/90">Giriş Yap</Button>
        </div>
      </form>
    </div>
  )
}

function ControlPanel({ data, settings, setField }: any) {
  return (
    <Card className="xl:sticky xl:top-28 h-fit overflow-hidden rounded-[28px] border-white/70 bg-white/85 shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
      <CardHeader className="border-b bg-slate-50/50">
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500"><Smartphone className="h-4 w-4 text-accent" />Önizleme Kontrol Paneli</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <SelectField label="Personel seçimi" value={settings.personnelId} onChange={(value: string) => setField("personnelId", value)}>
          {data.personnel.length ? data.personnel.map((person: any) => <SelectItem key={getId(person)} value={getId(person)}>{personName(person)}</SelectItem>) : <SelectItem value={NONE}>Personel yok</SelectItem>}
        </SelectField>
        <SelectField label="Şube seçimi" value={settings.branchId} onChange={(value: string) => setField("branchId", value)}>
          {data.branches.length ? data.branches.map((branch: any) => <SelectItem key={getId(branch)} value={getId(branch)}>{branchName(branch)}</SelectItem>) : <SelectItem value={NONE}>Şube yok</SelectItem>}
        </SelectField>
        <SelectField label="Tema seçimi" value={settings.theme} onChange={(value: string) => setField("theme", value)}>
          {themes.map((theme) => <SelectItem key={theme} value={theme}>{theme}</SelectItem>)}
        </SelectField>
        <SelectField label="Durum simülasyonu" value={settings.state} onChange={(value: string) => setField("state", value)}>
          {states.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
        </SelectField>
        <SelectField label="Ekran seçimi" value={settings.screen} onChange={(value: string) => setField("screen", value)}>
          {screens.map((screen) => <SelectItem key={screen} value={screen}>{screen}</SelectItem>)}
        </SelectField>
        <SelectField label="Cihaz tipi" value={settings.device} onChange={(value: string) => setField("device", value)}>
          {devices.map((device) => <SelectItem key={device} value={device}>{device}</SelectItem>)}
        </SelectField>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm font-semibold text-indigo-900">
          Veriler Firestore kullanılmadan yalnızca admin panelin localStorage kayıtlarından okunur. Kayıt yoksa mobil ekranlar boş durum gösterir.
        </div>
      </CardContent>
    </Card>
  )
}

function SelectField({ label, value, onChange, children }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  )
}

function PhoneMockup(props: any) {
  const { settings } = props
  const palette = getTheme(settings.theme)
  const isTablet = settings.device === "Tablet"
  const isAndroid = settings.device === "Android"
  return (
    <div className="relative">
      <div className="absolute -inset-8 rounded-[64px] bg-gradient-to-br from-sky-400/20 via-violet-500/20 to-fuchsia-500/20 blur-3xl" />
      <div data-mobile-preview-phone className={cn("relative rounded-[46px] border-[10px] border-slate-950 bg-slate-950 shadow-2xl shadow-slate-950/40", isTablet ? "h-[720px] w-[330px] sm:w-[430px]" : "h-[720px] w-[330px] sm:w-[360px]")}>
        <div className="absolute left-1/2 top-0 z-20 h-7 w-32 -translate-x-1/2 rounded-b-3xl bg-slate-950" />
        <div className={cn("h-full overflow-hidden rounded-[34px]", palette.shell)}>
          <MobileStatusBar isAndroid={isAndroid} />
          <div data-mobile-preview-scroll className="h-[610px] overflow-y-auto overflow-x-hidden px-4 pb-4 pt-2 transition-all duration-300">
            <MobileScreen {...props} palette={palette} />
          </div>
          <BottomNav palette={palette} active={settings.screen} setScreen={props.setScreen} isStandaloneApp={props.isStandaloneApp} />
        </div>
      </div>
    </div>
  )
}

function MobileAppShell(props: any) {
  const { settings } = props
  const palette = getTheme(settings.theme)

  const setMobileScreen = React.useCallback((screen: string) => {
    props.setScreen(screen === "Giriş" || screen === "GPS" ? "QR" : screen)
  }, [props.setScreen])

  return (
    <div className={cn("flex h-dvh min-h-dvh w-full flex-col overflow-hidden", palette.shell)}>
      <div data-mobile-app-scroll className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-2 transition-all duration-300">
        <MobileScreen {...props} palette={palette} setScreen={setMobileScreen} />
      </div>
      <BottomNav palette={palette} active={settings.screen} setScreen={setMobileScreen} isStandaloneApp={props.isStandaloneApp} />
    </div>
  )
}

function MobileStatusBar({ isAndroid }: { isAndroid: boolean }) {
  const [time, setTime] = React.useState("")
  React.useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }))
    tick()
    const timer = window.setInterval(tick, 30000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div className="flex h-10 items-center justify-between px-6 text-[11px] font-black text-white/90">
      <span>{time || "09:41"}</span>
      <div className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" /><span>{isAndroid ? "5G" : "LTE"}</span><div className="h-3 w-5 rounded-[4px] border border-white/70"><div className="m-0.5 h-1.5 rounded-sm bg-white" /></div></div>
    </div>
  )
}

function MobileScreen(props: any) {
  React.useEffect(() => {
    if (props.isStandaloneApp && (props.settings.screen === "Giriş" || props.settings.screen === "GPS")) {
      props.setScreen("QR")
    }
  }, [props.isStandaloneApp, props.settings.screen, props.setScreen])
  const map: Record<string, React.ReactNode> = {
    Ana: <HomeScreen {...props} />,
    "Giriş": <CheckScreen {...props} />,
    QR: <QrScreen {...props} />,
    GPS: <GpsScreen {...props} />,
    Vardiya: <ShiftScreen {...props} />,
    "İzin": <LeaveScreen {...props} />,
    Mola: <BreakScreen {...props} />,
    Bildirim: <NotificationScreen {...props} />,
    Profil: <ProfileScreen {...props} />,
  }
  return <div className="min-h-full animate-in fade-in slide-in-from-right-2 duration-300">{map[props.settings.screen] || map.Ana}</div>
}

function MobileHeader({ person, palette, title }: any) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">{title}</p>
        <h3 className="text-xl font-extrabold text-white">{personName(person)}</h3>
      </div>
      <Avatar className="h-11 w-11 border border-white/20">
        <AvatarImage src={person?.photo || person?.avatar} />
        <AvatarFallback className={cn("text-white", palette.button)}>{personName(person).slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
  )
}

function HomeScreen({ person, branch, department, position, shifts, settings, palette, setScreen, onBreak, isStandaloneApp, canCreateLeaveRequests, presenceState }: any) {
  const hour = new Date().getHours()
  const greeting = hour < 11 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar"
  const personId = getId(person)
  const branchId = getId(branch)
  const todayShift = findTodayMobileShift(shifts, personId, branchId)
  const hasTodayShift = Boolean(todayShift)
  const startTime = todayShift?.startTime || todayShift?.entryTime || "--:--"
  const endTime = todayShift?.endTime || todayShift?.exitTime || "--:--"
  return (
    <div>
      <MobileHeader person={person} palette={palette} title={greeting} />
      <StatusHero state={presenceState || settings.state} palette={palette} qrStatus={settings.qrStatus} gpsStatus={settings.gpsStatus} lastQrVerifiedAt={settings.lastQrVerifiedAt} lastGpsVerifiedAt={settings.lastGpsVerifiedAt} />
      <MobileCard>
        <div className="flex items-center justify-between"><span className="text-sm font-bold text-white/60">Bugünkü vardiya</span><CalendarClock className="h-4 w-4 text-white/60" /></div>
        <div className="mt-2 text-lg font-extrabold text-white">{hasTodayShift ? shiftDisplayName(todayShift) : "Bugün için atanmış vardiya bulunamadı."}</div>
        {hasTodayShift && <p className="text-xs text-white/50">{startTime} - {endTime} - {shiftBranchLabel(todayShift, branch)}</p>}
      </MobileCard>
      <MobileCard className="mt-3 grid grid-cols-2 gap-2">
        <Info label="Şube" value={branch ? branchName(branch) : "Tanımlı değil"} />
        <Info label="Departman" value={department ? departmentName(department) : "Tanımlı değil"} />
        <Info label="Pozisyon" value={position ? positionName(position) : valueText(person?.position, "Tanımlı değil")} />
      </MobileCard>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <QuickAction actionKey="qr" icon={QrCode} label={isStandaloneApp ? "QR ile Giriş / Çıkış" : "QR ile giriş"} description={isStandaloneApp ? "Mağaza QR kodunu okutarak giriş veya çıkış yap" : undefined} palette={palette} onClick={() => setScreen("QR")} className={isStandaloneApp ? "col-span-2" : undefined} />
        {!isStandaloneApp && <QuickAction actionKey="gps" icon={LocateFixed} label="GPS ile giriş" palette={palette} onClick={() => setScreen("GPS")} />}
        <QuickAction actionKey="break" icon={Clock3} label={presenceState === "Molada" ? "Moladasınız" : "Mola"} palette={palette} onClick={() => setScreen("Mola")} />
        {canCreateLeaveRequests && <QuickAction actionKey="leave" icon={CalendarClock} label="İzin talep et" palette={palette} onClick={() => setScreen("İzin")} />}
        <QuickAction actionKey="shifts" icon={IdCard} label="Vardiyalarım" palette={palette} onClick={() => setScreen("Vardiya")} />
        <QuickAction actionKey="notifications" icon={Bell} label="Bildirimler" palette={palette} onClick={() => setScreen("Bildirim")} />
      </div>
    </div>
  )
}

function CheckScreen({ person, settings, branch, device, kvkk, qrPoints, shifts, palette, onAttendance, isPersonInside }: any) {
  const [time, setTime] = React.useState("")
  React.useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("tr-TR"))
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])
  const inside = isPersonInside || settings.state === "İçeride" || settings.state === "Molada" || settings.state === "Fazla Mesai"
  const activeQr = qrPoints.some((point: any) => isActive(point?.status))
  return (
    <div className="pt-4 text-center">
      <h3 className="text-xl font-extrabold text-white">Giriş / Çıkış</h3>
      <p className="mt-1 text-sm font-semibold text-white/50">{time}</p>
      <p className="mt-1 text-xs font-bold text-white/45">{personName(person)}</p>
      <button data-mobile-action="attendance-toggle" onClick={() => onAttendance(inside ? "Çıkış" : "Giriş")} className={cn("mx-auto mt-7 grid h-40 w-40 place-items-center rounded-full text-white shadow-2xl transition hover:scale-[1.02]", palette.button)}>
        <div><Fingerprint className="mx-auto mb-2 h-12 w-12" /><span className="text-sm font-black">{inside ? "Çıkış Yap" : "Giriş Yap"}</span></div>
      </button>
      <div className="mt-7 space-y-3 text-left">
        <VerifyRow label="Vardiya" value={shifts[0]?.name || "Tanımlı vardiya yok"} />
        <VerifyRow label="QR doğrulama" value={settings.qrStatus === "Başarılı" ? "Doğrulandı" : activeQr ? "Hazır" : "QR bekleniyor"} danger={!activeQr && settings.qrStatus !== "Başarılı"} />
        <VerifyRow label="GPS doğrulama" value={settings.state === "GPS dışında" ? "GPS dışında" : hasBranchLocation(branch) ? "Doğrulandı" : "Şube konumu tanımlı değil"} danger={settings.state === "GPS dışında" || !hasBranchLocation(branch)} />
        <VerifyRow label="Device ID" value={device?.deviceId || device?.id || "Tanımlı değil"} danger={!device} />
        <VerifyRow label="KVKK" value={kvkk?.status || kvkk?.kvkkStatus || kvkk?.consentStatus || "Bekliyor"} danger={!kvkk} />
      </div>
    </div>
  )
}

function QrScreen({ qrPoints, branch, settings, palette, onQr, isStandaloneApp }: any) {
  const activePoint = qrPoints.find((point: any) => isActiveQrPoint(point) && qrPointMatchesBranch(point, branch))
  const firstActivePoint = qrPoints.find((point: any) => isActiveQrPoint(point))
  const streamRef = React.useRef<MediaStream | null>(null)
  const scanFrameRef = React.useRef<number | null>(null)
  const html5QrRef = React.useRef<any>(null)
  const qrReaderId = React.useId().replace(/:/g, "")
  const [cameraError, setCameraError] = React.useState("")
  const [scanning, setScanning] = React.useState(false)
  const handleQr = () => {
    onQr(activePoint || firstActivePoint)
  }
  const stopScanner = React.useCallback(() => {
    if (scanFrameRef.current) {
      window.cancelAnimationFrame(scanFrameRef.current)
      scanFrameRef.current = null
    }
    if (html5QrRef.current) {
      const scanner = html5QrRef.current
      html5QrRef.current = null
      void scanner.stop?.().catch(() => {}).finally(() => scanner.clear?.())
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScanning(false)
  }, [])
  const handleScannedCode = React.useCallback((qrCode: string) => {
    const scannedPoint = qrPoints.find((point: any) => qrValueMatchesPoint(qrCode, point))
    stopScanner()
    onQr(scannedPoint || { qrCode })
  }, [onQr, qrPoints, stopScanner])
  const loadHtml5QrCode = React.useCallback(async () => {
    if ((window as any).Html5Qrcode) return (window as any).Html5Qrcode
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-html5-qrcode]")
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true })
        existing.addEventListener("error", () => reject(new Error("QR scanner script yüklenemedi.")), { once: true })
        return
      }
      const script = document.createElement("script")
      script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"
      script.async = true
      script.dataset.html5Qrcode = "true"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("QR scanner script yüklenemedi. İnternet bağlantısını kontrol edin."))
      document.head.appendChild(script)
    })
    if (!(window as any).Html5Qrcode) throw new Error("Tarayıcı QR scanner kütüphanesini başlatamadı.")
    return (window as any).Html5Qrcode
  }, [])
  const startCameraScan = React.useCallback(async () => {
    setCameraError("")
    try {
      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        setCameraError("Kamera için HTTPS gerekli.")
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Tarayıcı kamera erişimini desteklemiyor.")
        return
      }
      const Html5Qrcode = await loadHtml5QrCode()
      setScanning(true)
      const scanner = new Html5Qrcode(qrReaderId)
      html5QrRef.current = scanner
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => handleScannedCode(decodedText),
        () => {}
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kamera izni alınamadı."
      setCameraError(message.includes("Permission") || message.includes("NotAllowed") ? "Kamera izni verilmedi." : message)
      stopScanner()
    }
  }, [handleScannedCode, loadHtml5QrCode, qrReaderId, stopScanner])
  React.useEffect(() => stopScanner, [stopScanner])
  return (
    <div>
      <MobileHeader person={{ fullName: "QR Okutma" }} palette={palette} title="Güvenli doğrulama" />
      <div className="relative mt-6 grid h-[340px] max-h-[52dvh] min-h-[320px] place-items-center overflow-hidden rounded-[32px] border border-white/15 bg-black/35">
        <Camera className="absolute left-4 top-4 z-10 h-5 w-5 text-white/50" />
        <div id={qrReaderId} className={cn("absolute inset-0 h-full w-full overflow-hidden [&_div]:border-0 [&_img]:hidden [&_video]:absolute [&_video]:inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover", scanning ? "block" : "hidden")} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-[28px] border-4 border-sky-300/80 shadow-[0_0_32px_rgba(56,189,248,0.35)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-0.5 w-52 -translate-x-1/2 -translate-y-1/2 animate-pulse bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
      </div>
      {cameraError ? <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-100">{cameraError}</p> : null}
      <Button data-mobile-action="qr-camera" onClick={scanning ? stopScanner : startCameraScan} className={cn("mt-4 h-11 w-full rounded-2xl text-sm font-extrabold text-white", palette.button)}>{scanning ? "Taramayı Durdur" : "Kamerayla QR Tara"}</Button>
      {!isStandaloneApp && (
      <Button data-mobile-action="qr-sim" onClick={handleQr} variant="outline" className="mt-2 h-11 w-full rounded-2xl border-white/15 bg-white/10 text-sm font-extrabold text-white hover:bg-white/15">QR Simülasyonu Başlat</Button>
      )}
      <MobileCard className="mt-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/50">Şube QR noktası</p>
        <h4 className="mt-1 text-lg font-extrabold text-white">{activePoint?.pointName || activePoint?.name || "Bu şubeye ait QR noktası bulunamadı."}</h4>
        <p className="text-xs text-white/50">{branch ? branchName(branch) : "Şube seçilmedi"} · {activePoint ? "Aktif" : "Pasif/Yok"}</p>
        <VerifyRow label="QR doğrulama sonucu" value={settings.qrStatus || "QR bekleniyor"} danger={settings.qrStatus === "Başarısız" || !activePoint} />
        <div className="mt-3 space-y-2">
          {qrPoints.length ? qrPoints.map((point: any) => (
            <div key={getId(point) || point?.qrCode || point?.pointName} className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 text-xs">
              <span className="font-bold text-white/70">{point?.pointName || point?.name || "QR noktası"}</span>
              <span className={cn("font-black", isActive(point?.status) ? "text-emerald-300" : "text-rose-300")}>{isActive(point?.status) ? "Aktif" : "Pasif"}</span>
            </div>
          )) : null}
        </div>
      </MobileCard>
    </div>
  )
}

function GpsScreen({ branch, person, settings, palette, onGps }: any) {
  const outside = settings.state === "GPS dışında"
  const hasLocation = hasBranchLocation(branch)
  const branchCoordinates = getCoordinates(branch)
  const userCoordinates = getCoordinates(settings) || getCoordinates(person)
  const debugDistance = branchCoordinates && userCoordinates ? distanceMeters(userCoordinates, branchCoordinates) : null
  return (
    <div>
      <MobileHeader person={{ fullName: "GPS Konum" }} palette={palette} title="Konum doğrulama" />
      <div className="relative h-80 overflow-hidden rounded-[32px] border border-white/15 bg-sky-950/35">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-sky-300/30 bg-sky-400/10">
          <MapPin className={cn("h-10 w-10", outside || !hasLocation ? "text-rose-300" : "text-emerald-300")} />
        </div>
      </div>
      <Button data-mobile-action="gps-sim" onClick={onGps} className={cn("mt-4 h-11 w-full rounded-2xl text-sm font-extrabold text-white", palette.button)}>GPS ile giriş</Button>
      <MobileCard className="mt-4">
        <div className="mb-3 rounded-2xl bg-white/10 p-3 font-mono text-[10px] leading-5 text-white/60">
          <div>branch lat/lng: {branchCoordinates ? `${branchCoordinates.latitude}, ${branchCoordinates.longitude}` : "-"}</div>
          <div>user lat/lng: {userCoordinates ? `${userCoordinates.latitude}, ${userCoordinates.longitude}` : "-"}</div>
          <div>calculated distance: {debugDistance === null ? "-" : `${Math.round(debugDistance)} m`}</div>
        </div>
        <VerifyRow label="Şube lokasyonu" value={hasLocation ? branchName(branch) : "Şube konumu tanımlı değil"} danger={!hasLocation} />
        <VerifyRow label="Personel konumu" value={outside ? "Şube dışında" : hasLocation ? "Şube alanında" : "Simülasyon bekliyor"} danger={outside || !hasLocation} />
        <VerifyRow label="Mesafe" value={outside ? "850 m" : hasLocation ? "42 m" : "-"} danger={outside || !hasLocation} />
        <VerifyRow label="Sonuç" value={settings.gpsStatus || "Bekleniyor"} danger={outside || settings.gpsStatus !== "Doğrulandı"} />
      </MobileCard>
    </div>
  )
}

function ShiftScreen({ shifts, branch, palette }: any) {
  const cards = shifts.slice(0, 7).map((shift: any) => ({
    title: shift.name || "Vardiya",
    detail: `${formatDateTR(shift.startDate) || "Tarih yok"} · ${shift.startTime || shift.entryTime || "--:--"} - ${shift.endTime || shift.exitTime || "--:--"}`,
    badge: shift.shiftType || shift.type || "Planlı",
    meta: `${branch ? branchName(branch) : "Şube yok"} · Mola: ${shift.breakMinutes || shift.breakTime || "Tanımlı değil"}`,
  }))
  return <ListScreen title="Vardiyalarım" icon={CalendarClock} empty="Bu personele atanmış vardiya bulunamadı." items={cards} palette={palette} />
}

function LeaveScreen({ leaves, palette, onLeaveCreate, canCreateLeaveRequests, personnel = [], person, branch }: any) {
  const [open, setOpen] = React.useState(false)
  const [selectedPersonnelId, setSelectedPersonnelId] = React.useState("")
  const [form, setForm] = React.useState({ type: "Yıllık İzin", startDate: "", endDate: "", description: "" })
  const [startDay, setStartDay] = React.useState("")
  const [startMonth, setStartMonth] = React.useState("")
  const [startYear, setStartYear] = React.useState("")
  const [endDay, setEndDay] = React.useState("")
  const [endMonth, setEndMonth] = React.useState("")
  const [endYear, setEndYear] = React.useState("")
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const currentYear = new Date().getFullYear()
  const currentPersonId = getId(person)
  const currentBranchId = String(person?.branchId || getId(branch) || "")
  const selectablePersonnel = React.useMemo(() => {
    const list = Array.isArray(personnel) ? personnel : []
    return list.filter((item: any) => {
      const itemId = getId(item)
      if (itemId === currentPersonId) return true
      return Boolean(currentBranchId && String(item?.branchId || "") === currentBranchId)
    })
  }, [currentBranchId, currentPersonId, personnel])
  const dayOptions = React.useMemo(() => Array.from({ length: 31 }, (_, index) => `${index + 1}`.padStart(2, "0")), [])
  const monthOptions = React.useMemo(() => Array.from({ length: 12 }, (_, index) => `${index + 1}`.padStart(2, "0")), [])
  const yearOptions = React.useMemo(() => Array.from({ length: 4 }, (_, index) => `${currentYear + index}`), [currentYear])
  React.useEffect(() => {
    if (!canCreateLeaveRequests && open) setOpen(false)
  }, [canCreateLeaveRequests, open])
  const isValidDateParts = (day: string, month: string, year: string) => Boolean(day && month && /^\d{4}$/.test(year))
  const toIsoDate = (day: string, month: string, year: string) => {
    if (!isValidDateParts(day, month, year)) return ""
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }
  const submit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (saving) return
    setError("")
    if (!canCreateLeaveRequests) {
      setOpen(false)
      setError("İzin talebi oluşturma yetkiniz yok.")
      return
    }
    if (!selectedPersonnelId) {
      setError("Personel seçimi zorunlu.")
      return
    }
    if (!form.type.trim()) {
      setError("Izin turu zorunlu.")
      return
    }
    if (!isValidDateParts(startDay, startMonth, startYear) || !isValidDateParts(endDay, endMonth, endYear)) {
      setError("Gun, ay ve yil alanlarini kontrol edin.")
      return
    }
    const startDate = toIsoDate(startDay, startMonth, startYear)
    const endDate = toIsoDate(endDay, endMonth, endYear)
    if (endDate < startDate) {
      setError("Bitis tarihi baslangictan once olamaz.")
      return
    }
    if (attachmentFile) {
      if (!LEAVE_ATTACHMENT_ACCEPT.includes(attachmentFile.type)) {
        setError("Sadece JPG, PNG veya PDF yukleyebilirsiniz.")
        return
      }
      if (attachmentFile.size > LEAVE_ATTACHMENT_MAX_BYTES) {
        setError("Dosya boyutu en fazla 5 MB olabilir.")
        return
      }
    }
    setSaving(true)
    const saved = await onLeaveCreate({ ...form, startDate, endDate, attachmentFile, selectedPersonnelId })
    setSaving(false)
    if (saved === false) {
      setError("Kayit sirasinda hata olustu.")
      return
    }
    setOpen(false)
    setForm({ type: "Yıllık İzin", startDate: "", endDate: "", description: "" })
    setStartDay("")
    setStartMonth("")
    setStartYear("")
    setEndDay("")
    setEndMonth("")
    setEndYear("")
    setAttachmentFile(null)
    setSelectedPersonnelId("")
  }
  const items = leaves.slice(0, 8).map((leave: any) => ({
    title: leave.type || leave.leaveType || "İzin",
    detail: `${formatDateTR(leave.startDate)} / ${formatDateTR(leave.endDate)}`,
    badge: normalizeStatus(leave.status),
    meta: leave.description || "",
  }))
  return (
    <div>
      <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-extrabold text-white">İzin Taleplerim</h3><CalendarClock className="h-5 w-5 text-white/60" /></div>
      {canCreateLeaveRequests && <Button
        data-mobile-action="leave-new"
        onClick={() => {
          if (!canCreateLeaveRequests) {
            setOpen(false)
            setError("İzin talebi oluşturma yetkiniz yok.")
            return
          }
          setError("")
          setOpen((value) => !value)
        }}
        className={cn("mb-4 h-11 w-full rounded-2xl text-sm font-extrabold text-white", canCreateLeaveRequests ? palette.button : "cursor-not-allowed bg-white/10 text-white/45 hover:bg-white/10")}
      >
        Yeni izin talebi
      </Button>}
      {!canCreateLeaveRequests && error ? <p className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-100">{error}</p> : null}
      {open && (
        <form onSubmit={submit} className="mb-4 space-y-3 rounded-[26px] border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/45">Personel Seç</p>
            <select
              value={selectedPersonnelId}
              onChange={(event) => setSelectedPersonnelId(event.target.value)}
              className="h-10 w-full rounded-2xl border border-white/10 bg-white/10 px-3 text-xs font-bold text-white"
            >
              <option value="">Personel seçin</option>
              {selectablePersonnel.map((item: any) => (
                <option key={getId(item)} value={getId(item)}>
                  {personName(item)}
                </option>
              ))}
            </select>
          </div>
          <Input value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="h-10 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/40" />
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/45">Baslangic tarihi</p>
            <div className="grid grid-cols-3 gap-2">
              <select value={startDay} onChange={(e) => setStartDay(e.target.value)} className="h-10 rounded-2xl border border-white/10 bg-white/10 px-2 text-xs font-bold text-white"><option value="">Gun</option>{dayOptions.map((day) => <option key={day} value={day}>{day}</option>)}</select>
              <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="h-10 rounded-2xl border border-white/10 bg-white/10 px-2 text-xs font-bold text-white"><option value="">Ay</option>{monthOptions.map((month) => <option key={month} value={month}>{month}</option>)}</select>
              <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="h-10 rounded-2xl border border-white/10 bg-white/10 px-2 text-xs font-bold text-white"><option value="">Yil</option>{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/45">Bitis tarihi</p>
            <div className="grid grid-cols-3 gap-2">
              <select value={endDay} onChange={(e) => setEndDay(e.target.value)} className="h-10 rounded-2xl border border-white/10 bg-white/10 px-2 text-xs font-bold text-white"><option value="">Gun</option>{dayOptions.map((day) => <option key={day} value={day}>{day}</option>)}</select>
              <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="h-10 rounded-2xl border border-white/10 bg-white/10 px-2 text-xs font-bold text-white"><option value="">Ay</option>{monthOptions.map((month) => <option key={month} value={month}>{month}</option>)}</select>
              <select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="h-10 rounded-2xl border border-white/10 bg-white/10 px-2 text-xs font-bold text-white"><option value="">Yil</option>{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select>
            </div>
          </div>
          <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Açıklama" className="min-h-16 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/40" />
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/45">Ek dosya</p>
            <label className="block cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/10 px-3 py-3 text-xs font-bold text-white/75 transition hover:bg-white/15">
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  setAttachmentFile(file)
                  if (file && !LEAVE_ATTACHMENT_ACCEPT.includes(file.type)) setError("Sadece JPG, PNG veya PDF yukleyebilirsiniz.")
                  else if (file && file.size > LEAVE_ATTACHMENT_MAX_BYTES) setError("Dosya boyutu en fazla 5 MB olabilir.")
                  else setError("")
                }}
              />
              {attachmentFile ? `${attachmentFile.name} · ${(attachmentFile.size / 1024 / 1024).toFixed(2)} MB` : "Görsel veya PDF yükle"}
            </label>
            <p className="text-[10px] font-semibold text-white/40">JPG, PNG veya PDF · Maksimum 5 MB</p>
          </div>
          {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/15 px-3 py-2 text-xs font-bold text-red-100">{error}</p> : null}
          <Button data-mobile-action="leave-save" type="submit" disabled={saving} className="h-10 w-full rounded-2xl bg-white text-slate-950 hover:bg-white/90">{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
        </form>
      )}
      <ListItems items={items} empty="İzin talebi bulunamadı." />
    </div>
  )
}

function BreakScreen({ breaks, settings, palette, onBreak, isPersonInside }: any) {
  const active = breaks.find((item: any) => {
    const status = String(item?.status || "").toLowerCase()
    return (status === "active" || status === "on_break") && !item?.endTime && !item?.breakEnd
  })
  const today = todayDateKeyTR()
  const todayBreaks = breaks.filter((item: any) => String(item?.date || item?.breakStart || item?.startTime || "").slice(0, 10) === today)
  const totalTodayMinutes = todayBreaks.reduce((total: number, item: any) => {
    if (Number(item?.durationMinutes)) return total + Number(item.durationMinutes)
    const start = new Date(item?.breakStart || item?.startTime || item?.createdAt || "").getTime()
    const endValue = item?.breakEnd || item?.endTime
    if (!endValue) return total
    const end = new Date(endValue).getTime()
    if (Number.isNaN(start) || Number.isNaN(end)) return total
    return total + Math.max(1, Math.round((end - start) / 60000))
  }, 0)
  const items = todayBreaks.slice(0, 6).map((item: any) => ({ title: item.endTime || item.breakEnd ? "Mola tamamlandı" : "Aktif mola", detail: `${item.date || ""} · ${formatTimeTR(item.startTime || item.breakStart)} - ${item.endTime || item.breakEnd ? formatTimeTR(item.endTime || item.breakEnd) : "Devam ediyor"}`, badge: item.durationMinutes ? `${item.durationMinutes} dk` : settings.state }))
  return (
    <div>
      <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-extrabold text-white">Mola</h3><Clock3 className="h-5 w-5 text-white/60" /></div>
      <MobileCard className="mb-4 space-y-3">
        <Info label="Mevcut durum" value={active ? "Molada" : "Molada değil"} />
        <Info label="Bugünkü toplam mola" value={`${totalTodayMinutes} dk`} />
        <Info label="Aktif mola başlangıcı" value={active ? formatTimeTR(active.breakStart || active.startTime) : "-"} />
        {!isPersonInside && <p className="rounded-2xl border border-amber-300/20 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-100">Mola başlatmak için önce giriş yapmalısınız.</p>}
      </MobileCard>
      <div className="mb-4 grid grid-cols-2 gap-3">
        {!active && (
          <Button data-mobile-action="break-start" disabled={!isPersonInside} onClick={onBreak} className={cn("h-12 rounded-2xl text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45", palette.button)}>Mola Başlat</Button>
        )}
        {active && (
          <Button data-mobile-action="break-end" onClick={onBreak} className={cn("col-span-2 h-12 rounded-2xl text-sm font-extrabold text-white", palette.button)}>Molayı Bitir</Button>
        )}
      </div>
      <div className="mb-3 text-xs font-black uppercase tracking-widest text-white/45">Bugünkü mola geçmişi</div>
      <ListItems items={items} empty="Bugün mola kaydı bulunamadı." />
    </div>
  )
}

function NotificationScreen({ leaves, shifts, settings, notificationSettings, palette, person, onEnableNotifications }: any) {
  const now = new Date().toLocaleString("tr-TR")
  const notificationsEnabled = Boolean(person?.oneSignalSubscribed)
  const items = [
    ...leaves.slice(0, 3).map((leave: any) => ({ title: "İzin durumu", detail: `${formatDateTR(leave.startDate)} · ${normalizeStatus(leave.status)}`, badge: "İzin", time: leave.createdAt || now, unread: normalizeStatus(leave.status) === "Bekliyor" })),
    ...shifts.slice(0, 3).map((shift: any) => ({ title: "Vardiya hatırlatması", detail: `${shift.name || "Vardiya"} ${shift.startTime || "--:--"}`, badge: "Vardiya", time: shift.startDate || now })),
    ...(settings.qrStatus === "Başarısız" ? [{ title: "QR güvenlik uyarısı", detail: "Aktif QR noktası bulunamadı.", badge: "QR", time: now, unread: true }] : []),
    ...(settings.state === "GPS dışında" ? [{ title: "GPS güvenlik uyarısı", detail: "Personel şube lokasyonu dışında.", badge: "GPS", time: now, unread: true }] : []),
    ...(notificationSettings?.global?.push === false ? [{ title: "Mobil push kapalı", detail: "Bildirim ayarlarında mobil push pasif.", badge: "Ayar", time: now }] : []),
  ]
  return (
    <div>
      <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-extrabold text-white">Bildirimler</h3><Bell className="h-5 w-5 text-white/60" /></div>
      <MobileCard className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-white">Mobil bildirimler</div>
            <p className="mt-1 text-xs font-semibold text-white/50">{notificationsEnabled ? "Bildirim aboneliğiniz aktif." : "Vardiya ve onay bildirimleri için izin verin."}</p>
          </div>
          <Button onClick={onEnableNotifications} className={cn("h-9 rounded-2xl px-4 text-xs font-extrabold text-white", palette.button)}>
            {notificationsEnabled ? "Yenile" : "Bildirimleri Aktif Et"}
          </Button>
        </div>
      </MobileCard>
      <ListItems items={items} empty="Bildirim kaydı bulunmuyor." />
    </div>
  )
}

function ProfileScreen({ person, branch, department, position, device, kvkk, palette, leaves = [], shifts = [], setScreen, onEnableNotifications }: any) {
  const maskedTckn = person?.tckn ? `${String(person.tckn).slice(0, 2)}*******${String(person.tckn).slice(-2)}` : "Tanımlı değil"
  const archiveItems = Array.isArray(person?.digitalArchive) ? person.digitalArchive : []
  const leaveItems = Array.isArray(leaves) ? leaves : []
  const notificationsEnabled = Boolean(person?.oneSignalSubscribed)
  const oneSignalPermission = person?.oneSignalPermission || (typeof Notification !== "undefined" ? Notification.permission : "unknown")
  const oneSignalSubscriptionId = person?.oneSignalSubscriptionId || ""
  const oneSignalId = person?.oneSignalId || ""
  const oneSignalSdkReady = person?.oneSignalSdkReady === true || Boolean(oneSignalId || oneSignalSubscriptionId)
  const oneSignalSubscriptionActive = Boolean(person?.oneSignalSubscribed && (oneSignalId || oneSignalSubscriptionId))
  const oneSignalReason = person?.oneSignalSubscriptionError || (
    !oneSignalSdkReady ? "SDK henuz hazir degil veya senkron edilmedi." :
    oneSignalPermission !== "granted" ? "Bildirim izni verilmedi." :
    !oneSignalSubscriptionActive ? "Permission granted, ancak push subscription olusmadi." :
    "Abonelik aktif."
  )
  const handleLogout = () => {
    logoutLocalSession()
  }

  return (
    <div>
      <div className="pt-5 text-center">
        <Avatar className="mx-auto h-24 w-24 border-4 border-white/15"><AvatarImage src={person?.photoUrl || person?.avatarUrl || person?.photo || person?.avatar} /><AvatarFallback className={cn("text-xl font-black text-white", palette.button)}>{personName(person).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
        <h3 className="mt-4 text-2xl font-extrabold text-white">{personName(person)}</h3>
        <p className="text-sm font-semibold text-white/50">{person?.personnelCode || person?.sicilNo || person?.id || "Sicil yok"}</p>
      </div>
      <MobileCard className="mt-6 space-y-3">
        <Info label="TCKN" value={maskedTckn} />
        <Info label="Telefon" value={valueText(person?.phone || person?.gsm, "Telefon yok")} />
        <Info label="Şube" value={branch ? branchName(branch) : "Tanımlı değil"} />
        <Info label="Departman" value={department ? departmentName(department) : "Tanımlı değil"} />
        <Info label="Pozisyon" value={position ? positionName(position) : valueText(person?.position, "Tanımlı değil")} />
        <Info label="Role" value={valueText(person?.role || person?.roleId, "Rol yok")} />
        <Info label="Device ID" value={device?.deviceId || device?.id || "Tanımlı değil"} />
        <Info label="KVKK" value={kvkk?.status || kvkk?.kvkkStatus || kvkk?.consentStatus || "Bekliyor"} />
        <Info label="İşe giriş" value={formatDateTR(person?.startDate || person?.hireDate || person?.employmentStartDate)} />
      </MobileCard>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <QuickAction actionKey="profile-archive" icon={IdCard} label="Dijital Arşiv" palette={palette} onClick={() => document.getElementById("mobile-digital-archive")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
        <QuickAction actionKey="profile-leaves" icon={CalendarClock} label="İzinlerim" palette={palette} onClick={() => document.getElementById("mobile-profile-leaves")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
        <QuickAction actionKey="profile-shifts" icon={Clock3} label="Vardiyalarım" palette={palette} onClick={() => setScreen?.("Vardiya")} />
        <QuickAction actionKey="profile-logout" icon={LogOut} label="Çıkış Yap" palette={palette} onClick={handleLogout} />
      </div>

      <MobileCard className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-white">Bildirimler</h4>
            <p className="mt-1 text-xs font-semibold text-white/50">{notificationsEnabled ? "Mobil bildirimler aktif." : "Bildirim almak için izin verin."}</p>
          </div>
          <Button onClick={onEnableNotifications} className={cn("h-9 rounded-2xl px-4 text-xs font-extrabold text-white", palette.button)}>
            {notificationsEnabled ? "Yenile" : "Bildirimleri Aktif Et"}
          </Button>
        </div>
      </MobileCard>

      <MobileCard className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-extrabold text-white">OneSignal Durumu</h4>
          <Badge className={cn("hover:bg-white/15", oneSignalSubscriptionActive ? "bg-emerald-500/20 text-emerald-100" : "bg-amber-500/20 text-amber-100")}>
            {oneSignalSubscriptionActive ? "Aktif" : "Debug"}
          </Badge>
        </div>
        <Info label="SDK hazir mi" value={oneSignalSdkReady ? "Evet" : "Hayir"} />
        <Info label="Permission" value={oneSignalPermission || "Bilinmiyor"} />
        <Info label="Subscription aktif mi" value={oneSignalSubscriptionActive ? "Evet" : "Hayir"} />
        <Info label="OneSignal ID" value={oneSignalId || "Yok"} />
        <Info label="Subscription ID" value={oneSignalSubscriptionId || "Yok"} />
        {!oneSignalSubscriptionActive && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs font-semibold text-amber-50">
            {oneSignalReason}
          </div>
        )}
      </MobileCard>

      <MobileCard id="mobile-digital-archive" className="mt-4 space-y-3">
        <div className="flex items-center justify-between"><h4 className="font-extrabold text-white">Dijital Arşiv</h4><Badge className="bg-white/15 text-white hover:bg-white/15">{archiveItems.length}</Badge></div>
        {archiveItems.length ? archiveItems.map((item: any) => (
          <div key={item?.id || item?.fileUrl || item?.publicId} className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="font-extrabold text-white">{item?.title || item?.name || item?.fileName || "Dosya"}</div>
            <div className="mt-1 text-xs font-semibold text-white/50">{item?.category || "Diğer"}</div>
            <div className="mt-3 flex gap-2">
              {item?.fileUrl && <Button asChild size="sm" variant="outline" className="h-8 rounded-xl border-white/15 bg-white/10 text-xs font-extrabold text-white hover:bg-white/15"><a href={item.fileUrl} target="_blank" rel="noopener noreferrer">Görüntüle</a></Button>}
              {item?.fileUrl && <Button size="sm" variant="outline" className="h-8 rounded-xl border-white/15 bg-white/10 text-xs font-extrabold text-white hover:bg-white/15" onClick={() => downloadArchiveFile(item.fileUrl, item?.fileName || item?.title || "dosya")}>İndir</Button>}
            </div>
          </div>
        )) : <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-sm font-semibold text-white/55">Henüz dosya yok</div>}
      </MobileCard>

      <MobileCard id="mobile-profile-leaves" className="mt-4 space-y-3">
        <div className="flex items-center justify-between"><h4 className="font-extrabold text-white">İzinlerim</h4><Badge className="bg-white/15 text-white hover:bg-white/15">{leaveItems.length}</Badge></div>
        {leaveItems.length ? leaveItems.map((leave: any) => (
          <div key={leave?.id || `${leave?.startDate}-${leave?.endDate}-${leave?.type}`} className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="font-extrabold text-white">{leave?.leaveType || leave?.type || "İzin"}</div>
            <div className="mt-1 text-xs font-semibold text-white/50">{formatDateTR(leave?.startDate)} - {formatDateTR(leave?.endDate || leave?.startDate)}</div>
            <Badge className="mt-3 bg-white/15 text-white hover:bg-white/15">{normalizeStatus(leave?.status)}</Badge>
          </div>
        )) : <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-sm font-semibold text-white/55">Henüz izin talebiniz yok</div>}
      </MobileCard>
    </div>
  )
}

function ListScreen({ title, icon: Icon, items, empty, palette }: any) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-extrabold text-white">{title}</h3><Icon className="h-5 w-5 text-white/60" /></div>
      <ListItems items={items} empty={empty} />
    </div>
  )
}

function ListItems({ items, empty }: any) {
  return (
    <div className="space-y-3">
      {items.length ? items.map((item: any, index: number) => (
        <MobileCard key={`${item.title}-${index}`}>
          <div className="flex items-center justify-between gap-3">
            <div><h4 className="font-extrabold text-white">{item.title}</h4><p className="text-xs text-white/50">{item.detail}</p>{item.meta && <p className="mt-1 text-[11px] font-semibold text-white/40">{item.meta}</p>}</div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge className="bg-white/15 text-white hover:bg-white/15">{item.badge}</Badge>
              {item.time && <span className="text-[9px] font-bold text-white/35">{String(item.time).slice(0, 16)}</span>}
              {item.unread && <span className="h-2 w-2 rounded-full bg-sky-300" />}
            </div>
          </div>
        </MobileCard>
      )) : <div className="grid h-56 place-items-center rounded-[28px] border border-dashed border-white/15 bg-white/5 px-5 text-center text-sm font-semibold text-white/55">{empty}</div>}
    </div>
  )
}

function BottomNav({ palette, active, setScreen, isStandaloneApp }: any) {
  const items = (isStandaloneApp ? [
    ["Ana", "home", Home],
    ["QR", "qr", QrCode],
    ["Profil", "profile", UserRound],
  ] : [
    ["Ana", "home", Home],
    ["Giriş", "check", Fingerprint],
    ["QR", "qr", QrCode],
    ["Profil", "profile", UserRound],
  ])
  const activeText = String(active || "").toLocaleLowerCase("tr-TR")
  const activeScreen = isStandaloneApp && (activeText.startsWith("giri") || active === "GPS") ? "QR" : active
  return (
    <div data-mobile-preview-bottom-nav className={cn("mx-3 mb-3 grid h-[68px] rounded-[26px] border border-white/10 bg-black/20 px-2 py-2 backdrop-blur-xl", isStandaloneApp ? "grid-cols-3" : "grid-cols-4")}>
      {items.map(([label, key, Icon]: any) => {
        const selected = activeScreen === label
        return <button key={label} data-mobile-nav={key} onClick={() => setScreen(label)} className={cn("flex flex-col items-center justify-center rounded-2xl text-[9px] font-black transition-all duration-300", selected ? `${palette.nav} text-white shadow-lg` : "text-white/45 hover:bg-white/10 hover:text-white/80")}><Icon className="mb-1 h-4 w-4" />{label}</button>
      })}
    </div>
  )
}

function StatusHero({ state, palette, qrStatus, gpsStatus, lastQrVerifiedAt, lastGpsVerifiedAt }: any) {
  const danger = state === "Geç kaldı" || state === "GPS dışında" || state === "QR bekleniyor"
  const qrText = lastQrVerifiedAt || qrStatus === "Başarılı" ? "QR doğrulandı" : qrStatus || "Bekleniyor"
  const gpsText = lastGpsVerifiedAt || gpsStatus === "GPS başarılı" || gpsStatus === "Doğrulandı" ? "GPS doğrulandı" : gpsStatus
  const showGps = Boolean(gpsText && gpsText !== "Bekleniyor")
  return (
    <div className={cn("mb-4 rounded-[30px] p-5 text-white shadow-xl", danger ? "bg-gradient-to-br from-rose-500 to-orange-700" : palette.button)}>
      <p className="text-xs font-bold uppercase tracking-widest text-white/70">Durum</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-2xl font-black">{state}</span>
        {danger ? <XCircle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
      </div>
      <p className="mt-2 text-xs font-semibold text-white/75">QR: {qrText}{showGps ? ` · GPS: ${gpsText}` : ""}</p>
    </div>
  )
}

function QuickAction({ icon: Icon, label, description, palette, onClick, actionKey, className }: any) {
  return (
    <button data-mobile-action={actionKey} onClick={onClick} className={cn("rounded-3xl border border-white/10 bg-white/10 p-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-white/15", className)}>
      <Icon className={cn("mb-3 h-5 w-5 rounded-xl p-0.5", palette.text)} />
      <div className="text-xs font-extrabold">{label}</div>
      {description && <p className="mt-1 text-[11px] font-semibold leading-4 text-white/55">{description}</p>}
    </button>
  )
}

function VerifyRow({ label, value, danger }: any) {
  return <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5"><span className="text-xs font-bold text-white/55">{label}</span><span className={cn("text-right text-xs font-black", danger ? "text-rose-300" : "text-emerald-300")}>{value}</span></div>
}

function MobileCard({ children, className, id }: any) {
  return <div id={id} className={cn("rounded-[26px] border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-xl", className)}>{children}</div>
}

function Info({ label, value }: any) {
  return <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-0 last:pb-0"><span className="text-xs font-bold text-white/50">{label}</span><span className="text-right text-xs font-black text-white">{value}</span></div>
}

function getTheme(theme: string) {
  if (theme === "Koyu Premium") return { shell: "bg-slate-950", button: "bg-gradient-to-br from-slate-700 to-slate-950", nav: "bg-white/15", text: "text-slate-200" }
  if (theme === "Evyapar Kırmızı") return { shell: "bg-gradient-to-br from-slate-950 via-red-950 to-slate-950", button: "bg-gradient-to-br from-red-500 to-red-900", nav: "bg-red-500/40", text: "text-red-200" }
  if (theme === "Açık Kurumsal") return { shell: "bg-gradient-to-br from-slate-100 via-sky-700 to-slate-950", button: "bg-gradient-to-br from-sky-500 to-indigo-700", nav: "bg-sky-500/35", text: "text-sky-200" }
  return { shell: "bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-950", button: "bg-gradient-to-br from-indigo-500 via-violet-600 to-sky-500", nav: "bg-indigo-500/40", text: "text-sky-200" }
}
