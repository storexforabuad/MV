'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Store, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createCommissionStore } from '@/app/actions/startActions';

interface SummaryStepProps {
    data: any;
    referralCode: string;
    onBack: () => void;
}

export default function SummaryStep({ data, referralCode, onBack }: SummaryStepProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreateStore = async () => {
        setLoading(true);
        try {
            const result = await createCommissionStore({ ...data, referralCode });
            if (result.success) {
                router.push(`/start/${referralCode}/success?storeId=${result.storeId}`);
            } else {
                console.error(result.error);
                // Handle error (show toast etc)
            }
        } catch (error) {
            console.error('Failed to create store', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">Ready to Launch?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Review your details and start your business.
                </p>
            </div>

            <div className="flex-1 space-y-6">
                {/* Ticket/Receipt Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Business</div>
                                <div className="text-xl font-black">{data.businessName}</div>
                                <div className="text-sm font-medium text-slate-500 capitalize">{data.category} • {data.state}, {data.country}</div>
                            </div>
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-slate-400" />
                            </div>
                        </div>

                        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payouts</div>
                                <div className="font-bold">{data.bankName}</div>
                                <div className="text-sm font-medium text-slate-500 tracking-widest">
                                    •••• {data.accountNumber.slice(-4)}
                                </div>
                                <div className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {data.accountName}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-slate-400" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Plan</div>
                                <div className="font-black text-emerald-500">Commission Based</div>
                                <div className="text-xs font-medium text-slate-400">4.5% per transaction</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Today</div>
                                <div className="text-2xl font-black">₦0.00</div>
                                <div className="text-xs font-bold text-emerald-500 line-through">₦55,000</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-xs text-slate-500 text-center leading-relaxed">
                    By clicking "Create Store", you agree to our Terms of Service and Commission Agreement (4.5% fee on sales).
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
                    onClick={handleCreateStore}
                    disabled={loading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating Store...
                        </>
                    ) : (
                        <>
                            Create Store
                            <Store className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
