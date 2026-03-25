'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { CheckCircle, Loader2, ShoppingBag, MessageSquare, Package } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { getOrderById, confirmPayment } from '@/app/actions/orderActions';
import { formatPrice } from '@/utils/price';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();
    const reference = searchParams?.get('reference') || searchParams?.get('trxref') || '';
    const storeId = (params?.storeId as string) || '';
    const orderId = searchParams?.get('orderId') || '';
    const isMock = searchParams?.get('mock') === 'true';

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(null);
    const [order, setOrder] = useState<any>(null);
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current || !reference) {
            if (!reference) setStatus('error');
            return;
        }
        hasRun.current = true;

        const verifyPayment = async () => {
            try {
                let confirmedOrderId = orderId;

                if (isMock) {
                    // Mock: Skip Paystack, just confirm in Firestore
                    if (orderId && storeId) {
                        await confirmPayment(storeId, orderId, reference);
                    }
                    setStatus('success');
                    setResolvedOrderId(orderId || null);
                } else {
                    const response = await fetch(`/api/paystack/verify?reference=${reference}`);
                    const data = await response.json();

                    if (data.success && data.data.status === 'success') {
                        confirmedOrderId = data.data.metadata?.orderId || orderId || 'Unknown';
                        setStatus('success');
                        setResolvedOrderId(confirmedOrderId);

                        // Mark order as escrow-held
                        if (confirmedOrderId && storeId) {
                            await confirmPayment(storeId, confirmedOrderId, reference);
                        }

                        // Trigger Confetti
                        const duration = 3 * 1000;
                        const animationEnd = Date.now() + duration;
                        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
                        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
                        const interval: any = setInterval(function () {
                            const timeLeft = animationEnd - Date.now();
                            if (timeLeft <= 0) return clearInterval(interval);
                            const particleCount = 50 * (timeLeft / duration);
                            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                        }, 250);
                    } else {
                        setStatus('error');
                    }
                }
            } catch (error) {
                console.error('Verification failed', error);
                setStatus('error');
            }
        };

        verifyPayment();
    }, [reference, storeId, orderId, isMock]);

    useEffect(() => {
        if (resolvedOrderId && resolvedOrderId !== 'Unknown' && storeId) {
            getOrderById(storeId, resolvedOrderId).then(setOrder).catch(console.error);
        }
    }, [resolvedOrderId, storeId]);

    const handleSendReceipt = () => {
        if (!order) {
            // Fallback if order details not loaded yet
            const message = `Hello! I just paid for my order. Reference: ${reference}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            return;
        }

        const storeName = order.storeMeta?.name || 'the store';
        const whatsapp = order.storeMeta?.whatsapp;

        let productDetails = '';
        if (order.products && order.products.length > 0) {
            productDetails = order.products.map((p: any) => {
                const productUrl = `https://tinyurl.com/bizconnet/${storeId}/products/${p.id}`;
                return `• *${p.name.trim()}* (x${p.quantity || 1})\n🔗 ${productUrl}`;
            }).join('\n\n');
        }

        const totalAmount = order.products.reduce((sum: number, p: any) => sum + (p.price * (p.quantity || 1)), 0);

        let deliveryDetails = '';
        if (order.deliveryMethod === 'pickup') {
            deliveryDetails = `🏪 *Delivery:* Pickup at Store`;
        } else {
            const addr = order.customerInfo?.deliveryAddress;
            if (addr) {
                deliveryDetails = `📍 *Delivery Address:*\n${addr.street}, ${addr.state}`;
            }
        }

        const message = `✅ *Payment Successful!*\n\n` +
            `Hello! I just completed the payment for my order at *${storeName}*.\n\n` +
            `💳 *Reference:* ${reference}\n` +
            `🆔 *Order ID:* #${orderId?.slice(0, 8)}\n\n` +
            `📦 *Order Details:*\n${productDetails}\n\n` +
            (deliveryDetails ? `${deliveryDetails}\n\n` : '') +
            `💰 *Total Paid:* ${formatPrice(totalAmount)}\n\n` +
            `Please confirm receipt and process my order. Thank you! 🙏✨`;

        const whatsappUrl = whatsapp
            ? `https://wa.me/${formatWhatsAppNumber(whatsapp)}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

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

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Payment Reference</span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{reference || 'N/A'}</span>
                    </div>
                    {resolvedOrderId && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Order ID</span>
                            <span className="font-mono font-medium text-gray-900 dark:text-white">#{resolvedOrderId.slice(0, 8)}</span>
                        </div>
                    )}
                </div>

                {/* Escrow Banner */}
                <div className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Funds Held in Escrow</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                Your payment is secure. If this is a service order, funds will be released to the influencer only after you approve the campaign deliverable.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleSendReceipt}
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
                Secured by <span className="font-bold text-gray-500">BizconNet™</span>
            </div>
        </div>
    );
}
