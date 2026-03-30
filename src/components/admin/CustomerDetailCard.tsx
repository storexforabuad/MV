'use client';

import { StoreCustomer } from "@/app/actions/customerActions";
import { format, parseISO } from 'date-fns';
import { Naira } from "@/components/common/Naira";
import { Phone, MessageCircle, User } from 'lucide-react';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';

interface CustomerDetailCardProps {
    customer: StoreCustomer;
    storeType?: string;
}

const StatGridItem: React.FC<{ label: string; value: string | number | React.ReactNode }> = ({ label, value }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 text-center">
        <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
);

export const CustomerDetailCard: React.FC<CustomerDetailCardProps> = ({ customer, storeType }) => {

    const formattedAddress = [
        customer.deliveryAddress.street,
        customer.deliveryAddress.state,
    ].filter(Boolean).join(', ');

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{customer.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Last Order: {format(parseISO(customer.mostRecentOrderDate), 'PPP')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <a href={`tel:${customer.phoneNumber}`} className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">
                            <Phone className="w-5 h-5" />
                        </a>
                        <a href={`https://wa.me/${formatWhatsAppNumber(customer.phoneNumber)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                <div className="flex items-start gap-3 pl-1 mb-4">
                    <Phone className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{customer.phoneNumber}</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <StatGridItem
                        label={storeType === 'media-influencer' ? "Campaigns" : "Total Orders"}
                        value={customer.totalOrdersInStore}
                    />
                    <StatGridItem
                        label={storeType === 'media-influencer' ? "Investment" : "Total Spent"}
                        value={<Naira amount={customer.totalSpentInStore} />}
                    />
                    <StatGridItem label="Referrals" value={customer.successfulReferralCount} />
                    <StatGridItem label="Commission" value={<Naira amount={customer.totalReferralCommission} />} />
                </div>

                {/* Address Footer */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Delivery Address</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{formattedAddress}</p>
                </div>
            </div>
        </div>
    );
};


// Skeleton Loader for this component
export const CustomerDetailCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <div className="p-4 animate-pulse">
            {/* Header */}
            <div className="mb-4">
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md mb-2"></div>
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-md mb-2"></div>
                <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            </div>

            {/* Address Footer */}
            <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-md h-16"></div>
        </div>
    </div>
);
