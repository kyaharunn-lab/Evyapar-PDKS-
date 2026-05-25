"use client"

const PERSONNEL_STORAGE_KEY = "app_personnel"
const ACCESS_STORAGE_KEY = "app_access_control"
const BRANCHES_STORAGE_KEY = "app_branches"
const ROLES_STORAGE_KEY = "app_roles"
const QR_POINTS_STORAGE_KEY = "app_qr_points"
const DEFAULT_ADMIN_ID = "default-admin-harun-kaya"
const DEFAULT_BRANCH_ID = "default-branch-merkez-magaza"
const DEFAULT_ROLE_ID = "default-role-ik-yoneticisi"
const DEFAULT_QR_POINT_ID = "default-qr-merkez-giris"

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

  let changed = false
  const now = Date.now()
  const personnel = readArray(PERSONNEL_STORAGE_KEY)
  const branches = readArray(BRANCHES_STORAGE_KEY)
  const roles = readArray(ROLES_STORAGE_KEY)
  const accessRecords = readArray(ACCESS_STORAGE_KEY)
  const qrPoints = readArray(QR_POINTS_STORAGE_KEY)

  const branch = {
    id: DEFAULT_BRANCH_ID,
    branchId: DEFAULT_BRANCH_ID,
    branchCode: "MERKEZ",
    code: "MERKEZ",
    branchName: "Merkez Mağaza",
    name: "Merkez Mağaza",
    title: "Merkez Mağaza",
    status: "Active",
    latitude: "",
    longitude: "",
    address: "",
    createdAt: now,
    updatedAt: now,
  }
  const role = {
    id: DEFAULT_ROLE_ID,
    roleId: DEFAULT_ROLE_ID,
    roleCode: "IK-YONETICISI",
    code: "IK-YONETICISI",
    roleName: "İK Yöneticisi",
    name: "İK Yöneticisi",
    title: "İK Yöneticisi",
    permissions: {
      panelAccess: true,
      mobileAccess: true,
      pageAccess: [],
      branchAccess: [DEFAULT_BRANCH_ID],
    },
    panelAccess: true,
    mobileAccess: true,
    status: "Active",
    createdAt: now,
    updatedAt: now,
  }
  const admin = {
    id: DEFAULT_ADMIN_ID,
    name: "Harun",
    surname: "Kaya",
    fullName: "Harun Kaya",
    email: "kyaharunn@gmail.com",
    password: "123456",
    role: DEFAULT_ROLE_ID,
    roleId: DEFAULT_ROLE_ID,
    roleName: "İK Yöneticisi",
    branchId: DEFAULT_BRANCH_ID,
    branchName: "Merkez Mağaza",
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
    roleId: DEFAULT_ROLE_ID,
    roleName: "İK Yöneticisi",
    panelAccess: true,
    mobileAccess: true,
    branchAccess: [DEFAULT_BRANCH_ID],
    status: "Active",
    createdAt: now,
    updatedAt: now,
  }
  const qrPoint = {
    id: DEFAULT_QR_POINT_ID,
    pointName: "Merkez Giriş QR",
    name: "Merkez Giriş QR",
    branchId: DEFAULT_BRANCH_ID,
    branchName: "Merkez Mağaza",
    pointType: "EntryExit",
    qrCode: "EVYAPAR-MERKEZ-GIRIS-QR",
    status: "Active",
    createdAt: now,
    updatedAt: now,
    lastUsedAt: "",
  }

  if (branches.length === 0) {
    window.localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify([branch]))
    changed = true
  }

  if (roles.length === 0) {
    window.localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify([role]))
    changed = true
  }

  if (personnel.length === 0) {
    window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify([admin]))
    changed = true
  } else {
    const hasDefaultAdmin = personnel.some((person: any) => person?.id === DEFAULT_ADMIN_ID)
    if (hasDefaultAdmin) {
      const nextPersonnel = personnel.map((person: any) => {
        if (person?.id !== DEFAULT_ADMIN_ID) return person
        return {
          ...person,
          branchId: person?.branchId || DEFAULT_BRANCH_ID,
          branchName: person?.branchName || "Merkez Mağaza",
          role: person?.role || DEFAULT_ROLE_ID,
          roleId: person?.roleId || DEFAULT_ROLE_ID,
          roleName: person?.roleName || "İK Yöneticisi",
          panelAccess: person?.panelAccess ?? true,
          mobileAccess: person?.mobileAccess ?? true,
          hasAdminAccess: person?.hasAdminAccess ?? true,
          hasMobileAccess: person?.hasMobileAccess ?? true,
        }
      })
      if (JSON.stringify(nextPersonnel) !== JSON.stringify(personnel)) {
        window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(nextPersonnel))
        changed = true
      }
    }
  }

  if (accessRecords.length === 0) {
    window.localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify([accessRecord]))
    changed = true
  }

  if (qrPoints.length === 0) {
    window.localStorage.setItem(QR_POINTS_STORAGE_KEY, JSON.stringify([qrPoint]))
    changed = true
  }

  if (changed) {
    window.dispatchEvent(new Event("app-access-updated"))
  }
}
