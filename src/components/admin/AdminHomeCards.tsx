'use client';
import { Tag, Star, AlertTriangle, Eye, Layers, CheckCircle, Gift, XCircle, RefreshCw, Archive, Handshake, ShoppingCart, Share2, BadgeDollarSign, Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSpotlightContext } from '@/context/SpotlightContext';

// Import the new modal components
import TotalProductsModal from './modals/TotalProductsModal';
import CategoriesModal from './modals/CategoriesModal';
import PopularProductsModal from './modals/PopularProductsModal';
import LimitedStockModal from './modals/LimitedStockModal';
import TotalViewsModal from './modals/TotalViewsModal';

import StoreLinkModal from './modals/StoreLinkModal';
import SubscriptionModal from './modals/SubscriptionModal';
import ReferralsModal from './modals/ReferralsModal';
import SoldOutModal from './modals/SoldOutModal';

import RevenueModal from './modals/RevenueModal';
import TipsModal from './modals/TipsModal';
import { Product } from '../../types/product';
import { WholesaleData } from '../../lib/db';
import SpotlightTooltip from '../shared/SpotlightTooltip';

interface AdminHomeCardsProps {
  totalProducts: number;
  totalCategories: number;
  popularProducts: number;
  limitedStock: number;
  totalViews: number;
  debtors: number;
  subscriptionStatus: string;
  products: Product[];
  categories: { id: string; name: string }[];
  contacts: WholesaleData[];
  setActiveSection: (section: string) => void;
  storeLink: string;
  referrals: number;
  onReferralAdded?: () => void;
  setIsModalOpen?: (open: boolean) => void;
  soldOut: number;
  setManageTab: (tab: 'all' | 'popular' | 'limited' | 'soldout') => void;
  setIsManageProductsOpen?: (open: boolean) => void;
  onRefresh: (showRefresh: boolean) => void;
  isRefreshing: boolean;
  totalContacts: number;
  storeId: string; // Added storeId
  totalOrders: number;
  promoCaption?: string;
  uiVisible: boolean;
  storeName?: string;
  totalRevenue: number;
  onAnimationComplete?: () => void;
  openManageCategories: () => void;
  onOrdersCardClick: () => void; // New callback for orders card
}

const cardData = [
    {
        label: 'Tips',
        subtitle: 'Quick Guide',
        icon: Lightbulb,
        gradient: 'from-amber-400 to-yellow-500',
        text: 'text-white',
        component: TipsModal,
        glowClass: 'shadow-[0_0_25px_-5px_rgba(245,158,11,0.5)]',
    },
    {
      label: 'Share',
      subtitle: 'Caption',
      valueKey: 'storeLink',
      icon: Share2,
      gradient: 'from-purple-500 to-indigo-600',
      text: 'text-white',
      component: StoreLinkModal,
      glowClass: 'shadow-[0_0_25px_-5px_rgba(168,85,247,0.5)]',
    },
    {
      label: 'Views',
      valueKey: 'totalViews',
      icon: Eye,
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      text: 'text-white',
      component: TotalViewsModal,
      glowClass: 'shadow-[0_0_25px_-5px_rgba(59,130,246,0.5)]',
    },
    {
      label: 'Manage Categories',
      valueKey: 'totalCategories',
      icon: Tag,
      gradient: 'from-teal-400 via-cyan-500 to-sky-600',
      text: 'text-white',
      component: null, // This will be handled by a specific prop
      glowClass: 'shadow-[0_0_25px_-5px_rgba(20,184,166,0.5)]',
    },
    {
      label: 'Manage Products',
      valueKey: 'totalProducts',
      icon: Archive,
      gradient: 'from-pink-400 via-pink-500 to-pink-600',
      text: 'text-white',
      component: TotalProductsModal,
      glowClass: 'shadow-[0_0_25px_-5px_rgba(236,72,153,0.5)]',
    },
    {
      label: 'Popular',
      valueKey: 'popularProducts',
      icon: Star,
      gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
      text: 'text-white',
      component: PopularProductsModal,
      glowClass: 'shadow-[0_0_25px_-5px_rgba(234,179,8,0.5)]',
    },
    {
      label: 'Limited',
      valueKey: 'limitedStock',
      icon: AlertTriangle,
      gradient: 'from-orange-400 via-orange-500 to-orange-600',
      text: 'text-white',
      component: LimitedStockModal,
      glowClass: 'shadow-[0_0_25px_-5px_rgba(249,115,22,0.5)]',
    },
    {
      label: 'Sold Out',
      valueKey: 'soldOut',
      icon: XCircle,
      gradient: 'from-red-400 via-red-500 to-red-600',
      text: 'text-white',
      component: SoldOutModal,
      glowClass: 'shadow-[0_0_25px_-5px_rgba(239,68,68,0.5)]',
    },
    {
      label: 'Orders',
      valueKey: 'totalOrders',
      icon: ShoppingCart,
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      text: 'text-white',
      component: null, // Set to null, will be handled by onOrdersCardClick
      glowClass: 'shadow-[0_0_25px_-5px_rgba(59,130,246,0.5)]',
    },
    {
      label: 'Revenue',
      valueKey: 'totalRevenue',
      icon: BadgeDollarSign,
      gradient: 'from-green-500 to-emerald-600',
      text: 'text-white',
      component: RevenueModal,
      glowClass: 'shadow-[0_0_25px_-5px_rgba(22,163,74,0.5)]',
    },
    {
      label: 'Referrals',
      valueKey: 'referrals',
      icon: Gift,
      gradient: 'from-orange-400 via-red-400 to-pink-500',
      text: 'text-white',
      component: ReferralsModal,
      glowClass: 'shadow-[0_0_25px_-5px_rgba(244,63,94,0.5)]',
    },
  ];

const formatCurrencyForCard = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  };

export default function AdminHomeCards(props: AdminHomeCardsProps) {
  const { spotlightStep, setSpotlightStep } = useSpotlightContext();
  const [openModal, setOpenModal] = useState<number | null>(null);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { setIsModalOpen, onRefresh, uiVisible, onAnimationComplete, onOrdersCardClick } = props;

  useEffect(() => {
    const modalIsOpen = openModal !== null || isTipsModalOpen;
    if (modalIsOpen) {
      window.history.pushState({ modalOpen: true }, '');
      const handlePopState = () => {
        setOpenModal(null);
        setIsTipsModalOpen(false);
        if (setIsModalOpen) setIsModalOpen(false);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state && window.history.state.modalOpen) {
          window.history.back();
        }
      };
    }
  }, [openModal, isTipsModalOpen, setIsModalOpen]);

  const handleOpenModal = (idx: number, cardLabel?: string) => {
    if (cardLabel === 'Tips') {
      setIsTipsModalOpen(true);
    } else if (cardLabel === 'Manage Categories') {
      props.openManageCategories();
    } else if (cardLabel === 'Orders') {
      onOrdersCardClick(); // Use the new callback
    } else {
      setOpenModal(idx);
    }
    if (props.setIsModalOpen && cardLabel !== 'Orders') props.setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  };
  
  const handleCloseTipsModal = () => {
    setIsTipsModalOpen(false);
    if (spotlightStep === 'tips') {
      setSpotlightStep('nav');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="mb-4">
            <button
                onClick={async () => {
                  setRefreshing(true);
                  await onRefresh(true);
                  setRefreshing(false);
                }}
                disabled={refreshing}
                className="col-span-2 sm:col-span-3 md:col-span-4 w-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center dark:hover:shadow-lg dark:hover:shadow-purple-500/30"
            >
                <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
        </div>
        <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate={uiVisible ? 'visible' : 'hidden'}
            onAnimationComplete={() => onAnimationComplete?.()}
        >
            <style jsx>{`
              .card-blob {
                position: absolute;
                top: -10px;
                right: -10px;
                width: 40px;
                height: 40px;
                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 70%);
                filter: blur(8px);
                animation: blobMove 4s infinite alternate ease-in-out;
                z-index: 0;
              }
              @keyframes blobMove {
                0% { transform: scale(1) translateY(0); }
                100% { transform: scale(1.05) translateY(3px); }
              }
              .dashboard-card {
                min-width: 0;
                max-width: 100%;
                word-wrap: break-word;
                overflow: hidden;
              }
            `}</style>
            {cardData.map((card, idx) => {
              const Icon = card.icon;
              const isHorizontal = card.label === 'Share' || card.label === 'Tips';
              const isTipsCard = card.label === 'Tips';
              const spotlightClasses = spotlightStep === 'tips' && isTipsCard ? 'relative z-50 pointer-events-auto' : '';

              if (isHorizontal) {
                // Horizontal Layout for Share, Subscription, and Tips
                return (
                  <motion.div key={card.label} variants={itemVariants} className={`relative ${spotlightClasses}`}>
                    <button
                      className={`dashboard-card relative flex flex-row items-center justify-center rounded-2xl p-3 md:p-4 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden bg-gradient-to-br ${card.gradient} ${card.text} ${card.glowClass} w-full h-full min-h-[7rem]`}
                      tabIndex={0}
                      type="button"
                      onClick={() => handleOpenModal(idx, card.label)}
                    >
                      <span className="card-blob" />
                      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white bg-opacity-20 shadow">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
                      </div>
                      <div className="flex flex-col items-center ml-3 min-w-0 z-10">
                        <div className="text-lg sm:text-xl font-bold drop-shadow">
                          {card.label === 'Subscription'
                            ? props.subscriptionStatus
                            : card.label}
                        </div>
                        <div className="text-xs sm:text-sm font-medium opacity-90 text-center leading-tight">
                          {card.subtitle}
                        </div>
                      </div>
                    </button>
                    {spotlightStep === 'tips' && isTipsCard && (
                      <SpotlightTooltip 
                        text="Check here for helpful tips and stats about your dashboard."
                        className="top-full mt-5 left-1/2 -translate-x-1/2"
                      />
                    )}
                  </motion.div>
                );
              } else {
                // Original Vertical Layout for all other cards
                return (
                  <motion.div key={card.label} variants={itemVariants}>
                    <button
                      className={`dashboard-card relative flex flex-col items-center justify-center rounded-2xl p-2 sm:p-3 md:p-4 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden bg-gradient-to-br ${card.gradient} ${card.text} ${card.glowClass} w-full h-full min-h-[7rem]`}
                      tabIndex={0}
                      type="button"
                      onClick={() => handleOpenModal(idx, card.label)}
                    >
                      <span className="card-blob" />
                      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white bg-opacity-20 mb-1 sm:mb-2 shadow">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 drop-shadow" />
                      </div>
                      <div className="flex flex-col items-center min-w-0 z-10 w-full">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold drop-shadow">
                          {card.label === 'Revenue'
                              ? formatCurrencyForCard(props.totalRevenue)
                              : card.label === 'Contacts'
                                ? props.totalContacts
                                : card.label === 'Sold Out'
                                  ? props.soldOut
                                  : (() => {
                                      const value = props[card.valueKey as keyof AdminHomeCardsProps];
                                      if (typeof value === 'number' || typeof value === 'string') return value;
                                      return '';
                                    })()}
                        </div>
                        <div className="text-xs sm:text-sm font-medium opacity-90 text-center px-1 leading-tight">
                          {card.label === 'Manage Categories' ? 'Categories' : card.label === 'Manage Products' ? 'Products' : card.label}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              }
            })}
        </motion.div>

      {isTipsModalOpen && (
        <TipsModal {...props} handleClose={handleCloseTipsModal} />
      )}

      {openModal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md md:max-w-lg mx-2 sm:mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col items-center animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const card = cardData[openModal];
              const ModalComponent = card.component;
              if (!ModalComponent) return null;
              const modalProps = {
                ...props,
                handleClose: handleCloseModal,
                setIsManageProductsOpen: props.setIsManageProductsOpen || (() => {}),
                onContactAdded: () => props.onRefresh(true),
                storeName: props.storeName,
                categories: props.categories,
              };
              return <ModalComponent {...modalProps} />;
              
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
