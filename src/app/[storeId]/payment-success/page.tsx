'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { CheckCircle, Loader2, ShoppingBag, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();
    const reference = searchParams?.get('reference');
    const storeId = (params?.storeId as string) || '';

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        if (!reference) {
            setStatus('error');
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await fetch(`/api/paystack/verify?reference=${reference}`);
                const data = await response.json();

                if (data.success && data.data.status === 'success') {
                    setStatus('success');
                    setOrderId(data.data.metadata?.orderId || 'Unknown'); // Fallback if metadata missing

                    // Trigger Confetti
                    const duration = 3 * 1000;
                    const animationEnd = Date.now() + duration;
                    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

                    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                    const interval: any = setInterval(function () {
                        const timeLeft = animationEnd - Date.now();

                        if (timeLeft <= 0) {
                            return clearInterval(interval);
                        }

                        const particleCount = 50 * (timeLeft / duration);
                        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                    }, 250);

                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Verification failed', error);
                setStatus('error');
            }
        };

        verifyPayment();
    }, [reference]);

    if (status === 'verifying') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verifying Payment...</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we confirm your transaction.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Verification Failed</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
                    We couldn't verify your payment. If you have been debited, please contact support with reference: <span className="font-mono bg-gray-200 dark:bg-gray-800 px-1 rounded">{reference}</span>
                </p>
                <Link
                    href={`/${storeId}`}
                    className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                    Return to Store
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center relative z-10 border border-gray-100 dark:border-gray-700">

                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Your order has been confirmed and the vendor has been notified.
                </p>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Payment Reference</span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{reference || 'N/A'}</span>
                    </div>
                    {orderId && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Order ID</span>
                            <span className="font-mono font-medium text-gray-900 dark:text-white">#{orderId.slice(0, 8)}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => {
                            // TODO: Open WhatsApp with receipt
                            const message = `Hello! I just paid for my order. Reference: ${reference}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span>Send Receipt to Vendor</span>
                    </button>

                    <Link
                        href={`/${storeId}`}
                        className="w-full py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-all"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Continue Shopping</span>
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-4 text-center text-xs text-gray-400">
                Secured by <span className="font-bold text-gray-500">Atlas™</span>
            </div>
        </div>
    );
}
