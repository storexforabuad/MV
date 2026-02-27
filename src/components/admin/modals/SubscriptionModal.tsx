'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ShieldCheck, X, Calendar, CreditCard, AlertCircle, CheckCircle2, Loader2, Zap, Clock, ChevronRight, AlertTriangle, XCircle, Trophy, Gift, Star, Sparkles, Package } from 'lucide-react';
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
  isLoading,
  disabled,
  actionType
}: {
  tier: SubscriptionTier,
  details: any,
  isSelected: boolean,
  onSelect: () => void,
  onSubscribe: () => void,
  isLoading: boolean,
  disabled: boolean,
  actionType?: 'upgrade' | 'downgrade' | 'select'
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
        <div className="flex items-baseline gap-2 mb-4">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-slate-900 dark:text-white">₦{details.price.toLocaleString()}</span>
          </div>
          <span className="text-sm font-medium text-slate-500">/{details.period}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {details.description}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && !isLoading) onSubscribe();
          }}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
        >
          {isLoading && isSelected ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSelected ? (isLoading ? 'Initializing...' : 'Subscribe Now') : 'Select Plan'}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={!disabled ? onSelect : undefined}
      className={`relative h-[360px] sm:h-[400px] w-full rounded-[2.5rem] overflow-hidden border-2 transition-all cursor-pointer group ${isSelected
        ? isProMax ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'border-white/40 shadow-2xl scale-[1.02]'
        : isProMax ? 'border-amber-500/30 hover:border-amber-500/60' : 'border-white/5 hover:border-white/20'
        } ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
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


      {/* Content Overlay */}
      <div className="absolute inset-0 p-6 sm:p-8 flex flex-col bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        {/* Top: Plan Name & Checkmark */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className={`text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-2xl leading-none ${isProMax ? 'text-amber-50' : 'text-white'}`}>
              {details.name}
              <span className="block text-lg sm:text-xl opacity-80 mt-1">Plan</span>
            </h4>
          </div>
          {isSelected && (
            <div className={`p-1.5 rounded-full backdrop-blur-md border ${isProMax ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/20 border-white/40 text-white'}`}>
              <CheckCircle2 className="w-5 h-5 sm:w-6 h-6" />
            </div>
          )}
        </div>

        {/* Middle: Product Limit Badge */}
        <div className="mt-6">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border ${isProMax
            ? 'bg-amber-500/20 border-amber-500/30 text-amber-100'
            : isPro
              ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-100'
              : 'bg-white/10 border-white/20 text-white/90'
            }`}>
            <Package className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
              Up to {typeof details.productLimit === 'number' ? details.productLimit.toLocaleString() : details.productLimit} Products
            </span>
          </div>
        </div>

        {/* Bottom: Price, Description, and Footer */}
        <div className="mt-auto pt-6 space-y-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl sm:text-6xl font-black tracking-tighter drop-shadow-2xl ${isProMax ? 'text-amber-400' : 'text-white'}`}>
                ₦{details.price.toLocaleString()}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isProMax ? 'text-amber-200/60' : 'text-white/60'}`}>/ week</span>
            </div>
            <p className={`text-xs sm:text-sm font-bold leading-relaxed max-w-[280px] drop-shadow-md ${isProMax ? 'text-amber-100/80' : 'text-white/80'}`}>
              {details.description}
            </p>
          </div>

          {!(disabled && isSelected) ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled && !isLoading) {
                  if (actionType === 'upgrade' || actionType === 'downgrade') {
                    onSelect();
                    setTimeout(() => onSubscribe(), 50);
                  } else if (isSelected) {
                    onSubscribe();
                  } else {
                    onSelect();
                  }
                }
              }}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm border shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${actionType === 'upgrade'
                ? 'bg-green-500 text-white border-green-500 hover:bg-green-600'
                : actionType === 'downgrade'
                  ? 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                  : isSelected
                    ? isProMax ? 'bg-amber-500 text-black border-amber-500' : 'bg-white text-black border-white shadow-white/20'
                    : isProMax ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {actionType === 'upgrade'
                ? (isLoading ? 'Upgrading...' : 'Upgrade Now')
                : actionType === 'downgrade'
                  ? (isLoading ? 'Downgrading...' : 'Downgrade Plan')
                  : isSelected
                    ? (isLoading ? 'Initializing...' : 'Subscribe Now')
                    : 'Select Plan'}
            </button>
          ) : (
            <div className="pt-4 border-t border-white/10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/90">Maintained by Admin</span>
              </div>
            </div>
          )}
        </div>
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
  const [showPlanChangeConfirm, setShowPlanChangeConfirm] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState<{ tier: SubscriptionTier; action: 'upgrade' | 'downgrade' } | null>(null);

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

  // Handle plan change (upgrade/downgrade) confirmation
  const handlePlanChangeRequest = (tier: SubscriptionTier, action: 'upgrade' | 'downgrade') => {
    setPendingPlanChange({ tier, action });
    setShowPlanChangeConfirm(true);
  };

  const confirmPlanChange = () => {
    if (!pendingPlanChange) return;
    setSelectedTier(pendingPlanChange.tier);
    setShowPlanChangeConfirm(false);
    setPendingPlanChange(null);
    setTimeout(() => handleSubscribe(), 50);
  };

  const cancelPlanChange = () => {
    setShowPlanChangeConfirm(false);
    setPendingPlanChange(null);
  };

  const safeToDate = (val: any): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    if (typeof val.toDate === 'function') return val.toDate();
    if (val.seconds) return new Date(val.seconds * 1000);
    if (typeof val === 'string') return new Date(val);
    return undefined;
  };

  const isInfluencer = subscriptionData?.isInfluencer;
  const isFreePlan = subscriptionData?.isFreePlan;
  const isWeeklyBilling = subscriptionData?.isWeeklyBilling;
  const storeCreatedAt = safeToDate(subscriptionData?.createdAt);

  // Normalize tier ID to lowercase to match TIER_DETAILS keys
  const rawTier = subscriptionData?.tier;
  const normalizedTier = typeof rawTier === 'string' ? (rawTier.toLowerCase() as SubscriptionTier) : undefined;
  const currentTier = normalizedTier || ((isInfluencer || isFreePlan) ? 'pro' : undefined);

  // Force active status for influencer/free plans
  const status: SubscriptionStatus = (isInfluencer || isFreePlan) ? 'active' : (subscriptionData?.status || 'trial');
  const statusDisplay = getStatusDisplay(status);
  const trialEndsAt = safeToDate(subscriptionData?.trialEndsAt);

  // Robust calculation for weekly billing: createdAt + 1 week, or fallback to now + 1 week
  const calculateNextWeeklyDate = (date: Date | undefined) => {
    const baseDate = date || new Date();
    return new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  };

  const nextBillingDate = (isInfluencer || isFreePlan)
    ? calculateNextWeeklyDate(storeCreatedAt)
    : safeToDate(subscriptionData?.nextBillingDate);

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

  const isLegacyStore = !storeType;

  // Hide trial banner and billing details for new tiers if they haven't subscribed yet
  // Hide trial banner and billing details for new tiers if they haven't subscribed yet
  const showStatusBanner = isLegacyStore || status === 'active' || status === 'past_due' || status === 'trial' || status === 'expired';
  const showBillingDetails = isLegacyStore || status === 'active';

  return (
    <>
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
              {!isLegacyStore && <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />}
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
                          {status === 'active'
                            ? `Active Plan: ${currentTier ? TIER_DETAILS[currentTier as keyof typeof TIER_DETAILS]?.name.toUpperCase() : 'ACTIVE'}`
                            : 'Current Status'}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {statusDisplay.label}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {status === 'trial' && !trialExpired && `${trialDaysRemaining} days remaining in your free trial`}
                        {status === 'trial' && trialExpired && <span className="text-red-600 dark:text-red-400 font-bold">Your free trial has ended. Access is restricted. Subscribe now to restore full access.</span>}
                        {status === 'active' && (isInfluencer || isFreePlan ? 'Your subscription is active and auto-renews weekly.' : 'Your subscription is active and auto-renews.')}
                        {status === 'past_due' && `Payment failed. ${graceDaysRemaining} days of grace period remaining.`}
                        {status === 'cancelled' && 'Your subscription has been cancelled.'}
                        {status === 'expired' && <span className="text-red-600 dark:text-red-400 font-bold">Your subscription has expired. Access is restricted.</span>}
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
                  {/* Inline Billing Info for Active Subscribers */}
                  {status === 'active' && (
                    <div className="mt-4 pt-4 border-t border-green-200/50 dark:border-green-800/50 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Next Billing</span>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {nextBillingDate?.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Payment</span>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {isInfluencer || isFreePlan ? "Muh'd Mustafa VI" : 'Paystack'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Plan Selection Section */}
              {!(isInfluencer || isFreePlan) && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {isLegacyStore ? 'Your Plan' : status === 'active' ? 'Plan Management' : 'Choose Your Plan'}
                    </h4>
                    {!isLegacyStore && (
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                        <button
                          onClick={() => window.open('https://wa.me/2347032905036', '_blank')}
                          className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-right sm:text-left"
                        >
                          Need monthly billing? <span className="font-bold underline decoration-dotted">Contact us</span>
                        </button>
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Weekly Billing
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {isLegacyStore ? (
                      <TierCard
                        tier="general"
                        details={TIER_DETAILS.general}
                        isSelected={true}
                        onSelect={() => { }}
                        onSubscribe={handleSubscribe}
                        isLoading={subscribing}
                        disabled={status === 'active'}
                        actionType="select"
                      />
                    ) : (
                      <>
                        {(['basic', 'pro', 'promax'] as const)
                          .map(tierKey => {
                            const isCurrentTier = tierKey === subscriptionData?.tier;
                            const tierPrices = { basic: 500, pro: 1000, promax: 3500 };
                            const activeTierPrice = subscriptionData?.tier ? tierPrices[subscriptionData.tier as keyof typeof tierPrices] : 0;

                            let cardAction: 'upgrade' | 'downgrade' | 'select' = 'select';
                            if (status === 'active') {
                              if (isCurrentTier) cardAction = 'select'; // Will show as selected
                              else cardAction = tierPrices[tierKey] > activeTierPrice ? 'upgrade' : 'downgrade';
                            }

                            return (
                              <TierCard
                                key={tierKey}
                                tier={tierKey}
                                details={TIER_DETAILS[tierKey]}
                                isSelected={selectedTier === tierKey || isCurrentTier}
                                onSelect={() => setSelectedTier(tierKey)}
                                onSubscribe={() => {
                                  if (isCurrentTier) return;
                                  if (status === 'active') {
                                    handlePlanChangeRequest(tierKey, cardAction as 'upgrade' | 'downgrade');
                                  } else {
                                    setSelectedTier(tierKey);
                                    setTimeout(() => handleSubscribe(), 50);
                                  }
                                }}
                                isLoading={subscribing && selectedTier === tierKey}
                                disabled={isCurrentTier}
                                actionType={isCurrentTier ? undefined : cardAction}
                              />
                            );
                          })}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Influencer/Free Plan Specific View */}
              {(isInfluencer || isFreePlan) && (
                <div className="space-y-6">
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight px-1">Current Plan</h4>
                  <TierCard
                    tier="pro"
                    details={TIER_DETAILS.pro}
                    isSelected={true}
                    onSelect={() => { }}
                    onSubscribe={() => { }}
                    isLoading={false}
                    disabled={true}
                  />
                </div>
              )}

              {/* Billing Details - Only show for legacy/trial stores, not active (active show in status banner) */}
              {(showBillingDetails || isInfluencer || isFreePlan) && status !== 'active' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 opacity-40">
                      <Clock className="w-4 h-4" />
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
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {isInfluencer || isFreePlan ? 'System Managed' : 'Paystack'}
                    </p>
                  </div>
                </div>
              )}


              {/* Cancel Subscription Area */}
              {status === 'active' && !(isInfluencer || isFreePlan) && (
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
            {(!trialExpired && status !== 'expired') ? (
              <motion.button
                onClick={handleClose}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black py-4 px-8 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98] text-base tracking-tight"
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-red-500 font-bold mb-2">Subscription Required to Continue</p>
                <button disabled className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-black py-4 px-8 rounded-xl cursor-not-allowed opacity-50">
                  Close
                </button>
              </div>
            )}
          </div>
        </footer>
      </motion.div>

      {/* Plan Change Confirmation Modal */}
      <AnimatePresence>
        {showPlanChangeConfirm && pendingPlanChange && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelPlanChange}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-6 mx-auto">
                  <AlertCircle size={32} />
                </div>

                <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tight">
                  Confirm {pendingPlanChange.action === 'upgrade' ? 'Upgrade' : 'Downgrade'}
                </h3>

                <p className="text-slate-600 dark:text-slate-400 text-center text-sm mb-8 leading-relaxed">
                  You are about to change your plan to <span className="font-bold text-slate-900 dark:text-white">{TIER_DETAILS[pendingPlanChange.tier as keyof typeof TIER_DETAILS]?.name.toUpperCase()}</span>.
                  <br /><br />
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">Important:</span> To complete this change, you will need to pay for the new plan. Your current subscription will be replaced by this new one immediately upon successful payment.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmPlanChange}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                  >
                    Confirm & Proceed to Payment
                  </button>
                  <button
                    onClick={cancelPlanChange}
                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
