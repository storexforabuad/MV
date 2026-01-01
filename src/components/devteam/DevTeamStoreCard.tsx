'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, ExternalLink, ShieldCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { getStatusDisplay, isTrialExpired } from '@/types/subscription';
import type { SubscriptionStatus } from '@/types/subscription';
import { devTeamOverrideSubscription } from '@/app/actions/subscriptionActions';
import { Timestamp } from 'firebase/firestore';

interface DevTeamStoreCardProps {
    storeId: string;
    storeName: string;
    logo?: string;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionTrialEndsAt?: Timestamp;
    subscriptionNextBillingDate?: Timestamp;
    ceoEmail?: string;
    ceoName?: string;
}

export function DevTeamStoreCard({
    storeId,
    storeName,
    logo,
    subscriptionStatus = 'trial',
    subscriptionTrialEndsAt,
    subscriptionNextBillingDate,
    ceoEmail,
    ceoName,
}: DevTeamStoreCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const status = subscriptionStatus || 'trial';
    const statusDisplay = getStatusDisplay(status);

    // Calculate days remaining
    const getDaysRemaining = (date: Timestamp | undefined) => {
        if (!date) return 0;
        const now = new Date();
        const targetDate = date.toDate();
        const diff = targetDate.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const trialDaysRemaining = getDaysRemaining(subscriptionTrialEndsAt);
    const trialExpired = subscriptionTrialEndsAt && isTrialExpired(subscriptionTrialEndsAt);

    const handleActivate = async () => {
        if (!confirm(`Activate subscription for ${storeName}?`)) return;

        setIsUpdating(true);
        try {
            await devTeamOverrideSubscription(storeId, 'active', 'Manually activated by devteam');
            alert('Subscription activated successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Error activating subscription:', error);
            alert('Failed to activate subscription');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSuspend = async () => {
        if (!confirm(`Suspend subscription for ${storeName}? This will set status to expired.`)) return;

        setIsUpdating(true);
        try {
            await devTeamOverrideSubscription(storeId, 'expired', 'Manually suspended by devteam');
            alert('Subscription suspended successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Error suspending subscription:', error);
            alert('Failed to suspend subscription');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-4 border border-gray-200 dark:border-slate-700">
            {/* Header with Logo and Store Info */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0">
                    {logo ? (
                        <img src={logo} alt={storeName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Store className="w-6 h-6 text-gray-400" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {storeName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {storeId}
                    </p>
                    {ceoName && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                            {ceoName}
                        </p>
                    )}
                    {ceoEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {ceoEmail}
                        </p>
                    )}
                </div>
            </div>

            {/* Subscription Status Badge */}
            <div className="mb-3">
                <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : status === 'trial'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : status === 'past_due'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                >
                    <span>{statusDisplay.icon}</span>
                    <span>{statusDisplay.label}</span>
                </div>
            </div>

            {/* Status Details */}
            <div className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                {status === 'trial' && !trialExpired && (
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{trialDaysRemaining} days remaining in trial</span>
                    </div>
                )}
                {status === 'trial' && trialExpired && (
                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Trial expired</span>
                    </div>
                )}
                {(status === 'active' || status === 'past_due') && subscriptionNextBillingDate && (
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                            Next billing: {subscriptionNextBillingDate.toDate().toLocaleDateString('en-NG', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </span>
                    </div>
                )}
                {status === 'past_due' && (
                    <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Payment overdue</span>
                    </div>
                )}
                {(status === 'expired' || status === 'cancelled') && (
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>No active subscription</span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
                <Link
                    href={`/admin/${storeId}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                </Link>

                <Link
                    href={`/${storeId}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Live Store</span>
                </Link>
            </div>

            {/* Manual Override Controls */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Manual Override:</p>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleActivate}
                        disabled={isUpdating || status === 'active'}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${status === 'active'
                                ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        {isUpdating ? 'Updating...' : 'Activate'}
                    </button>

                    <button
                        onClick={handleSuspend}
                        disabled={isUpdating || status === 'expired'}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${status === 'expired'
                                ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                    >
                        {isUpdating ? 'Updating...' : 'Suspend'}
                    </button>
                </div>
            </div>
        </div>
    );
}
