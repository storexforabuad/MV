'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, CreditCard, Loader2, Lock, ShieldCheck, X, ChevronRight, Landmark, Smartphone } from 'lucide-react';
import { formatPrice } from '@/utils/price';

type PaymentMethod = 'card' | 'bank' | 'ussd';
type Stage = 'select' | 'processing' | 'success' | 'failed';

function MockPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reference = searchParams?.get('reference') || '';
    const amount = Number(searchParams?.get('amount') || 0);
    const email = searchParams?.get('email') || '';
    const storeId = searchParams?.get('storeId') || '';
    const orderId = searchParams?.get('orderId') || '';
    const callbackUrl = searchParams?.get('callback') || `/${storeId}/payment-success`;

    const [method, setMethod] = useState<PaymentMethod>('card');
    const [stage, setStage] = useState<Stage>('select');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const processingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (processingTimer.current) clearTimeout(processingTimer.current);
        };
    }, []);

    const formatCardNumber = (value: string) =>
        value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

    const formatExpiry = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    };

    const handlePay = () => {
        if (method === 'card' && (!cardNumber || !expiry || !cvv || !name)) return;
        setStage('processing');
        processingTimer.current = setTimeout(() => {
            setStage('success');
            // Redirect to callback after success animation
            processingTimer.current = setTimeout(() => {
                const url = `${callbackUrl}?reference=${reference}&orderId=${orderId}&trxref=${reference}&mock=true`;
                router.replace(url);
            }, 2000);
        }, 2500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Paystack-style branding bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-teal-400" />

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-3">
                        <Lock className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs text-green-400 font-bold uppercase tracking-widest">Secured by Paystack</span>
                    </div>
                    <p className="text-slate-400 text-sm">{email}</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                    {/* Amount Header */}
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 px-7 py-6 text-white">
                        <p className="text-sm opacity-80 font-medium">Total Amount</p>
                        <p className="text-4xl font-extrabold tracking-tight mt-1">{formatPrice(amount)}</p>
                        {storeId && <p className="text-xs opacity-70 mt-1">Store: {storeId}</p>}
                    </div>

                    <AnimatePresence mode="wait">
                        {stage === 'select' && (
                            <motion.div key="select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="p-7 space-y-6">
                                {/* Payment Method Tabs */}
                                <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl">
                                    {([
                                        { id: 'card', icon: CreditCard, label: 'Card' },
                                        { id: 'bank', icon: Landmark, label: 'Bank' },
                                        { id: 'ussd', icon: Smartphone, label: 'USSD' },
                                    ] as const).map(({ id, icon: Icon, label }) => (
                                        <button
                                            key={id}
                                            onClick={() => setMethod(id)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${method === id ? 'bg-white dark:bg-slate-600 shadow text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}
                                        >
                                            <Icon size={15} /> {label}
                                        </button>
                                    ))}
                                </div>

                                {method === 'card' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">CARDHOLDER NAME</label>
                                            <input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="John Doe"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">CARD NUMBER</label>
                                            <input
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                placeholder="0000 0000 0000 0000"
                                                maxLength={19}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">EXPIRY</label>
                                                <input
                                                    value={expiry}
                                                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">CVV</label>
                                                <input
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    placeholder="•••"
                                                    type="password"
                                                    maxLength={4}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {method === 'bank' && (
                                    <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm space-y-2">
                                        <Landmark className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                                        <p className="font-medium">Bank Transfer (Simulated)</p>
                                        <p className="text-xs">Click Pay to simulate a successful transfer.</p>
                                    </div>
                                )}

                                {method === 'ussd' && (
                                    <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm space-y-2">
                                        <Smartphone className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                                        <p className="font-medium">USSD Payment (Simulated)</p>
                                        <p className="text-xs">Click Pay to simulate a successful USSD transaction.</p>
                                    </div>
                                )}

                                <button
                                    onClick={handlePay}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold text-base shadow-lg hover:shadow-green-500/30 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Lock size={16} />
                                    Pay {formatPrice(amount)}
                                    <ChevronRight size={16} className="opacity-70" />
                                </button>

                                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest">
                                    <ShieldCheck size={12} />
                                    <span>256-bit SSL Encryption — NDPR Compliant</span>
                                </div>
                            </motion.div>
                        )}

                        {stage === 'processing' && (
                            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12 flex flex-col items-center justify-center gap-5">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-green-100 dark:border-green-900" />
                                    <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-green-500 animate-spin" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-slate-800 dark:text-white text-lg">Processing Payment</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please wait, do not close this page...</p>
                                </div>
                            </motion.div>
                        )}

                        {stage === 'success' && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-12 flex flex-col items-center justify-center gap-5">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                                >
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </motion.div>
                                <div className="text-center">
                                    <p className="font-bold text-slate-800 dark:text-white text-xl">Payment Successful!</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Redirecting to your order...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="text-center mt-4 text-[11px] text-slate-600">
                    🧪 <strong>Mock Mode</strong> — No real charges. For testing only.
                </div>
            </div>
        </div>
    );
}

export default function MockPaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
            </div>
        }>
            <MockPaymentContent />
        </Suspense>
    );
}
