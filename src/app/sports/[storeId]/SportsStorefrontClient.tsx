"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import BookingSheet from '@/components/pitch/BookingSheet';

interface Props {
  storeId: string;
  initialStoreMeta?: any;
}

export default function SportsStorefrontClient({ storeId, initialStoreMeta }: Props) {
  const [pitches, setPitches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePitch, setActivePitch] = useState<any | null>(null);

  useEffect(() => {
    if (!storeId) return;
    const pitchesRef = collection(db, `stores/${storeId}/pitches`);
    const q = query(pitchesRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setPitches(items);
      setLoading(false);
    }, (err) => {
      console.error('Failed to subscribe to pitches', err);
      setLoading(false);
    });

    return () => unsub();
  }, [storeId]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">{initialStoreMeta?.name || 'PitchPerfect'}</h1>
          <p className="text-sm text-gray-600">Book pitches and courts</p>
        </header>

        {loading && <div>Loading pitches…</div>}

        {!loading && pitches.length === 0 && (
          <div className="p-6 bg-white rounded">No pitches yet. Vendors can add pitches from the admin.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pitches.map((p) => (
            <div key={p.id} className="p-4 border rounded bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-gray-600">₦{(p.pricePerSlot || 0).toFixed(0)} / slot</p>
                </div>
                <div>
                  <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => setActivePitch(p)}>Book</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activePitch && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
            <div className="w-full max-w-3xl bg-white rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Book: {activePitch.name}</h4>
                <button onClick={() => setActivePitch(null)} className="px-2 py-1">Close</button>
              </div>
              <BookingSheet storeId={storeId} pitchId={activePitch.id} pricePerSlot={activePitch.pricePerSlot || 0} slotDurationMinutes={activePitch.slotDurationMinutes || 60} availability={activePitch.availability || { start: '08:00', end: '22:00' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
