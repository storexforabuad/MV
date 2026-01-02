'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Calendar, CreditCard, AlertCircle, CheckCircle2, Loader2, Zap, Clock, ChevronRight } from 'lucide-react';
import {
  getSubscriptionStatus,
  cancelSubscription,
  verifySubscriptionPayment
} from '@/app/actions/subscriptionActions';
import { getStatusDisplay, SUBSCRIPTION_CONFIG, isTrialExpired } from '@/types/subscription';
import type { SubscriptionStatus } from '@/types/subscription';

interface SubscriptionModalProps {
  handleClose: () => void;
  storeId: string;
  ceoEmail?: string;
  storeName?: string;
}

export default function SubscriptionModal({
  handleClose,
  storeId,
  ceoEmail,
  storeName
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadSubscriptionData();

    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [storeId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionStatus(storeId);
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setSubscribing(true);

      if (!ceoEmail) {
        alert('Email address is required to subscribe. Please update your store details.');
        return;
      }

      // Call API to create subscription
      const response = await fetch('/api/paystack/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          email: ceoEmail,
          storeName: storeName || 'Store',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription');
      }

      if (!result.data.planCode) {
        throw new Error('Subscription plan configuration is missing. Please contact support.');
      }

      // Initialize Paystack Inline payment
      const paystackConfig = {
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: result.data.email,
        plan: result.data.planCode,
        currency: 'NGN',
        ref: `sub_${storeId}_${Date.now()}`,
        metadata: {
          storeId,
          storeName: storeName || 'Store',
          language: 'en',
        },
        onClose: () => {
          setSubscribing(false);
        },
        callback: (response: any) => {
          // Payment successful - verify on backend
          // Use an IIFE to handle the async verification
          (async () => {
            try {
              await verifySubscriptionPayment(response.reference);
              await loadSubscriptionData();
              alert('Subscription activated successfully! 🎉');
            } catch (error) {
              console.error('Verification failed:', error);
              alert('Payment successful but verification failed. Please contact support.');
            } finally {
              setSubscribing(false);
            }
          })();
        },
      };

      // @ts-ignore - PaystackPop is loaded from CDN
      const handler = window.PaystackPop.setup(paystackConfig);

      handler.openIframe();
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to initialize subscription. Please try again.');
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = confirm(
      'Are you sure you want to cancel your subscription? You will lose access at the end of your current billing period.'
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      await cancelSubscription(storeId);
      await loadSubscriptionData();
      alert('Subscription cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // Safe date conversion helper
  const safeToDate = (val: any): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    if (typeof val.toDate === 'function') return val.toDate();
    if (val.seconds) return new Date(val.seconds * 1000);
    if (typeof val === 'string') return new Date(val);
    return undefined;
  };

  const status: SubscriptionStatus = subscriptionData?.status || 'trial';
  const statusDisplay = getStatusDisplay(status);
  const trialEndsAt = safeToDate(subscriptionData?.trialEndsAt);
  const nextBillingDate = safeToDate(subscriptionData?.nextBillingDate);
  const trialExpired = trialEndsAt && isTrialExpired(trialEndsAt);

  // Calculate days remaining
  const getDaysRemaining = (date: Date | undefined) => {
    if (!date) return 0;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const trialDaysRemaining = getDaysRemaining(trialEndsAt);
  const graceDaysRemaining = status === 'past_due' ? getDaysRemaining(nextBillingDate) : 0;

  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
        initial="hidden" animate="visible" exit="exit"
        variants={modalVariants}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* --- Header --- */}
        <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Subscription
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your plan & billing</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${status === 'active' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
            status === 'trial' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
              status === 'past_due' ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                'bg-gradient-to-br from-red-500 to-rose-600'
            }`}>
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
        </header>

        {/* --- Main Scrollable Content --- */}
        <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
            </div>
          ) : (
            <div className="space-y-6">

              {/* Status Banner */}
              <div className={`p-6 rounded-2xl shadow-sm border ${status === 'active' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                status === 'trial' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                  status === 'past_due' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {statusDisplay.icon}
                      <span className={`font-bold uppercase tracking-wider text-sm ${status === 'active' ? 'text-green-700 dark:text-green-400' :
                        status === 'trial' ? 'text-blue-700 dark:text-blue-400' :
                          status === 'past_due' ? 'text-yellow-700 dark:text-yellow-400' :
                            'text-red-700 dark:text-red-400'
                        }`}>
                        Current Status
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {statusDisplay.label}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">
                      {status === 'trial' && !trialExpired && `${trialDaysRemaining} days remaining in your free trial`}
                      {status === 'trial' && trialExpired && 'Your free trial has ended. Subscribe to continue.'}
                      {status === 'active' && 'Your subscription is active and auto-renews.'}
                      {status === 'past_due' && `Payment failed. ${graceDaysRemaining} days of grace period remaining.`}
                      {status === 'cancelled' && 'Your subscription has been cancelled.'}
                      {status === 'expired' && 'Your subscription has expired.'}
                    </p>
                  </div>

                  {/* Action for Banner */}
                  {(status === 'trial' || status === 'expired' || status === 'cancelled' || status === 'past_due') && (
                    <button
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      className="whitespace-nowrap px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                      {status === 'past_due' ? 'Retry Payment' : 'Subscribe Now'}
                    </button>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-sm font-medium">Monthly Plan</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    ₦{SUBSCRIPTION_CONFIG.MONTHLY_AMOUNT.toLocaleString()}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">/ month</span>
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {status === 'trial' ? 'Trial Ends' : 'Next Billing'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {status === 'trial'
                      ? trialEndsAt?.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
                      : nextBillingDate?.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) || 'N/A'
                    }
                  </p>
                </div>
              </div>

              {/* Features List */}
              <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Included in your plan
                </h4>
                <ul className="space-y-3">
                  {[
                    'Unlimited Product Uploads',
                    'Advanced Analytics Dashboard',
                    'Priority Support',
                    'Verified Vendor Badge',
                    'Custom Store Link'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cancel Subscription Area */}
              {status === 'active' && (
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Cancel Subscription
                  </button>
                  <p className="text-xs text-slate-400 mt-2">
                    Cancelling will stop future billing. You will retain access until the end of your current billing period.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* --- Footer --- */}
        <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
          <div className="relative max-w-5xl mx-auto">
            <motion.button
              onClick={handleClose}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.98]"
              whileTap={{ scale: 0.98 }}
            >
              Close
            </motion.button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
