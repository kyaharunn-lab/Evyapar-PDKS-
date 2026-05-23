"use client"

export const ACCESS_STORAGE_KEYS = ["app_access_control", "app_access_controls", "app_access_management", "app_user_access", "accessControls"] as const
const PERSONNEL_STORAGE_KEY = "app_personnel"
const AUTH_SESSION_KEY = "app_auth_session"
const ROLES_STORAGE_KEY = "app_roles"

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

function roleValues(role: any) {
  return [role?.id, role?.roleId, role?.name, role?.roleName, role?.code].filter(Boolean).map(normalize)
}

function personRoleValues(person: any) {
  return [person?.roleId, person?.role, person?.roleName, person?.assignedRole, person?.accessRole, person?.permissionRole].filter(Boolean).map(normalize)
}

function boolValue(...values: unknown[]) {
  const found = values.find((value) => typeof value === "boolean")
  return typeof found === "boolean" ? found : undefined
}

function recordTime(record: any) {
  const raw = record?.updatedAt || record?.createdAt || record?.timestamp || 0
  if (typeof raw === "number") return raw
  const parsed = Date.parse(String(raw))
  return Number.isFinite(parsed) ? parsed : 0
}

function readSession() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_SESSION_KEY) || "null")
  } catch {
    return null
  }
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
    return { panelAccess: true, mobileAccess: true, user: null, record: null, session: null }
  }

  const session = readSession()
  const personnel = readArray(PERSONNEL_STORAGE_KEY).filter((person: any) => !person?.isDeleted)
  const roles = readArray(ROLES_STORAGE_KEY)
  const accessRecords = ACCESS_STORAGE_KEYS.flatMap((key) => readArray(key))
  const sessionPerson =
    session
      ? personnel.find((person: any) => {
          const sameId = session?.personnelId && personId(person) === String(session.personnelId)
          const sameEmail = session?.email && normalize(person?.email || person?.workEmail || person?.mail || person?.username) === normalize(session.email)
          return sameId || sameEmail
        }) || null
      : null
  const activePerson = sessionPerson || personnel.find((person: any) => isHarunKaya(personName(person))) || personnel.find((person: any) => isHrManager(person)) || personnel[0] || null
  const activeId = activePerson ? personId(activePerson) : ""
  const activeName = activePerson ? personName(activePerson) : "Harun Kaya"

  const matchedRecords = accessRecords
    .filter((record: any) => {
      const name = recordName(record)
      return (
        (activeId && recordPersonIds(record).includes(activeId)) ||
        (!session && isHarunKaya(name)) ||
        (activeName && normalize(name) === normalize(activeName))
      )
    })
    .sort((a: any, b: any) => recordTime(b) - recordTime(a))
  const accessRecord = matchedRecords[0] || null
  const activeRoleValues = activePerson ? personRoleValues(activePerson) : []
  const activeRole = roles.find((role: any) => roleValues(role).some((value) => activeRoleValues.includes(value))) || null
  const rolePermissions = activeRole?.permissions || activeRole || {}

  const panelAccess =
    boolValue(accessRecord?.panelAccess, accessRecord?.adminAccess, rolePermissions?.panelAccess, rolePermissions?.adminAccess, activePerson?.hasAdminAccess, activePerson?.panelAccess) ?? true

  const mobileAccess =
    boolValue(accessRecord?.mobileAccess, accessRecord?.mobilAccess, rolePermissions?.mobileAccess, rolePermissions?.mobilAccess, activePerson?.hasMobileAccess, activePerson?.mobileAccess, activePerson?.mobilAccess) ?? true

  return { panelAccess, mobileAccess, user: activePerson, record: accessRecord, role: activeRole, session }
}
