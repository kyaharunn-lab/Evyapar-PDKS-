
'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { useFirestoreLocalMirror } from '@/lib/shared-data-sync';

const attendanceSyncTargets = [
  { collectionName: "qrPoints", storageKey: "app_qr_points" },
  { collectionName: "attendance", storageKey: "app_attendance_records" },
  { collectionName: "livePresence", storageKey: "app_live_presence" },
]

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseApp, firestore, auth } = useMemo(() => initializeFirebase(), []);
  useFirestoreLocalMirror(firestore, attendanceSyncTargets);

  return (
    <FirebaseProvider firebaseApp={firebaseApp} firestore={firestore} auth={auth}>
      {children}
    </FirebaseProvider>
  );
};
