'use client';

import { StoreCustomer } from "@/app/actions/customerActions";
import { format, parseISO } from 'date-fns';
import { Naira } from "@/components/common/Naira";

interface CustomerDetailCardProps {
    customer: StoreCustomer;
}

const StatGridItem: React.FC<{ label: string; value: string | number | React.ReactNode }> = ({ label, value }) => (
    <div className="bg-gray-50 rounded-md p-3 text-center">
        <p className="text-lg md:text-xl font-bold text-gray-800">{value}</p>
        <p className="text-xs md:text-sm text-gray-500">{label}</p>
    </div>
);

export const CustomerDetailCard: React.FC<CustomerDetailCardProps> = ({ customer }) => {

    const formattedAddress = [
        customer.deliveryAddress.street,
        customer.deliveryAddress.city,
        customer.deliveryAddress.state,
    ].filter(Boolean).join(', ');

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-600">{customer.phoneNumber}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Last Order: {format(parseISO(customer.mostRecentOrderDate), 'PPP')}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <StatGridItem label="Total Orders" value={customer.totalOrdersInStore} />
                    <StatGridItem label="Total Spent" value={<Naira amount={customer.totalSpentInStore} />} />
                    <StatGridItem label="Referrals" value={customer.successfulReferralCount} />
                    <StatGridItem label="Commission" value={<Naira amount={customer.totalReferralCommission} />} />
                </div>

                {/* Address Footer */}
                <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Delivery Address</h4>
                    <p className="text-sm text-gray-600">{formattedAddress}</p>
                </div>
            </div>
        </div>
    );
};


// Skeleton Loader for this component
export const CustomerDetailCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 animate-pulse">
            {/* Header */}
            <div className="mb-4">
                <div className="h-6 w-3/4 bg-gray-200 rounded-md mb-2"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded-md mb-2"></div>
                <div className="h-3 w-1/3 bg-gray-200 rounded-md"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div className="h-16 bg-gray-200 rounded-md"></div>
                <div className="h-16 bg-gray-200 rounded-md"></div>
                <div className="h-16 bg-gray-200 rounded-md"></div>
                <div className="h-16 bg-gray-200 rounded-md"></div>
            </div>

            {/* Address Footer */}
            <div className="bg-gray-200 p-3 rounded-md h-16"></div>
        </div>
    </div>
);
