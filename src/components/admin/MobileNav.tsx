import React from 'react';
import {
  HomeIcon as HomeIconOutline,
  CubeIcon as CubeIconOutline,
  TagIcon as TagIconOutline,
  BuildingStorefrontIcon as BuildingStorefrontIconOutline,
  PlusIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CubeIcon as CubeIconSolid,
  TagIcon as TagIconSolid,
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
}

const navItems = [
  { id: 'home', iconOutline: HomeIconOutline, iconSolid: HomeIconSolid, label: 'Home' },
  { id: 'preview', iconOutline: BuildingStorefrontIconOutline, iconSolid: BuildingStorefrontIconSolid, label: 'Store' },
  { id: 'add', iconOutline: PlusIcon, iconSolid: PlusIcon, label: 'Upload' },
  { id: 'manage', iconOutline: CubeIconOutline, iconSolid: CubeIconSolid, label: 'Products' },
  { id: 'categories', iconOutline: TagIconOutline, iconSolid: TagIconSolid, label: 'Categories' },
];

const MobileNav = ({ activeSection, setActiveSection, onAddProductClick, onManageProductsClick, onManageCategoriesClick, isModalOpen }: MobileNavProps) => {
  const { spotlightStep, setSpotlightStep } = useSpotlightContext();

  const handleClick = (item: typeof navItems[0]) => {
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

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${isModalOpen ? 'opacity-0 transform-gpu translate-y-4 pointer-events-none' : 'opacity-100'} ${spotlightStep === 'nav' ? 'z-50' : ''}`}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0))' }}
    >
      <div className="relative w-full max-w-md mx-auto h-16">
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-md" />

        <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-around">
          {navItems.map((item) => {
            if (item.id === 'add') {
              const IconComponent = item.iconOutline;
              return (
                <div key={item.id} className="relative w-16 h-16">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-white/70 dark:bg-zinc-800/70 rounded-full border-t border-t-gray-200 dark:border-t-zinc-700" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }} />

                  <button
                    onClick={() => handleClick(item)}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 w-16 h-16 bg-neutral-800 dark:bg-neutral-100 rounded-full shadow-lg flex items-center justify-center text-white dark:text-black focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-background dark:focus:ring-offset-zinc-800 focus:ring-neutral-500 transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95"
                    aria-label={item.label}
                  >
                    <IconComponent className="h-7 w-7" strokeWidth={2.2} />
                  </button>
                </div>
              );
            }

            const isModalButton = item.id === 'manage' || item.id === 'categories';
            const isActive = activeSection === item.id && !isModalButton;
            const IconComponent = isActive ? item.iconSolid : item.iconOutline;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className={`flex flex-col items-center justify-center h-14 w-16 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-blue-400/50 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-neutral-400'
                  }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <IconComponent className="h-6 w-6" strokeWidth={isActive ? 2 : 1.5} />
                <span className={`text-xs font-medium mt-1 tracking-tight ${isActive ? 'font-semibold' : 'font-normal'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
