"use client"

import { deleteApp, initializeApp } from "firebase/app"
import type { Auth } from "firebase/auth"
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth"
import type { Firestore } from "firebase/firestore"
import { collection, getDocs, query, where } from "firebase/firestore"
import { firebaseConfig } from "@/firebase/config"

const ACCESS_SESSION_KEY = "app_auth_session"

type PersonnelRecord = Record<string, any> & { id?: string }

function readArray(key: string) {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeSession(personnel: any) {
  const sessionUser = {
    id: (personnel?.id || personnel?.uid || personnel?.authUid || personnel?.email || "").toString(),
    authUid: personnel?.authUid || "",
    email: personnel?.email || "",
    name: personnel?.fullName || [personnel?.name || personnel?.firstName, personnel?.surname || personnel?.lastName].filter(Boolean).join(" ") || personnel?.email || "Kullanici",
    roleName: personnel?.roleName || personnel?.role || personnel?.title || "",
    panelAccess: Boolean(personnel?.panelAccess ?? personnel?.hasAdminAccess),
    mobileAccess: Boolean(personnel?.mobileAccess ?? personnel?.hasMobileAccess),
    pageAccess: Array.isArray(personnel?.pageAccess) ? personnel.pageAccess : [],
    branchAccess: Array.isArray(personnel?.branchAccess) ? personnel.branchAccess : [],
  }
  window.localStorage.setItem(ACCESS_SESSION_KEY, JSON.stringify({
    user: sessionUser,
    panelAccess: Boolean(personnel?.panelAccess ?? personnel?.hasAdminAccess),
    mobileAccess: Boolean(personnel?.mobileAccess ?? personnel?.hasMobileAccess),
    loggedInAt: new Date().toISOString(),
    source: "firebase-auth",
  }))
  window.dispatchEvent(new Event("app-auth-updated"))
  window.dispatchEvent(new Event("app-access-updated"))
  return sessionUser
}

async function findFirestorePersonnel(db: Firestore, email: string, authUid: string): Promise<PersonnelRecord | null> {
  const personnelRef = collection(db, "personnel")
  const byUid = authUid ? await getDocs(query(personnelRef, where("authUid", "==", authUid))) : null
  if (byUid && !byUid.empty) return { ...byUid.docs[0].data(), id: byUid.docs[0].id }

  const byEmail = await getDocs(query(personnelRef, where("email", "==", email)))
  if (!byEmail.empty) return { ...byEmail.docs[0].data(), id: byEmail.docs[0].id }

  return null
}

export async function loginWithFirebasePersonnel(auth: Auth | null | undefined, db: Firestore | null | undefined, email: string, password: string) {
  if (!auth || !db) return { ok: false, error: "Firebase Auth hazir degil." }

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
    const personnel = await findFirestorePersonnel(db, credential.user.email || email.trim(), credential.user.uid)
    if (!personnel) return { ok: false, error: "Firestore personnel kaydi bulunamadi." }

    const nextPersonnel = {
      ...personnel,
      authUid: personnel.authUid || credential.user.uid,
      email: personnel.email || credential.user.email || email.trim(),
    }
    window.localStorage.setItem("app_personnel", JSON.stringify([
      nextPersonnel,
      ...readArray("app_personnel").filter((item: any) => (item?.id || "").toString() !== (nextPersonnel?.id || "").toString()),
    ]))

    return { ok: true, user: writeSession(nextPersonnel), personnel: nextPersonnel }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Firebase Auth girisi basarisiz." }
  }
}

export async function createFirebasePersonnelAuthUser(email: string, password: string) {
  const appName = `personnel-auth-create-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const app = initializeApp(firebaseConfig, appName)

  try {
    const secondaryAuth = getAuth(app)
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password)
    return { ok: true, uid: credential.user.uid, error: "" }
  } catch (error) {
    return { ok: false, uid: "", error: error instanceof Error ? error.message : "Firebase Auth kullanicisi olusturulamadi." }
  } finally {
    await deleteApp(app).catch(() => undefined)
  }
}
