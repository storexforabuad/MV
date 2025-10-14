'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import Navbar from '../../../../components/layout/navbar';
import { useOrders } from '../../../../hooks/useOrders';
// import { useReferrals } from '../../../../hooks/useReferrals';
import { useCustomer } from '@/context/CustomerContext'; // Corrected import path
import { CustomerDashboard } from '../../../../components/customer/CustomerDashboard';
import { CustomerMobileNav, CustomerSection } from '../../../../components/customer/CustomerMobileNav';
import { WishlistModal } from '../../../../components/customer/modals/WishlistModal';
import { OrdersModal } from '../../../../components/customer/modals/OrdersModal';
import { ReferralsModal } from '../../../../components/customer/modals/ReferralsModal';
import { ProfileModal } from '../../../../components/customer/modals/ProfileModal';

const sectionConfig = {
  home: { title: 'Dashboard', subtitle: 'A summary of your recent orders and interactions.' },
  orders: { title: 'Your Orders', subtitle: 'Review and track all your past orders.' },
  referrals: { title: 'Your Referrals', subtitle: 'Track your referrals and see your rewards.' },
  wishlist: { title: 'Your Wishlist', subtitle: 'View and share items you have saved.' },
  profile: { title: 'Your Profile', subtitle: 'Manage your account details and preferences.' },
};

const DashboardSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-12 mb-6 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
      <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
      <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
    </div>
  </div>
);

export default function DashboardPage() {
  const params = useParams();
  const { customer } = useCustomer();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<CustomerSection>('home');
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isReferralsModalOpen, setIsReferralsModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const storeId = params ? (Array.isArray(params.storeId) ? params.storeId[0] : params.storeId) : undefined;
  const { orders, refetchOrders: fetchOrders, isLoading: loading } = useOrders(customer?.id || null, storeId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    fetchOrders();
    setIsRefreshing(false);
  };

  const currentSection = sectionConfig[activeSection];
  const isAnyModalOpen = isOrdersModalOpen || isReferralsModalOpen || isWishlistModalOpen || isProfileModalOpen;

  const renderMainContent = () => {
    if (!storeId || ((!customer || loading) && activeSection === 'home')) {
      return <DashboardSkeleton />;
    }

    return (
      <>
        <motion.button
          onClick={handleRefresh}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out mb-6"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          disabled={isRefreshing || loading}
        >
          <RefreshCw className={`w-5 h-5 ${(isRefreshing || loading) ? 'animate-spin' : ''}`} />
          <span>{(isRefreshing || loading) ? 'Refreshing...' : 'Refresh'}</span>
        </motion.button>
        <CustomerDashboard 
          orders={orders}
          customer={customer}
          storeId={storeId}
          onOrdersModalOpen={() => setIsOrdersModalOpen(true)}
          onReferralsModalOpen={() => setIsReferralsModalOpen(true)}
          onWishlistModalOpen={() => setIsWishlistModalOpen(true)}
        />
      </>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-black min-h-screen">
      <Navbar storeName={currentSection.title} />
      <main className="p-4 pt-20 pb-28 max-w-2xl mx-auto">
        <div className={activeSection === 'home' ? '' : 'mt-8'}>
          {renderMainContent()}
        </div>
      </main>
      {storeId && (
        <>
          <CustomerMobileNav 
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onOrdersClick={() => setIsOrdersModalOpen(true)}
            onReferralsClick={() => setIsReferralsModalOpen(true)}
            onWishlistClick={() => setIsWishlistModalOpen(true)}
            onProfileClick={() => setIsProfileModalOpen(true)}
            isModalOpen={isAnyModalOpen}
          />
          <WishlistModal isOpen={isWishlistModalOpen} onClose={() => setIsWishlistModalOpen(false)} />
          <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
          <OrdersModal 
            isOpen={isOrdersModalOpen} 
            onClose={() => setIsOrdersModalOpen(false)} 
            orders={orders}
            storeId={storeId}
          />
          <ReferralsModal 
            isOpen={isReferralsModalOpen} 
            onClose={() => {
              setIsReferralsModalOpen(false);
              setActiveSection('home');
            }} 
            storeId={storeId}
          />
        </>
      )}
    </div>
  );
}
