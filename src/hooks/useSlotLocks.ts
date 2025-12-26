"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export default function useSlotLocks(storeId?: string, pitchId?: string) {
  const [locks, setLocks] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!storeId) return;

    const col = collection(db, `stores/${storeId}/slotLocks`);
    const filters: any[] = [];
    if (pitchId) filters.push(where('pitchId', '==', pitchId));
    const q = filters.length ? query(col, ...filters, orderBy('createdAt', 'desc')) : query(col, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, any> = {};
      snap.forEach(d => {
        const id = d.id;
        map[id] = { id, ...d.data() };
      });
      setLocks(map);
    }, (err) => {
      console.error('useSlotLocks snapshot error', err);
    });

    return () => unsub();
  }, [storeId, pitchId]);

  return { locks };
}
