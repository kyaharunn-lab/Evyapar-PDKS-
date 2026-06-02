"use client"

import * as React from "react"
import type { Firestore } from "firebase/firestore"
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore"

type SyncTarget = {
  collectionName: string
  storageKey: string
}

function recordId(record: any) {
  return String(record?.id || record?.uid || record?.code || record?.branchCode || record?.personnelCode || record?.qrCode || `record-${Date.now()}`)
}

function shouldDebugCollection(collectionName: string) {
  return ["branches", "personnel", "qrPoints", "shifts", "attendance", "livePresence", "leaveRequests"].includes(collectionName)
}

function logFirestoreDebug(message: string, payload?: Record<string, any>) {
  if (typeof window === "undefined") return
  console.info(`[Firestore sync debug] ${message}`, payload || {})
}

function warnFirestoreDebug(message: string, payload?: Record<string, any>) {
  if (typeof window === "undefined") return
  console.warn(`[Firestore sync debug] ${message}`, payload || {})
}

function rememberWriteStatus(collectionName: string, status: "success" | "error", payload?: Record<string, any>) {
  if (typeof window === "undefined" || !["personnel", "branches"].includes(collectionName)) return
  try {
    const previous = JSON.parse(window.localStorage.getItem("app_firestore_debug") || "{}")
    const keyPrefix = collectionName === "personnel" ? "lastPersonnelWrite" : "lastBranchWrite"
    window.localStorage.setItem("app_firestore_debug", JSON.stringify({
      ...previous,
      [`${keyPrefix}Status`]: status,
      [`${keyPrefix}At`]: new Date().toISOString(),
      [`${keyPrefix}Path`]: payload?.documentPath || "",
      [`${keyPrefix}Error`]: payload?.errorMessage || "",
    }))
    window.dispatchEvent(new Event("app-firestore-debug-updated"))
  } catch {
  }
}

export function useFirestoreLocalMirror(db: Firestore | null | undefined, targets: SyncTarget[], onUpdate?: () => void) {
  React.useEffect(() => {
    if (!db || typeof window === "undefined") return

    const unsubscribers = targets.map((target) => {
      try {
        if (shouldDebugCollection(target.collectionName)) {
          logFirestoreDebug("listener starting", {
            collectionPath: target.collectionName,
            storageKey: target.storageKey,
          })
        }

        return onSnapshot(
          collection(db, target.collectionName),
          (snapshot) => {
            const docs = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))
            if (shouldDebugCollection(target.collectionName)) {
              logFirestoreDebug("realtime snapshot", {
                collectionPath: target.collectionName,
                storageKey: target.storageKey,
                snapshotCount: snapshot.size,
                localWriteCount: docs.length,
              })
            }
            window.localStorage.setItem(target.storageKey, JSON.stringify(docs))
            window.dispatchEvent(new Event(`${target.storageKey}-updated`))
            window.dispatchEvent(new StorageEvent("storage", { key: target.storageKey }))
            if (target.storageKey === "app_attendance_records") window.dispatchEvent(new Event("app-attendance-records-updated"))
            if (target.storageKey === "app_live_presence") window.dispatchEvent(new Event("app-live-presence-updated"))
            onUpdate?.()
          },
          (error) => {
            if (shouldDebugCollection(target.collectionName)) {
              warnFirestoreDebug("listener error", {
                collectionPath: target.collectionName,
                storageKey: target.storageKey,
                errorMessage: error?.message || String(error),
                code: (error as any)?.code,
              })
            }
            console.warn(`Firestore ${target.collectionName} mirror failed; localStorage fallback active.`, error)
          }
        )
      } catch (error) {
        if (shouldDebugCollection(target.collectionName)) {
          warnFirestoreDebug("listener unavailable", {
            collectionPath: target.collectionName,
            storageKey: target.storageKey,
            errorMessage: error instanceof Error ? error.message : String(error),
          })
        }
        console.warn(`Firestore ${target.collectionName} mirror unavailable; localStorage fallback active.`, error)
        return () => {}
      }
    })

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [db, onUpdate, targets])
}

export async function writeSharedRecord(db: Firestore | null | undefined, collectionName: string, record: any) {
  if (!db || !record) {
    if (shouldDebugCollection(collectionName)) {
      warnFirestoreDebug("write skipped", {
        collectionPath: collectionName,
        hasDb: Boolean(db),
        hasRecord: Boolean(record),
        recordId: record ? recordId(record) : "",
      })
    }
    rememberWriteStatus(collectionName, "error", {
      errorMessage: !db ? "Firestore db instance yok." : "Record yok.",
    })
    return false
  }

  const id = recordId(record)
  const path = `${collectionName}/${id}`

  try {
    if (shouldDebugCollection(collectionName)) {
      logFirestoreDebug("write starting", {
        collectionPath: collectionName,
        documentPath: path,
        recordId: id,
      })
    }

    await setDoc(doc(db, collectionName, id), record, { merge: true })

    if (shouldDebugCollection(collectionName)) {
      logFirestoreDebug("write success", {
        collectionPath: collectionName,
        documentPath: path,
        recordId: id,
      })
    }
    rememberWriteStatus(collectionName, "success", { documentPath: path })
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (shouldDebugCollection(collectionName)) {
      warnFirestoreDebug("write error", {
        collectionPath: collectionName,
        documentPath: path,
        recordId: id,
        errorMessage,
        code: (error as any)?.code,
      })
    }
    rememberWriteStatus(collectionName, "error", { documentPath: path, errorMessage })
    console.warn(`Firestore ${collectionName} write failed; localStorage fallback kept.`, error)
    return false
  }
}

export async function deleteSharedRecord(db: Firestore | null | undefined, collectionName: string, id: string) {
  if (!db || !id) {
    rememberWriteStatus(collectionName, "error", {
      errorMessage: !db ? "Firestore db instance yok." : "Record id yok.",
    })
    return
  }
  try {
    await deleteDoc(doc(db, collectionName, String(id)))
    rememberWriteStatus(collectionName, "success", { documentPath: `${collectionName}/${id}` })
  } catch (error) {
    rememberWriteStatus(collectionName, "error", {
      documentPath: `${collectionName}/${id}`,
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    console.warn(`Firestore ${collectionName} delete failed; localStorage fallback kept.`, error)
  }
}
