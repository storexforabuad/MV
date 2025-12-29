"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import BookingSheet from '@/components/pitch/BookingSheet';
import PitchCard from '@/components/pitch/PitchCard';
import HorizontalActionBar from '@/components/pitch/HorizontalActionBar';
import BookingsModal from '@/components/pitch/BookingsModal';
import FavouritesModal from '@/components/pitch/FavouritesModal';
import EventsModal from '@/components/pitch/EventsModal';
import ProfileModal from '@/components/pitch/ProfileModal';

interface Props {
  storeId: string;
  initialStoreMeta?: any;
}

export default function SportsStorefrontClient({ storeId, initialStoreMeta }: Props) {
  const [pitches, setPitches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePitch, setActivePitch] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<'bookings' | 'favourites' | 'events' | 'profile' | null>(null);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pitches.map((p) => (
            <PitchCard key={p.id} pitch={p} onBook={(pitch) => setActivePitch(pitch)} />
          ))}
        </div>

        <AnimatePresence>
          {activePitch && (
            <>
              {/* Overlay with fade animation */}
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setActivePitch(null)}
                className="fixed inset-0 z-50 bg-black/40"
              />
              
              {/* Fullscreen Modal */}
              <motion.div
                key="modal"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                {/* Header */}
                <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Book: {activePitch.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Select date and time</p>
                  </div>
                  <motion.button
                    onClick={() => setActivePitch(null)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-semibold flex-shrink-0"
                  >
                    Close
                  </motion.button>
                </header>

                {/* Main Content */}
                <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scrollbar-hide">
                  <BookingSheet storeId={storeId} pitchId={activePitch.id} pricePerSlot={activePitch.pricePerSlot || 0} slotDurationMinutes={activePitch.slotDurationMinutes || 60} availability={activePitch.availability || { start: '08:00', end: '22:00' }} />
                </main>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Horizontal Action Bar */}
        <HorizontalActionBar onOpenModal={setActiveModal} />

        {/* Modals */}
        <BookingsModal isOpen={activeModal === 'bookings'} onClose={() => setActiveModal(null)} />
        <FavouritesModal isOpen={activeModal === 'favourites'} onClose={() => setActiveModal(null)} />
        <EventsModal isOpen={activeModal === 'events'} onClose={() => setActiveModal(null)} />
        <ProfileModal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} />
      </div>
    </div>
  );
}
