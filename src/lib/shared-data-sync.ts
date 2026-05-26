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

export function useFirestoreLocalMirror(db: Firestore | null | undefined, targets: SyncTarget[], onUpdate?: () => void) {
  React.useEffect(() => {
    if (!db || typeof window === "undefined") return

    const unsubscribers = targets.map((target) => {
      try {
        return onSnapshot(
          collection(db, target.collectionName),
          (snapshot) => {
            const docs = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))
            window.localStorage.setItem(target.storageKey, JSON.stringify(docs))
            window.dispatchEvent(new Event(`${target.storageKey}-updated`))
            onUpdate?.()
          },
          (error) => {
            console.warn(`Firestore ${target.collectionName} mirror failed; localStorage fallback active.`, error)
          }
        )
      } catch (error) {
        console.warn(`Firestore ${target.collectionName} mirror unavailable; localStorage fallback active.`, error)
        return () => {}
      }
    })

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [db, onUpdate, targets])
}

export async function writeSharedRecord(db: Firestore | null | undefined, collectionName: string, record: any) {
  if (!db || !record) return
  try {
    await setDoc(doc(db, collectionName, recordId(record)), record, { merge: true })
  } catch (error) {
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
