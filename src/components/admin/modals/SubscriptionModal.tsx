'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ShieldCheck, X, Calendar, CreditCard, AlertCircle, CheckCircle2, Loader2, Zap, Clock, ChevronRight, AlertTriangle, XCircle, Trophy, Gift, Star, Sparkles } from 'lucide-react';
import {
  getSubscriptionStatus,
  cancelSubscription,
  verifySubscriptionPayment
} from '@/app/actions/subscriptionActions';
import { getStatusDisplay, SUBSCRIPTION_CONFIG, isTrialExpired, TIER_DETAILS } from '@/types/subscription';
import type { SubscriptionStatus, SubscriptionTier } from '@/types/subscription';

interface SubscriptionModalProps {
  handleClose: () => void;
  storeId: string;
  ceoEmail?: string;
  storeName?: string;
  storeType?: string;
  onOpenAmbassadorHub?: () => void;
}

const TierCard = ({
  tier,
  details,
  isSelected,
  onSelect,
  onSubscribe,
  disabled
}: {
  tier: SubscriptionTier,
  details: any,
  isSelected: boolean,
  onSelect: () => void,
  onSubscribe: () => void,
  disabled: boolean
}) => {
  const isPro = tier === 'pro';
  const isProMax = tier === 'promax';
  const isGeneral = tier === 'general';

  if (isGeneral) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={!disabled ? onSelect : undefined}
        className={`relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden ${isSelected
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-xl'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-black text-slate-900 dark:text-white">{details.name}</h4>
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
            <Star className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-3xl font-black text-slate-900 dark:text-white">₦{details.price.toLocaleString()}</span>
          <span className="text-sm font-medium text-slate-500">/{details.period}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {details.description}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onSubscribe();
          }}
          className={`w-full py-3 rounded-xl font-black transition-all ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
        >
          {isSelected ? 'Subscribe Now' : 'Select Plan'}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={!disabled ? onSelect : undefined}
      className={`relative aspect-[16/9] sm:aspect-[21/9] rounded-[2rem] overflow-hidden border-2 transition-all cursor-pointer group ${isSelected
          ? isProMax ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'border-white/40 shadow-2xl scale-[1.02]'
          : isProMax ? 'border-amber-500/30 hover:border-amber-500/60' : 'border-white/5 hover:border-white/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Background Image */}
      {details.image && (
        <Image
          src={details.image}
          alt={details.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}

      {/* Overlay Gradient */}
      <div className={`absolute inset-0 ${isProMax ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent' : 'bg-gradient-to-t from-black/80 via-black/20 to-transparent'}`} />

      {/* Popular Ribbon */}
      {isPro && (
        <div className="absolute top-0 right-6">
          <div className="relative">
            <div className="bg-gradient-to-b from-amber-300 to-amber-600 text-black text-[9px] font-black px-3 py-1.5 rounded-b-lg shadow-2xl uppercase tracking-widest">
              Most Popular
            </div>
          </div>
        </div>
      )}

      {/* Content Overlay */}
      <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-end">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-lg sm:text-xl font-black tracking-tight ${isProMax ? 'text-amber-50' : 'text-white'}`}>
              {details.name}
            </h4>
            {isSelected && <CheckCircle2 className={`w-4 h-4 ${isProMax ? 'text-amber-400' : 'text-white'}`} />}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl sm:text-4xl font-black tracking-tighter ${isProMax ? 'text-amber-400' : 'text-white'}`}>
              ₦{details.price.toLocaleString()}
            </span>
            <span className={`text-xs sm:text-sm font-medium ${isProMax ? 'text-amber-500/60' : 'text-white/60'}`}>/{details.period}</span>
          </div>
          <p className={`text-[10px] sm:text-xs font-medium mt-2 leading-relaxed max-w-[240px] ${isProMax ? 'text-amber-100/60' : 'text-white/60'}`}>
            {details.description}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              if (isSelected) onSubscribe();
              else onSelect();
            }
          }}
          className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm transition-all backdrop-blur-md border ${isSelected
              ? isProMax ? 'bg-amber-500 text-black border-amber-500' : 'bg-white text-black border-white'
              : isProMax ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
        >
          {isSelected ? 'Subscribe Now' : 'Select Plan'}
        </button>
      </div>
    </motion.div>
  );
};

export default function SubscriptionModal({
  handleClose,
  storeId,
  ceoEmail,
  storeName,
  storeType,
  onOpenAmbassadorHub
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro');

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
      if (data?.tier) setSelectedTier(data.tier);
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
          tier: selectedTier
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
          tier: selectedTier,
          language: 'en',
        },
        onClose: () => {
          setSubscribing(false);
        },
        callback: (response: any) => {
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

  const getDaysRemaining = (date: Date | undefined) => {
    if (!date) return 0;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const trialDaysRemaining = getDaysRemaining(trialEndsAt);
  const graceDaysRemaining = status === 'past_due' ? getDaysRemaining(nextBillingDate) : 0;

  const getStatusIcon = (s: SubscriptionStatus) => {
    switch (s) {
      case 'active': return CheckCircle2;
      case 'trial': return Clock;
      case 'past_due': return AlertTriangle;
      case 'expired': return AlertCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };
  const StatusIcon = getStatusIcon(status);

  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  const isGeneralStore = storeType === 'general';

  // Hide trial banner and billing details for new tiers if they haven't subscribed yet
  const showStatusBanner = isGeneralStore || status === 'active' || status === 'past_due';
  const showBillingDetails = isGeneralStore || status === 'active';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
        initial="hidden" animate="visible" exit="exit"
        variants={modalVariants}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* --- Header --- */}
        <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg relative z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Subscription
              {!isGeneralStore && <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Manage your plan & billing</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${status === 'active' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
            status === 'trial' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
              status === 'past_due' ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                status === 'expired' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                  'bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 border border-indigo-500/30'
            }`}>
            {status === 'active' ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Clock className="w-6 h-6 text-white" />}
          </div>
        </header>

        {/* Status Indicator Strip */}
        <div className={`h-1.5 w-full ${status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
          status === 'trial' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
            status === 'past_due' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
              status === 'expired' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                'bg-gradient-to-r from-gray-400 to-slate-500'
          }`} />

        {/* --- Main Scrollable Content --- */}
        <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide relative z-10">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-12">

              {/* Status Banner */}
              {showStatusBanner && (
                <div className={`p-5 rounded-2xl shadow-sm border ${status === 'active' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                  status === 'trial' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                    status === 'past_due' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusIcon className={`w-4 h-4 ${status === 'active' ? 'text-green-600 dark:text-green-400' :
                          status === 'trial' ? 'text-blue-600 dark:text-blue-400' :
                            status === 'past_due' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                          }`} />
                        <span className="font-bold uppercase tracking-wider text-[9px] opacity-60">
                          {status === 'active' ? `Active Plan: ${selectedTier.toUpperCase()}` : 'Current Status'}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {statusDisplay.label}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {status === 'trial' && !trialExpired && `${trialDaysRemaining} days remaining in your free trial`}
                        {status === 'trial' && trialExpired && 'Your free trial has ended. Subscribe to continue.'}
                        {status === 'active' && 'Your subscription is active and auto-renews.'}
                        {status === 'past_due' && `Payment failed. ${graceDaysRemaining} days of grace period remaining.`}
                        {status === 'cancelled' && 'Your subscription has been cancelled.'}
                        {status === 'expired' && 'Your subscription has expired.'}
                      </p>
                    </div>
                    {(status === 'trial' || status === 'expired' || status === 'cancelled' || status === 'past_due') && (
                      <button
                        onClick={handleSubscribe}
                        disabled={subscribing}
                        className="whitespace-nowrap px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                      >
                        {subscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                        {status === 'past_due' ? 'Retry Payment' : 'Activate Plan'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Plan Selection Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isGeneralStore ? 'Your Plan' : 'Choose Your Plan'}
                  </h4>
                  {!isGeneralStore && (
                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Weekly Billing
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {isGeneralStore ? (
                    <TierCard
                      tier="general"
                      details={TIER_DETAILS.general}
                      isSelected={true}
                      onSelect={() => { }}
                      onSubscribe={handleSubscribe}
                      disabled={status === 'active'}
                    />
                  ) : (
                    <>
                      <TierCard
                        tier="basic"
                        details={TIER_DETAILS.basic}
                        isSelected={selectedTier === 'basic'}
                        onSelect={() => setSelectedTier('basic')}
                        onSubscribe={handleSubscribe}
                        disabled={status === 'active'}
                      />
                      <TierCard
                        tier="pro"
                        details={TIER_DETAILS.pro}
                        isSelected={selectedTier === 'pro'}
                        onSelect={() => setSelectedTier('pro')}
                        onSubscribe={handleSubscribe}
                        disabled={status === 'active'}
                      />
                      <TierCard
                        tier="promax"
                        details={TIER_DETAILS.promax}
                        isSelected={selectedTier === 'promax'}
                        onSelect={() => setSelectedTier('promax')}
                        onSubscribe={handleSubscribe}
                        disabled={status === 'active'}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Billing Details - Only show if general store or active subscription */}
              {showBillingDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 opacity-40">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {status === 'trial' ? 'Trial Ends' : 'Next Billing'}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {status === 'trial'
                        ? trialEndsAt?.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
                        : nextBillingDate?.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) || 'N/A'
                      }
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 opacity-40">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Payment Method</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Paystack</p>
                  </div>
                </div>
              )}

              {/* Ambassador Hub Link Section */}
              <div className="p-6 rounded-2xl border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy size={60} className="text-indigo-600 dark:text-indigo-400 rotate-12" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Ambassador Program</h4>
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-4 max-w-md">
                    Refer other businesses to earn bonuses and maintain your premium status!
                  </p>
                  <button
                    onClick={() => {
                      handleClose();
                      if (onOpenAmbassadorHub) onOpenAmbassadorHub();
                    }}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] hover:gap-4 transition-all"
                  >
                    Go to Ambassador Hub
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cancel Subscription Area */}
              {status === 'active' && (
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="text-red-500 hover:text-red-600 text-[10px] font-black flex items-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest"
                  >
                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Cancel Subscription
                  </button>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    Cancelling will stop future billing. You will retain access until the end of your current billing period.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* --- Footer --- */}
        <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-20">
          <div className="max-w-5xl mx-auto">
            <motion.button
              onClick={handleClose}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black py-4 px-8 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98] text-base tracking-tight"
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
