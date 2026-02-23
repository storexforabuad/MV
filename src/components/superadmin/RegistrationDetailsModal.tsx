'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    User,
    Phone,
    Mail,
    Building2,
    MapPin,
    Globe,
    CreditCard,
    UserCheck,
    Calendar,
    Zap,
    Tag
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface RegistrationDetailsModalProps {
    registration: any;
    isOpen: boolean;
    onClose: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    isProcessing?: boolean;
}

export default function RegistrationDetailsModal({
    registration,
    isOpen,
    onClose,
    onApprove,
    onReject,
    isProcessing
}: RegistrationDetailsModalProps) {
    if (!registration || !isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-white squircle-32 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 leading-tight">{registration.businessName}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Details</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Owner Contact</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">CEO Name</p>
                                        <p className="font-bold">{registration.ceoName || 'Not Provided'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</p>
                                            <p className="font-bold text-sm">+{registration.whatsapp || registration.ceoPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                            <p className="font-bold text-sm truncate">{registration.email || registration.ceoEmail}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Business Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Business Specs</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-indigo-500" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Category</p>
                                    </div>
                                    <p className="font-black text-slate-900 text-sm uppercase">{registration.storeType || 'General'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag className="w-4 h-4 text-emerald-500" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Tier</p>
                                    </div>
                                    <p className="font-black text-slate-900 text-sm uppercase">{registration.subscriptionTier || 'Lite'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4 text-rose-500" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Location</p>
                                    </div>
                                    <p className="font-black text-slate-900 text-sm">{registration.state}, {registration.country}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Applied</p>
                                    </div>
                                    <p className="font-black text-slate-900 text-sm">{registration.createdAt instanceof Timestamp ? registration.createdAt.toDate().toLocaleDateString() : 'New'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Payment & Referral</h3>
                            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase">Amount Paid</p>
                                        <p className="font-black text-indigo-900 text-lg leading-none">₦{(registration.amountPaid || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Referral Code</p>
                                    <p className="font-black text-indigo-900 flex items-center gap-1 justify-end uppercase">
                                        {registration.referralCode || 'None'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-center">Reference: {registration.paymentReference || 'Direct/Admin-Created'}</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button
                            disabled={isProcessing}
                            onClick={onReject}
                            className="flex-1 py-4 bg-white border border-rose-100 text-rose-500 rounded-2xl font-black text-sm hover:bg-rose-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                            REJECT
                        </button>
                        <button
                            disabled={isProcessing}
                            onClick={onApprove}
                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? 'PROCESSING...' : <>APPROVE & ACTIVATE <UserCheck className="w-5 h-5" /></>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
