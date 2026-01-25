'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Building2, ChevronDown } from 'lucide-react';

interface PayoutStepProps {
    data: any;
    updateData: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function PayoutStep({ data, updateData, onNext, onBack }: PayoutStepProps) {
    const [banks, setBanks] = useState<any[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');

    useEffect(() => {
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        setLoadingBanks(true);
        try {
            const res = await fetch('/api/paystack/banks');
            const result = await res.json();
            // Check both structures just in case
            if (result.banks) {
                setBanks(result.banks);
            } else if (result.data) {
                setBanks(result.data);
            }
        } catch (err) {
            console.error('Failed to fetch banks', err);
        } finally {
            setLoadingBanks(false);
        }
    };

    const verifyAccount = async () => {
        if (!data.bankCode || data.accountNumber.length < 10) return;

        setVerifying(true);
        setError('');

        // Simulate verification for now or implement real endpoint
        try {
            // Mock verification
            await new Promise(resolve => setTimeout(resolve, 1500));
            updateData({ accountName: 'VERIFIED BUSINESS NAME' }); // Mock result
        } catch (err) {
            setError('Could not verify account');
        } finally {
            setVerifying(false);
        }
    };

    useEffect(() => {
        if (data.bankCode && data.accountNumber.length === 10) {
            verifyAccount();
        }
    }, [data.bankCode, data.accountNumber]);

    const handleNext = () => {
        if (!data.email) {
            setEmailError('Email is required');
            return;
        }
        if (data.accountName) {
            onNext();
        } else {
            setError('Please verify your account first');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">Where should we send your earnings?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    We automatically create a subaccount for you. You get paid directly.
                </p>
            </div>

            <div className="space-y-6 flex-1">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl mb-6">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed">
                        We'll use these details to create your automated payout subaccount. You'll receive your earnings directly to this bank account.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                            Email Address
                            {emailError && <span className="text-rose-500">{emailError}</span>}
                        </label>
                        <input
                            value={data.email}
                            onChange={(e) => {
                                updateData({ email: e.target.value });
                                setEmailError('');
                            }}
                            placeholder="you@example.com"
                            type="email"
                            className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-4 py-3.5 font-medium outline-none transition-all ${emailError ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                }`}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Name</label>
                            <div className="relative">
                                <select
                                    value={data.bankCode}
                                    onChange={(e) => {
                                        const bank = banks.find(b => b.code === e.target.value);
                                        updateData({ bankCode: e.target.value, bankName: bank?.name || '' });
                                    }}
                                    disabled={loadingBanks}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none disabled:opacity-50"
                                >
                                    <option value="">{loadingBanks ? 'Loading banks...' : 'Select Bank'}</option>
                                    {banks.map((bank) => (
                                        <option key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Number</label>
                            <input
                                value={data.accountNumber}
                                onChange={(e) => updateData({ accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                placeholder="0123456789"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all tracking-widest"
                            />
                        </div>
                    </div>
                </div>

                {/* Verification Status */}
                <div className="min-h-[80px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {verifying ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 text-emerald-500 font-bold text-sm"
                            >
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verifying account details...
                            </motion.div>
                        ) : data.accountName ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-sm shadow-emerald-500/5"
                            >
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Verified Account Name</div>
                                    <div className="font-black text-slate-900 dark:text-white text-lg leading-tight uppercase">{data.accountName}</div>
                                </div>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-rose-500 font-bold text-sm bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl"
                            >
                                {error}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
                <button
                    onClick={onBack}
                    className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={handleNext}
                    disabled={!data.accountName || !data.email}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white h-12 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                    Review Details
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
