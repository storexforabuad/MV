'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';

export default function GlobalAnnouncement() {
    const [announcement, setAnnouncement] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'platform', 'broadcast'), (doc) => {
            if (doc.exists() && doc.data().active) {
                setAnnouncement(doc.data());
                setIsVisible(true);
            } else {
                setAnnouncement(null);
            }
        });
        return () => unsub();
    }, []);

    if (!announcement || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-indigo-600 text-white relative z-[100]"
            >
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest truncate">
                            {announcement.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
