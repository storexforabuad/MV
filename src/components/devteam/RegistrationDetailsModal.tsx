'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Phone, Mail, Building2, Store, CreditCard,
    Calendar, CheckCircle2, Clock, MapPin, Globe,
    Briefcase, PlusCircle, X
} from 'lucide-react';
import { Naira } from '@/components/common/Naira';
import Image from 'next/image';

export interface Registration {
    id: string;
    ceoName: string;
    ceoPhone: string;
    ceoEmail: string;
    ceoImageUrl?: string;
    businessName: string;
    businessPhone: string;
    businessDescription?: string;
    storeType: string;
    subscriptionTier: string;
    amountPaid: number;
    status: 'pending' | 'completed' | 'active' | 'trial';
    createdAt: any;
    country?: string;
    state?: string;
    referralCode?: string;
}

interface RegistrationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    registration: Registration | undefined;
    onCreateStore: (reg: Registration) => void;
}

export default function RegistrationDetailsModal({
    isOpen,
    onClose,
    registration,
    onCreateStore
}: RegistrationDetailsModalProps) {

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    const modalVariants = {
        hidden: { opacity: 0, y: '100%' },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '100%' }
    };

    if (!registration) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white h-screen w-screen"
                    initial="hidden" animate="visible" exit="exit"
                    variants={modalVariants}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                >
                    {/* --- Header --- */}
                    <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Registration Details
                                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {registration.status}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Review and approve vendor application</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                        </button>
                    </header>

                    {/* --- Main Scrollable Content --- */}
                    <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Left Column: CEO Profile */}
                            <div className="md:col-span-1 space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mb-4 relative">
                                        {registration.ceoImageUrl ? (
                                            <Image
                                                src={registration.ceoImageUrl}
                                                alt={registration.ceoName}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                <User className="w-12 h-12 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{registration.ceoName}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">CEO / Founder</p>

                                    <div className="w-full mt-6 space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <Mail className="w-4 h-4 text-emerald-500" />
                                            <span className="truncate">{registration.ceoEmail}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <Phone className="w-4 h-4 text-emerald-500" />
                                            <span>{registration.ceoPhone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                    <h4 className="font-bold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" /> Payment Status
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-emerald-700 dark:text-emerald-300">Amount Paid</span>
                                            <span className="text-xl font-black text-emerald-900 dark:text-white">
                                                <Naira />{registration.amountPaid.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-emerald-700 dark:text-emerald-300">Plan</span>
                                            <span className="px-2 py-1 bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-white text-xs font-bold rounded uppercase">
                                                {registration.status === 'trial' ? 'Free Trial' : registration.subscriptionTier}
                                            </span>
                                        </div>
                                        <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800/30">
                                            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Payment Verified via Paystack
                                            </div>
                                            <p className="text-[10px] text-emerald-500/70 mt-1 font-mono">Ref: {registration.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Business Details */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-blue-500" /> Business Information
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Business Name</label>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-white">{registration.businessName}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Store Type</label>
                                            <div className="flex items-center gap-2">
                                                <Store className="w-4 h-4 text-slate-500" />
                                                <p className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{registration.storeType}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">WhatsApp Contact</label>
                                            <p className="text-base font-medium text-slate-700 dark:text-slate-300">{registration.businessPhone}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Location</label>
                                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <span>{registration.state}, {registration.country}</span>
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                                {registration.businessDescription || "No description provided."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-purple-500" /> Application Metadata
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 block mb-1">Submitted On</span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {registration.createdAt?.toDate ? registration.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 block mb-1">Registration ID</span>
                                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                                {registration.id}
                                            </span>
                                        </div>
                                        {registration.referralCode && (
                                            <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                                <span className="text-slate-500 dark:text-slate-400 block mb-1">Referral Code</span>
                                                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50 inline-block">
                                                    {registration.referralCode}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* --- Footer --- */}
                    <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                        <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button
                                onClick={onClose}
                                className="w-full sm:flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors order-2 sm:order-1"
                            >
                                Close
                            </button>
                            <motion.button
                                onClick={() => onCreateStore(registration)}
                                className="w-full sm:flex-[2] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl flex items-center justify-center gap-2 order-1 sm:order-2"
                                whileTap={{ scale: 0.98 }}
                            >
                                <PlusCircle className="w-5 h-5" />
                                Approve & Create Store
                            </motion.button>
                        </div>
                    </footer>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
