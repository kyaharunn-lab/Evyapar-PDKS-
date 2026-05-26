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
  return ["branches", "personnel", "leaveRequests"].includes(collectionName)
}

function logFirestoreDebug(message: string, payload?: Record<string, any>) {
  if (typeof window === "undefined") return
  console.info(`[Firestore sync debug] ${message}`, payload || {})
}

function warnFirestoreDebug(message: string, payload?: Record<string, any>) {
  if (typeof window === "undefined") return
  console.warn(`[Firestore sync debug] ${message}`, payload || {})
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
    return
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
  } catch (error) {
    if (shouldDebugCollection(collectionName)) {
      warnFirestoreDebug("write error", {
        collectionPath: collectionName,
        documentPath: path,
        recordId: id,
        errorMessage: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
      })
    }
    console.warn(`Firestore ${collectionName} write failed; localStorage fallback kept.`, error)
  }
}

export async function deleteSharedRecord(db: Firestore | null | undefined, collectionName: string, id: string) {
  if (!db || !id) return
  try {
    await deleteDoc(doc(db, collectionName, String(id)))
  } catch (error) {
    console.warn(`Firestore ${collectionName} delete failed; localStorage fallback kept.`, error)
  }
}
