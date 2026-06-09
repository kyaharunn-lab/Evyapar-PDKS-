"use client"

import { ensureDefaultAuthSeed } from "@/lib/default-auth-seed"

export const AUTH_SESSION_KEY = "app_auth_session"

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
  return String(value || "").trim().toLocaleLowerCase("tr-TR")
}

function personName(person: any) {
  return (person?.fullName || person?.personnelName || [person?.firstName || person?.name, person?.lastName || person?.surname].filter(Boolean).join(" ") || "").toString()
}

function personId(person: any) {
  return String(person?.id || person?.personnelId || person?.employeeId || person?.userId || "")
}

function personEmail(person: any) {
  return String(person?.email || person?.workEmail || person?.mail || person?.username || "")
}

function personPassword(person: any) {
  return String(person?.password || person?.loginPassword || person?.passcode || person?.pin || "")
}

export function readAuthSession() {
  if (typeof window === "undefined") return null
  ensureDefaultAuthSeed()
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_SESSION_KEY) || "null")
  } catch {
    return null
  }
}

export function findSessionPerson() {
  ensureDefaultAuthSeed()
  const session = readAuthSession()
  if (!session?.personnelId && !session?.email) return null

  const personnel = readArray("app_personnel").filter((person: any) => !person?.isDeleted)
  return personnel.find((person: any) => {
    const sameId = session?.personnelId && personId(person) === String(session.personnelId)
    const sameEmail = session?.email && normalize(personEmail(person)) === normalize(session.email)
    return sameId || sameEmail
  }) || null
}

export function loginWithLocalPersonnel(email: string, password: string) {
  ensureDefaultAuthSeed()
  const personnel = readArray("app_personnel").filter((person: any) => !person?.isDeleted)
  const matched = personnel.find((person: any) => {
    const emailMatch = normalize(personEmail(person)) === normalize(email)
    const storedPassword = personPassword(person)
    const passwordMatch = storedPassword ? storedPassword === password : password === "123456"
    return emailMatch && passwordMatch
  })

  if (!matched) return { ok: false, error: "Email veya şifre hatalı." }

  const session = {
    personnelId: personId(matched),
    email: personEmail(matched),
    name: personName(matched) || personEmail(matched),
    roleId: matched?.roleId || matched?.role || matched?.roleName || matched?.assignedRole || "",
    createdAt: new Date().toISOString(),
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event("app-auth-updated"))
  window.dispatchEvent(new Event("app-access-updated"))
  return { ok: true, session }
}

export function logoutLocalSession() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(AUTH_SESSION_KEY)
  window.dispatchEvent(new Event("app-auth-updated"))
  window.dispatchEvent(new Event("app-access-updated"))
}

