'use client';

import { useState, useEffect } from 'react';
import Modal from '../../Modal';
import { ShieldCheck, X, Calendar, CreditCard, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  handleClose,
  storeId,
  ceoEmail,
  storeName
}) => {
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
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
        currency: 'NGN', // Explicitly set currency
        ref: `sub_${storeId}_${Date.now()}`,
        metadata: {
          storeId,
          storeName: storeName || 'Store',
          language: 'en', // Explicitly set language
        },
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
        label: storeName,
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

  if (loading) {
    return (
      <Modal open={true} onClose={handleClose}>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      </Modal>
    );
  }

  const status: SubscriptionStatus = subscriptionData?.status || 'trial';
  const statusDisplay = getStatusDisplay(status);
  const trialEndsAt = subscriptionData?.trialEndsAt?.toDate();
  const nextBillingDate = subscriptionData?.nextBillingDate?.toDate();
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

  return (
    <Modal open={true} onClose={handleClose}>
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 z-10 text-text-secondary hover:text-text-primary bg-white/80 dark:bg-slate-700/80 rounded-full p-1.5 shadow"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full flex flex-col items-center">
        {/* Header Icon */}
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border ${status === 'active'
            ? 'bg-green-500/10 border-green-500/20'
            : status === 'trial'
              ? 'bg-blue-500/10 border-blue-500/20'
              : status === 'past_due'
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}
        >
          <ShieldCheck
            className={`w-7 h-7 ${status === 'active'
              ? 'text-green-500'
              : status === 'trial'
                ? 'text-blue-500'
                : status === 'past_due'
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-text-primary">Subscription</h2>

        {/* Status Badge */}
        <div
          className={`text-4xl font-bold my-1 ${status === 'active'
            ? 'text-green-500'
            : status === 'trial'
              ? 'text-blue-500'
              : status === 'past_due'
                ? 'text-yellow-500'
                : 'text-red-500'
            }`}
        >
          {statusDisplay.icon} {statusDisplay.label}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-6 text-center">
          {status === 'trial' && !trialExpired && `${trialDaysRemaining} days remaining in your free trial`}
          {status === 'trial' && trialExpired && 'Your free trial has ended. Subscribe to continue.'}
          {status === 'active' && 'Your subscription is active'}
          {status === 'past_due' && `Payment failed. ${graceDaysRemaining} days of grace period remaining.`}
          {status === 'cancelled' && 'Your subscription has been cancelled'}
          {status === 'expired' && 'Your subscription has expired'}
        </p>

        {/* Subscription Details */}
        <div className="w-full text-left p-4 rounded-lg bg-background-alt border border-border-color space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Monthly Fee:</span>
            <span className="font-semibold text-text-primary">
              ₦{SUBSCRIPTION_CONFIG.MONTHLY_AMOUNT.toLocaleString()}
            </span>
          </div>

          {status === 'trial' && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Trial Ends:</span>
              <span className="font-semibold text-text-primary">
                {trialEndsAt?.toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {(status === 'active' || status === 'past_due') && nextBillingDate && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Next Billing:</span>
              <span className="font-semibold text-text-primary">
                {nextBillingDate.toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {status === 'past_due' && (
            <div className="pt-2 border-t border-border-color">
              <div className="flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Your payment failed. Please update your payment method before the grace period ends to avoid service interruption.
                </span>
              </div>
            </div>
          )}

          {status === 'active' && (
            <div className="pt-2 border-t border-border-color">
              <div className="flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Your subscription will automatically renew each month.</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          {(status === 'trial' || status === 'expired' || status === 'cancelled') && (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {subscribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Subscribe Now
                </>
              )}
            </button>
          )}

          {status === 'past_due' && (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full px-4 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {subscribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Update Payment Method
                </>
              )}
            </button>
          )}

          {status === 'active' && (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="w-full px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </button>
          )}
        </div>

        {/* Payment Methods Info */}
        {(status === 'trial' || status === 'expired' || status === 'cancelled' || status === 'past_due') && (
          <div className="mt-4 pt-4 border-t border-border-color w-full">
            <p className="text-xs text-text-secondary text-center">
              We accept: Card • Bank Transfer • USSD
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SubscriptionModal;
