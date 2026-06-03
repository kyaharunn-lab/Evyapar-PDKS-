
'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { useFirestoreLocalMirror } from '@/lib/shared-data-sync';

const attendanceSyncTargets = [
  { collectionName: "branches", storageKey: "app_branches" },
  { collectionName: "personnel", storageKey: "app_personnel" },
  { collectionName: "qrPoints", storageKey: "app_qr_points" },
  { collectionName: "shifts", storageKey: "app_shifts" },
  { collectionName: "attendance", storageKey: "app_attendance_records" },
  { collectionName: "livePresence", storageKey: "app_live_presence" },
]

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseApp, firestore, auth, storage } = useMemo(() => initializeFirebase(), []);
  useFirestoreLocalMirror(firestore, attendanceSyncTargets);

  return (
    <FirebaseProvider firebaseApp={firebaseApp} firestore={firestore} auth={auth} storage={storage}>
      {children}
    </FirebaseProvider>
  );
};
