'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Phone,
    Mail,
    Building2,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Clock,
    ShieldCheck
} from 'lucide-react';
import { fulfillRegistration, rejectRegistration } from '@/app/actions/superadminActions';

export default function RegistrationPipeline() {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'registrations'),
            where('status', 'in', ['pending', 'active']), // active means paid but not fulfilled
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRegistrations(regs);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (regId: string) => {
        if (!confirm('Are you sure you want to approve and create this store?')) return;
        setProcessingId(regId);
        const result = await fulfillRegistration(regId);
        setProcessingId(null);
        if (!result.success) alert(`Error: ${result.error}`);
    };

    const handleReject = async (regId: string) => {
        const reason = prompt('Reason for rejection?');
        if (!reason) return;
        setProcessingId(regId);
        const result = await rejectRegistration(regId, reason);
        setProcessingId(null);
        if (!result.success) alert(`Error: ${result.error}`);
    };

    if (isLoading) return <div className="text-center py-20 animate-pulse text-slate-400">Loading pipeline...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pending Pipeline</h2>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">
                    {registrations.length} APPLICATIONS
                </span>
            </div>

            {registrations.length === 0 ? (
                <div className="bg-white squircle-32 p-12 text-center border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-medium">Pipeline is empty. No new applications.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {registrations.map((reg) => (
                            <motion.div
                                key={reg.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white squircle-32 p-6 shadow-soft border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 leading-tight mb-1">{reg.businessName}</h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> {reg.subscriptionTier}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {reg.createdAt instanceof Timestamp ? reg.createdAt.toDate().toLocaleDateString() : 'New'}</span>
                                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase">Paid: ₦{(reg.amountPaid || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={!!processingId}
                                        onClick={() => handleReject(reg.id)}
                                        className="flex-1 md:flex-none p-3 rounded-2xl border border-red-50 text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                    <button
                                        disabled={!!processingId}
                                        onClick={() => handleApprove(reg.id)}
                                        className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {processingId === reg.id ? 'Fulfilling...' : <>Approve <ChevronRight className="w-5 h-5" /></>}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
