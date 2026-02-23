'use client';

import { useState, useEffect } from 'react';
import { getBillingStats } from '@/app/actions/superadminActions';
import { motion } from 'framer-motion';
import {
    CreditCard,
    TrendingUp,
    AlertCircle,
    Clock,
    ChevronRight,
    ShieldCheck,
    Zap
} from 'lucide-react';

export default function BillingWatchdog() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const result = await getBillingStats();
            if (result.success) setData(result);
            setIsLoading(false);
        };
        fetch();
    }, []);

    if (isLoading) return <div className="text-center py-20 animate-pulse text-slate-400">Auditing ledgers...</div>;

    return (
        <div className="space-y-6">
            {/* Revenue Snapshot */}
            <div className="bg-indigo-600 squircle-32 p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10">
                    <TrendingUp className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                    <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-2">Estimated Monthly Sub Revenue</p>
                    <h2 className="text-4xl font-black mb-4">₦{(data?.estMonthlyRev || 0).toLocaleString()}</h2>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 px-3 py-1 rounded-lg text-xs font-black">
                            {data?.activeSubs || 0} ACTIVE SUBS
                        </div>
                    </div>
                </div>
            </div>

            {/* Expiry Watchlist */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" /> Expiry Watchlist
                    </h3>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Next 7 Days</span>
                </div>

                {(data?.expiringSoon || []).length === 0 ? (
                    <div className="bg-white squircle-32 p-12 text-center border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-medium italic">No accounts expiring in the next 7 days.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {data.expiringSoon.map((store: any) => (
                            <motion.div
                                key={store.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white squircle-24 p-5 shadow-soft border border-slate-100 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-sm leading-tight">{store.name}</h4>
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                                            Expiring {(store.subscriptionTrialEndsAt || store.subscriptionNextBillingDate).toDate().toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                    {store.subscriptionTier || 'Lite'} <ChevronRight className="w-3 h-3" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
