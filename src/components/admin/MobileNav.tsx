import React from 'react';
import {
  HomeIcon as HomeIconOutline,
  BuildingStorefrontIcon as BuildingStorefrontIconOutline,
  PlusIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  BuildingStorefrontIcon as BuildingStorefrontIconSolid
} from '@heroicons/react/24/solid';
import { useSpotlightContext } from '@/context/SpotlightContext';

interface MobileNavProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onAddProductClick: () => void;
  onManageProductsClick: () => void;
  onManageCategoriesClick: () => void;
  isModalOpen?: boolean;
  isRefreshing?: boolean;
}

const navItems = [
  { id: 'home', iconOutline: HomeIconOutline, iconSolid: HomeIconSolid, label: 'Home' },
  // revert to 'preview' id to preserve existing callers
  { id: 'preview', iconOutline: BuildingStorefrontIconOutline, iconSolid: BuildingStorefrontIconSolid, label: 'Store' },
  { id: 'add', iconOutline: PlusIcon, iconSolid: PlusIcon, label: 'Upload' },
];

const MobileNav = ({ activeSection, setActiveSection, onAddProductClick, onManageProductsClick, onManageCategoriesClick, isModalOpen, isRefreshing }: MobileNavProps) => {
  const { spotlightStep, setSpotlightStep } = useSpotlightContext();

  const handleClick = (item: typeof navItems[0]) => {
    if (isRefreshing) return; // Disable nav clicks during refresh
    
    if (item.id === 'add') {
      onAddProductClick();
    } else if (item.id === 'manage') {
      onManageProductsClick();
    } else if (item.id === 'categories') {
      onManageCategoriesClick();
    } else {
      setActiveSection(item.id);
      setSpotlightStep('inactive');
    }
  };

  const HomeIconComponent = activeSection === 'home' ? HomeIconSolid : HomeIconOutline;
  const StoreIconComponent = activeSection === 'preview' ? BuildingStorefrontIconSolid : BuildingStorefrontIconOutline;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${isModalOpen ? 'opacity-0 transform-gpu translate-y-4 pointer-events-none' : 'opacity-100'} ${spotlightStep === 'nav' ? 'z-50' : ''}`}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0))' }}
    >
      <div className="relative w-full h-20">
        {/* Background bar */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-md mx-4" />

        {/* Navigation content: left / center spacer / right to perfectly center side icons around the floating + */}
        <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center px-4">
          <div className="flex-1 flex justify-center items-center">
            {/* Home button (left) - icon + label */}
            <button
              onClick={() => handleClick(navItems[0])}
              className={`flex flex-col items-center justify-center h-14 w-14 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-blue-400/50 ${activeSection === 'home' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <HomeIconComponent className="h-6 w-6" strokeWidth={activeSection === 'home' ? 2 : 1.5} />
              <span className={`text-xs font-medium mt-1 tracking-tight ${activeSection === 'home' ? 'font-semibold' : 'font-normal'}`}>Home</span>
            </button>
          </div>

          {/* Center spacer reserved for the floating + button */}
          <div className="w-16 flex justify-center items-center" aria-hidden />

          <div className="flex-1 flex justify-center items-center">
            {/* Store button (right) - icon + label */}
            <button
              onClick={() => handleClick(navItems[1])}
              className={`flex flex-col items-center justify-center h-14 w-14 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-blue-400/50 ${activeSection === 'preview' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <StoreIconComponent className="h-6 w-6" strokeWidth={activeSection === 'preview' ? 2 : 1.5} />
              <span className={`text-xs font-medium mt-1 tracking-tight ${activeSection === 'preview' ? 'font-semibold' : 'font-normal'}`}>Store</span>
            </button>
          </div>
        </div>

        {/* Centered + button */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => handleClick(navItems[2])}
            className="w-16 h-16 bg-neutral-800 dark:bg-neutral-100 rounded-full shadow-lg flex items-center justify-center text-white dark:text-black focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-background dark:focus:ring-offset-zinc-800 focus:ring-neutral-500 transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95"
            aria-label="Add product"
          >
            <PlusIcon className="h-7 w-7" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
