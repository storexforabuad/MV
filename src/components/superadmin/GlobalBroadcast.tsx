'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
    Megaphone,
    Send,
    Trash2,
    AlertCircle,
    Clock,
    Layout
} from 'lucide-react';

export default function GlobalBroadcast() {
    const [message, setMessage] = useState('');
    const [currentBroadcast, setCurrentBroadcast] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'platform', 'broadcast'), (doc) => {
            if (doc.exists()) {
                setCurrentBroadcast(doc.data());
            } else {
                setCurrentBroadcast(null);
            }
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    const handlePublish = async () => {
        if (!message.trim()) return;
        setIsPublishing(true);
        try {
            await setDoc(doc(db, 'platform', 'broadcast'), {
                message: message.trim(),
                publishedAt: serverTimestamp(),
                active: true,
                type: 'announcement'
            });
            setMessage('');
        } catch (error) {
            console.error('Publish failed:', error);
        }
        setIsPublishing(false);
    };

    const handleClear = async () => {
        if (!confirm('Clear the current broadcast for everyone?')) return;
        await setDoc(doc(db, 'platform', 'broadcast'), { active: false });
    };

    if (isLoading) return <div className="text-center py-20 animate-pulse text-slate-400">Syncing waves...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white squircle-32 p-8 shadow-soft border border-slate-100 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50" />

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Global Broadcast</h2>
                    </div>

                    <p className="text-slate-500 text-sm font-medium">Publish a message that will appear at the top of every vendor's dashboard.</p>

                    <div className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your platform-wide announcement..."
                            className="w-full h-32 bg-slate-50 squircle-24 p-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 border border-slate-100 transition-all font-medium text-slate-900 resize-none"
                        />
                    </div>

                    <button
                        onClick={handlePublish}
                        disabled={isPublishing || !message.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
                    >
                        {isPublishing ? 'Transmitting...' : <><Send className="w-5 h-5" /> BROADCAST NOW</>}
                    </button>
                </div>
            </div>

            {currentBroadcast?.active && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 squircle-24 p-6 flex items-start justify-between gap-4"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-200 rounded-lg text-amber-700">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-amber-900 font-bold leading-tight">{currentBroadcast.message}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase mt-2">
                                <Clock className="w-3 h-3" /> Live for all vendors
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-2 text-amber-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </motion.div>
            )}

            {/* Preview Section */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Vendor View Preview</h3>
                <div className="bg-slate-900 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <div className="flex-1 bg-white/10 h-6 rounded-lg overflow-hidden flex items-center px-4">
                        <p className="text-[10px] text-white/80 font-bold truncate">
                            {currentBroadcast?.active ? currentBroadcast.message : "No active broadcast"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
