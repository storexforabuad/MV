'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Store,
    User,
    ArrowRight,
    ExternalLink,
    Ghost,
    ShieldCheck,
    Zap,
    Clock
} from 'lucide-react';
import { StoreMeta } from '@/types/store';

export default function TenantDirectory() {
    const [stores, setStores] = useState<StoreMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'stores'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const storeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreMeta));
            setStores(storeData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredStores = stores.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="text-center py-20 animate-pulse text-slate-400 font-bold uppercase tracking-widest">Scanning tenants...</div>;

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search stores, vendors, or IDs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white squircle-32 pl-14 pr-6 py-5 shadow-soft border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                    {filteredStores.map((store) => (
                        <motion.div
                            key={store.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white squircle-32 p-6 shadow-soft border border-slate-100 hover:border-indigo-100 transition-colors group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors overflow-hidden relative">
                                        {store.logo ? (
                                            <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 leading-tight">{store.name}</h3>
                                        <p className="text-xs font-bold text-slate-400 truncate max-w-[150px]">ID: {store.id}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${store.subscriptionStatus === 'active'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {store.subscriptionStatus || 'TRIAL'}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Views</span>
                                    <span className="text-sm font-black text-slate-700">{store.totalViews || 0}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Orders</span>
                                    <span className="text-sm font-black text-slate-700">{store.totalOrders || 0}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Tier</span>
                                    <span className="text-[10px] font-black text-indigo-600 uppercase">{(store.subscriptionTier || 'Basic').substring(0, 5)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={`/${store.id}`}
                                    target="_blank"
                                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" /> Storefront
                                </a>
                                <a
                                    href={`/admin/${store.id}`}
                                    target="_blank"
                                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Ghost className="w-4 h-4" /> Ghost Access
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
