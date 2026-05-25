"use client"

const PERSONNEL_STORAGE_KEY = "app_personnel"
const ACCESS_STORAGE_KEY = "app_access_control"

function readArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function ensureDefaultAuthSeed() {
  if (typeof window === "undefined") return

  const personnel = readArray(PERSONNEL_STORAGE_KEY)
  if (personnel.length > 0) return

  const now = Date.now()
  const admin = {
    id: "default-admin-harun-kaya",
    name: "Harun",
    surname: "Kaya",
    fullName: "Harun Kaya",
    email: "kyaharunn@gmail.com",
    password: "123456",
    role: "İK Yöneticisi",
    roleName: "İK Yöneticisi",
    status: "Active",
    panelAccess: true,
    mobileAccess: true,
    hasAdminAccess: true,
    hasMobileAccess: true,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  }
  const accessRecord = {
    id: "access-default-admin-harun-kaya",
    personnelId: admin.id,
    roleId: "İK Yöneticisi",
    roleName: "İK Yöneticisi",
    panelAccess: true,
    mobileAccess: true,
    status: "Active",
    createdAt: now,
    updatedAt: now,
  }

  window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify([admin]))
  window.localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify([accessRecord]))
  window.dispatchEvent(new Event("app-access-updated"))
}
