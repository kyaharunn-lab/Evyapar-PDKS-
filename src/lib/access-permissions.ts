"use client"

export const ACCESS_STORAGE_KEYS = ["app_access_control", "app_access_controls", "app_access_management", "app_user_access", "accessControls"] as const
const PERSONNEL_STORAGE_KEY = "app_personnel"

function readArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "")
}

function personName(person: any) {
  return (person?.fullName || person?.personnelName || [person?.firstName || person?.name, person?.lastName || person?.surname].filter(Boolean).join(" ") || "").toString()
}

function recordName(record: any) {
  return (record?.personnelName || record?.userName || record?.fullName || record?.name || "").toString()
}

function personId(person: any) {
  return String(person?.id || person?.personnelId || person?.employeeId || person?.userId || "")
}

function recordPersonIds(record: any) {
  return [record?.personnelId, record?.personId, record?.employeeId, record?.userId, record?.id]
    .filter(Boolean)
    .map(String)
}

function recordTime(record: any) {
  const raw = record?.updatedAt || record?.createdAt || record?.timestamp || 0
  if (typeof raw === "number") return raw
  const parsed = Date.parse(String(raw))
  return Number.isFinite(parsed) ? parsed : 0
}

function isHarunKaya(value: unknown) {
  return normalize(value).includes("harunkaya")
}

function isHrManager(person: any) {
  const fields = [personName(person), person?.roleName, person?.role, person?.assignedRole, person?.position, person?.title]
  return fields.some((field) => {
    const normalized = normalize(field)
    return normalized.includes("ikyoneticisi") || normalized.includes("insankaynaklari")
  })
}

export function readCurrentAccess() {
  if (typeof window === "undefined") {
    return { panelAccess: true, mobileAccess: true, user: null, record: null }
  }

  const personnel = readArray(PERSONNEL_STORAGE_KEY).filter((person: any) => !person?.isDeleted)
  const accessRecords = ACCESS_STORAGE_KEYS.flatMap((key) => readArray(key))
  const activePerson =
    personnel.find((person: any) => isHarunKaya(personName(person))) ||
    personnel.find((person: any) => isHrManager(person)) ||
    personnel[0] ||
    null
  const activeId = activePerson ? personId(activePerson) : ""
  const activeName = activePerson ? personName(activePerson) : "Harun Kaya"

  const matchedRecords = accessRecords
    .filter((record: any) => {
      const name = recordName(record)
      return (
        (activeId && recordPersonIds(record).includes(activeId)) ||
        isHarunKaya(name) ||
        (activeName && normalize(name) === normalize(activeName))
      )
    })
    .sort((a: any, b: any) => recordTime(b) - recordTime(a))
  const accessRecord = matchedRecords[0] || null

  const panelAccess =
    typeof accessRecord?.panelAccess === "boolean"
      ? accessRecord.panelAccess
      : typeof activePerson?.hasAdminAccess === "boolean"
        ? activePerson.hasAdminAccess
        : true

  const mobileAccess =
    typeof accessRecord?.mobileAccess === "boolean"
      ? accessRecord.mobileAccess
      : typeof activePerson?.hasMobileAccess === "boolean"
        ? activePerson.hasMobileAccess
        : true

  return { panelAccess, mobileAccess, user: activePerson, record: accessRecord }
}
