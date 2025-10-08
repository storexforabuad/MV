
"use client";

import { useEffect, useState } from "react";
import { useCustomer } from "@/context/CustomerContext";
import { ShoppingBag, Gift, Heart, User } from "lucide-react";
import { motion } from "framer-motion";
import { OrdersModal } from './modals/OrdersModal';
import { ReferralsModal } from './modals/ReferralsModal';
import { WishlistModal } from './modals/WishlistModal';
import { CustomerStatCard } from './CustomerStatCard';
import { DashboardActionCard } from './DashboardActionCard';
import { CustomerMobileNav } from './CustomerMobileNav';
import { ProfileSection } from './sections/ProfileSection';
import { OrdersSection } from './sections/OrdersSection';
import { ReferralsSection } from './sections/ReferralsSection';
import { WishlistSection } from './sections/WishlistSection';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export function CustomerDashboard() {
  const { customer, isLoading, promptLogin } = useCustomer();
  const [activeSection, setActiveSection] = useState('profile');

  // If not logged in, prompt for login
  useEffect(() => {
    if (!isLoading && !customer) {
      promptLogin();
    }
  }, [isLoading, customer, promptLogin]);

  const renderSection = () => {
    if (isLoading || !customer) {
      return (
          <div className="text-center py-10">
              <p className="text-gray-500">Loading your dashboard...</p>
          </div>
      );
    }

    switch (activeSection) {
      case 'profile':
        return <ProfileSection customer={customer} />;
      case 'orders':
        return <OrdersSection customerId={customer.id} />;
      case 'referrals':
        return <ReferralsSection customer={customer} />;
      case 'wishlist':
          return <WishlistSection customerId={customer.id} />;
      default:
        return <ProfileSection customer={customer} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        {/* You can use a spinner or skeleton loader here */}
        <p>Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    // The useEffect above will trigger the login prompt.
    // This is a fallback UI.
    return (
      <div className="text-center py-10">
        <p className="mb-4">Please log in to see your dashboard.</p>
        <button
          onClick={() => promptLogin()}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Login / Sign Up
        </button>
      </div>
    );
  }
  
  return (
      <div className="container mx-auto px-4 py-8">
          <div className="md:flex">
              <aside className="w-full md:w-64 md:mr-8 mb-8 md:mb-0">
                  <h2 className="text-2xl font-bold mb-6">My Account</h2>
                  <nav className="hidden md:block">
                      <ul>
                          {/* Navigation items for desktop - can be implemented similarly to mobile */}
                      </ul>
                  </nav>
              </aside>
              <main className="flex-1">
                  {renderSection()}
              </main>
          </div>

          {/* Mobile Navigation */}
          <CustomerMobileNav activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>
  );
}
