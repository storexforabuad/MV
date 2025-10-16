'use client';

import { LayoutGrid, Package, Gift, User } from 'lucide-react';
import { motion } from 'framer-motion';

export type CustomerSection = 'home' | 'orders' | 'referrals' | 'profile';

interface CustomerMobileNavProps {
  activeSection: CustomerSection;
  setActiveSection: (section: CustomerSection) => void;
  onOrdersClick: () => void;
  onReferralsClick: () => void;
  onProfileClick: () => void;
  isModalOpen: boolean;
}

const navItems = [
  { id: 'home', icon: LayoutGrid, label: 'Home' },
  { id: 'orders', icon: Package, label: 'Orders' },
  { id: 'referrals', icon: Gift, label: 'Referrals' },
  { id: 'profile', icon: User, label: 'Profile' },
] as const;

export function CustomerMobileNav({ activeSection, setActiveSection, onOrdersClick, onReferralsClick, onProfileClick, isModalOpen }: CustomerMobileNavProps) {
  const handleNavClick = (sectionId: CustomerSection) => {
    if (sectionId === 'orders') {
      onOrdersClick();
    } else if (sectionId === 'referrals') {
      onReferralsClick();
    } else if (sectionId === 'profile') {
      onProfileClick();
    } else {
      setActiveSection(sectionId);
    }
  };
  return (
    <nav className={`fixed bottom-0 left-0 right-0 h-[calc(4.5rem+env(safe-area-inset-bottom))] bg-white dark:bg-black backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 ease-in-out ${isModalOpen ? 'translate-y-full pointer-events-none' : 'translate-y-0'}`}>
      <div className="flex justify-around items-start h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="flex flex-col items-center justify-center pt-3 gap-1 w-full h-full text-slate-500 dark:text-slate-400 relative transition-colors duration-200"
            >
              <Icon 
                className={`w-6 h-6 transition-colors ${isActive ? 'text-slate-900 dark:text-white' : ''}`}
                fill={isActive ? 'currentColor' : 'none'} 
              />
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-slate-900 dark:text-white' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="customer-active-underline"
                  className="absolute bottom-0 h-0.5 w-full bg-slate-900 dark:bg-white"
                />
              )}
            </button>
          );
        })}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }} className="bg-transparent" />
    </nav>
  );
}
