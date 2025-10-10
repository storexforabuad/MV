'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import Navbar from '../../../../components/layout/navbar';
import { useOrders } from '../../../../hooks/useOrders';
import { useReferrals } from '../../../../hooks/useReferrals';
import { CustomerDashboard } from '../../../../components/customer/CustomerDashboard';
import { CustomerMobileNav, CustomerSection } from '../../../../components/customer/CustomerMobileNav';
import { OrdersSection } from '../../../../components/customer/sections/OrdersSection';
import { WishlistSection } from '../../../../components/customer/sections/WishlistSection';
import { ProfileSection } from '../../../../components/customer/sections/ProfileSection';
import { WishlistModal } from '../../../../components/customer/modals/WishlistModal';
import { OrdersModal } from '../../../../components/customer/modals/OrdersModal';
import { ReferralsModal } from '../../../../components/customer/modals/ReferralsModal'; // Import the new modal

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
  const storeId = Array.isArray(params.storeId) ? params.storeId[0] : params.storeId;
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId; // Get userId
  const { orders, refetchOrders: fetchOrders, isLoading: loading } = useOrders(userId || null); // Pass userId to hook
  const { referrals, refetchReferrals: fetchReferrals } = useReferrals();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<CustomerSection>('home');
  const [initialLoading, setInitialLoading] = useState(true);
  
  // State for modals
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isReferralsModalOpen, setIsReferralsModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      setInitialLoading(false);
    }
  }, [loading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    fetchOrders();
    fetchReferrals();
    setIsRefreshing(false);
  };

  const currentSection = sectionConfig[activeSection];
  const isAnyModalOpen = isOrdersModalOpen || isReferralsModalOpen || isWishlistModalOpen;

  useEffect(() => {
    if (activeSection === 'referrals') {
      setIsReferralsModalOpen(true);
    }
  }, [activeSection]);

  const renderMainContent = () => {
    if (initialLoading && activeSection === 'home') {
      return <DashboardSkeleton />;
    }

    switch(activeSection) {
      case 'home':
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
              referralCount={referrals.length}
              storeId={storeId}
              onSectionChange={setActiveSection}
              onOrdersModalOpen={() => setIsOrdersModalOpen(true)}
              onReferralsModalOpen={() => setIsReferralsModalOpen(true)}
              onWishlistModalOpen={() => setIsWishlistModalOpen(true)}
            />
          </>
        );
      case 'orders':
        return <OrdersSection storeId={storeId} />;
      case 'wishlist':
        return <WishlistSection storeId={storeId} />;
      case 'profile':
        return <ProfileSection storeId={storeId} />;
      default:
        return null;
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-black min-h-screen">
      <Navbar storeName={currentSection.title} />
      <main className="p-4 pt-20 pb-28 max-w-2xl mx-auto">
         {activeSection !== 'home' && (
          <>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">{currentSection.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {currentSection.subtitle}
            </p>
          </>
        )}
        <div className={activeSection === 'home' ? '' : 'mt-8'}>
          {renderMainContent()}
        </div>
      </main>
      <CustomerMobileNav 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        isModalOpen={isAnyModalOpen} 
      />
      <WishlistModal isOpen={isWishlistModalOpen} onClose={() => setIsWishlistModalOpen(false)} />
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
    </div>
  );
}
