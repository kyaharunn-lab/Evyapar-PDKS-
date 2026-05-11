
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData,
  FirestoreError 
} from 'firebase/firestore';

function areDocsEqual<T>(previous: T[], next: T[]) {
  if (previous.length !== next.length) return false;

  return previous.every((item, index) => {
    const nextItem = next[index];
    return JSON.stringify(item) === JSON.stringify(nextItem);
  });
}

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!query) {
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        if (!mountedRef.current) return;

        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        } as T));

        setData((previous) => areDocsEqual(previous, docs) ? previous : docs);
        setLoading((previous) => previous ? false : previous);
        setError(null);
      },
      (err) => {
        if (!mountedRef.current) return;

        console.error('Firestore useCollection error:', err);
        setError(err);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [query]);

  return { data, loading, error };
}
