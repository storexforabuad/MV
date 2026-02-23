'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ClipboardCheck, ArrowRight, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJumpToApply: () => void;
}

export default function NotificationModal({ isOpen, onClose, onJumpToApply }: NotificationModalProps) {
    const [pendingRegs, setPendingRegs] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        const q = query(
            collection(db, 'registrations'),
            where('status', 'in', ['pending', 'active']),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPendingRegs(regs);
        });

        return () => unsubscribe();
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-md bg-white squircle-32 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 leading-tight">Notifications</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Alerts</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {pendingRegs.length > 0 ? (
                                pendingRegs.map((reg) => (
                                    <div
                                        key={reg.id}
                                        className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 group hover:border-indigo-100 transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-500 shrink-0">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">
                                                {reg.businessName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                                                    {reg.subscriptionTier || 'Lite'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400">
                                                    {reg.createdAt instanceof Timestamp ? reg.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                onJumpToApply();
                                                onClose();
                                            }}
                                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center space-y-3">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                                        <ClipboardCheck className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">No new notifications</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    onJumpToApply();
                                    onClose();
                                }}
                                className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                View Pipeline <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
