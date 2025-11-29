'use client';
import { Tag, Star, AlertTriangle, Eye, Gift, XCircle, RefreshCw, Archive, ShoppingCart, Share2, Lightbulb, Users, Percent, Send, Globe, Truck, TrendingUp, TrendingDown, Upload } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { useSpotlightContext } from '@/context/SpotlightContext';

// Import modal components
import PopularProductsModal from './modals/PopularProductsModal';
import LimitedStockModal from './modals/LimitedStockModal';
import TotalViewsModal from './modals/TotalViewsModal';
import StoreLinkModal from './modals/StoreLinkModal';
import { AmbassadorHubModal } from './modals/AmbassadorHubModal';
import SoldOutModal from './modals/SoldOutModal';
import TipsModal from './modals/TipsModal';
import SpotlightTooltip from '../shared/SpotlightTooltip';
import PostsComposerModal from './modals/PostsComposerModal';
import SocialPostsModal from './modals/SocialPostsModal';
import { BizconNetworkModal } from './modals/BizconNetworkModal';
import { DeliveriesHubModal } from './modals/DeliveriesHubModal';
import RevenueModal from './modals/RevenueModal';
import CommissionModal from './modals/CommissionModal';
import ExpensesModal from './modals/ExpensesModal';

// Import the customer components
import { AdminCustomersCard } from './AdminCustomersCard';
import { CustomersListModal } from './CustomersListModal';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { WholesaleData } from '../../lib/db';
import { getFirestore, collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { app as firebaseApp } from '../../lib/firebase';

interface AdminHomeCardsProps {
  products: Product[];
  categories: Category[];
  contacts: WholesaleData[];
  totalProducts: number;
  totalCategories: number;
  popularProducts: number;
  limitedStock: number;
  totalViews: number;
  storeLink: string;
  referrals: number;
  soldOut: number;
  storeId: string;
  totalOrders: number;
  uiVisible: boolean;
  totalRevenue: number;
  totalExpenses: number;
  totalCommission: number;
  totalReferralBonus: number;
  onRefresh: (showRefresh: boolean) => void;
  openManageCategories: () => void;
  onOrdersCardClick: () => void;
  onProductsCardClick: () => void;
  onAmbassadorCardClick: () => void;
  isRefreshing: boolean;
  onAnimationComplete?: () => void;
  setIsModalOpen?: (open: boolean) => void;
  setActiveSection: Dispatch<SetStateAction<string>>;
  debtors: number;
  subscriptionStatus: string;
  onReferralAdded: () => void;
  totalContacts: number;
  promoCaption?: string;
  storeName?: string;
  deliveries: number;
}

const ReferralBonusModal = ({ totalReferralBonus, handleClose }: { totalReferralBonus: number, handleClose: () => void }) => (
  <div className="p-6 text-center">
    <Gift className="w-12 h-12 mx-auto text-pink-500 mb-4" />
    <h3 className="text-2xl font-bold mb-2">Total Referral Bonus</h3>
    <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
      ₦{totalReferralBonus.toFixed(2)}
    </p>
    <p className="text-sm text-text-secondary mt-2">This is 100% of the Bizcon Network Commission paid out as bonuses to referrers.</p>
    <button onClick={handleClose} className="mt-6 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">Close</button>
  </div>
);

const cardData: { label: string, subtitle?: string, valueKey?: keyof AdminHomeCardsProps, icon: React.ElementType, gradient: string, text: string, component: React.ElementType | null, glowClass: string, isAiCard?: boolean }[] = [
  {
    label: '(Biz+Con)™',
    subtitle: 'Network',
    icon: Globe,
    gradient: 'bg-gray-700',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-slate-600/30 shadow-slate-600/50',
    isAiCard: true,
  },
  {
    label: 'Tips',
    subtitle: 'Quick Guide',
    icon: Lightbulb,
    gradient: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    text: 'text-white',
    component: TipsModal,
    glowClass: 'dark:shadow-yellow-500/30 shadow-yellow-500/50',
  },
  {
    label: 'Share',
    subtitle: 'Caption',
    valueKey: 'storeLink',
    icon: Share2,
    gradient: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600',
    text: 'text-white',
    component: StoreLinkModal,
    glowClass: 'dark:shadow-cyan-400/30 shadow-cyan-400/50',
  },
  {
    label: 'Content',
    subtitle: 'Scheduler',
    icon: Send,
    gradient: 'bg-gradient-to-br from-purple-500 to-violet-600',
    text: 'text-white',
    component: PostsComposerModal,
    glowClass: 'dark:shadow-violet-500/30 shadow-violet-500/50',
  },
  {
    label: 'Posts',
    subtitle: 'Share Products',
    icon: Upload,
    gradient: 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-pink-500/30 shadow-pink-500/50',
  },

  {
    label: 'Revenue',
    valueKey: 'totalRevenue',
    icon: TrendingUp,
    gradient: 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-green-500/30 shadow-green-500/50',
  },
  {
    label: 'Expenses',
    valueKey: 'totalExpenses',
    icon: TrendingDown,
    gradient: 'bg-gradient-to-br from-orange-500 via-red-500 to-red-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-orange-500/30 shadow-orange-500/50',
  },
  {
    label: 'Ambassador',
    valueKey: 'referrals',
    icon: Star,
    gradient: 'bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-blue-600/30 shadow-blue-600/50',
  },
  {
    label: 'Views',
    valueKey: 'totalViews',
    icon: Eye,
    gradient: 'bg-gradient-to-br from-sky-400 to-blue-500',
    text: 'text-white',
    component: TotalViewsModal,
    glowClass: 'dark:shadow-sky-500/30 shadow-sky-500/50',
  },
  {
    label: 'Orders',
    valueKey: 'totalOrders',
    icon: ShoppingCart,
    gradient: 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-orange-500/30 shadow-orange-500/50',
  },
  {
    label: 'Deliveries',
    valueKey: 'deliveries',
    icon: Truck,
    gradient: 'bg-gradient-to-br from-lime-500 via-green-600 to-emerald-700',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-green-500/30 shadow-green-500/50',
  },
  {
    label: 'Manage Categories',
    valueKey: 'totalCategories',
    icon: Tag,
    gradient: 'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-orange-500/30 shadow-orange-500/50',
  },
  {
    label: 'Manage Products',
    valueKey: 'totalProducts',
    icon: Archive,
    gradient: 'bg-gradient-to-br from-blue-600 to-indigo-800',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-blue-600/30 shadow-blue-600/50',
  },
];

const formatCurrencyForCard = (amount: number) => {
  if (typeof amount !== 'number') return '₦0';
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₦${(amount / 1000).toFixed(0)}K`;
  }
  return `₦${amount.toFixed(0)}`;
};

export default function AdminHomeCards(props: AdminHomeCardsProps) {
  const { spotlightStep, completeSpotlight } = useSpotlightContext();
  const [openModal, setOpenModal] = useState<number | null>(null);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [isViewsModalOpen, setIsViewsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const [isPostsModalOpen, setIsPostsModalOpen] = useState(false);
  const [isSocialPostsModalOpen, setIsSocialPostsModalOpen] = useState(false);
  const [isBizconNetworkModalOpen, setIsBizconNetworkModalOpen] = useState(false);
  const [isDeliveriesHubModalOpen, setIsDeliveriesHubModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [showPostsNotification, setShowPostsNotification] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { setIsModalOpen, onRefresh, uiVisible, onAnimationComplete, onOrdersCardClick, onProductsCardClick, storeId, onAmbassadorCardClick } = props;

  useEffect(() => {
    if (!storeId) return;

    const db = getFirestore(firebaseApp);
    const schedulesRef = collection(db, 'stores', storeId, 'posts');

    const now = Timestamp.now();
    const thirtyMinutesFromNow = new Timestamp(now.seconds + 30 * 60, now.nanoseconds);

    const q = query(
      schedulesRef,
      where('status', '==', 'scheduled'),
      where('scheduledTime', '>=', now),
      where('scheduledTime', '<', thirtyMinutesFromNow)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setShowPostsNotification(!snapshot.empty);
    }, (error) => {
      console.error("Error fetching upcoming schedules:", error);
      setShowPostsNotification(false);
    });

    return () => unsubscribe();
  }, [storeId]);

  const ordersIndex = cardData.findIndex(card => card.label === 'Orders');
  const cardsToRender = [...cardData];
  const customersCard: typeof cardData[0] = {
    label: 'Customers',
    icon: Users,
    gradient: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700',
    text: 'text-white',
    component: AdminCustomersCard,
    glowClass: 'dark:shadow-violet-500/30 shadow-violet-500/50'
  };

  if (ordersIndex !== -1) {
    cardsToRender.splice(ordersIndex + 1, 0, customersCard);
  }

  useEffect(() => {
    const modalIsOpen = openModal !== null || isTipsModalOpen || isCustomersModalOpen || isViewsModalOpen || isShareModalOpen || isPostsModalOpen || isSocialPostsModalOpen || isBizconNetworkModalOpen || isDeliveriesHubModalOpen || isRevenueModalOpen || isCommissionModalOpen || isExpensesModalOpen;
    if (modalIsOpen) {
      window.history.pushState({ modalOpen: true }, '');
      const handlePopState = () => {
        setOpenModal(null);
        setIsTipsModalOpen(false);
        setIsCustomersModalOpen(false);
        setIsViewsModalOpen(false);
        setIsShareModalOpen(false);
        setIsPostsModalOpen(false);
        setIsSocialPostsModalOpen(false);
        setIsBizconNetworkModalOpen(false);
        setIsDeliveriesHubModalOpen(false);
        setIsRevenueModalOpen(false);
        setIsCommissionModalOpen(false);
        setIsExpensesModalOpen(false);
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
  }, [openModal, isTipsModalOpen, isCustomersModalOpen, isViewsModalOpen, isShareModalOpen, isPostsModalOpen, isSocialPostsModalOpen, isBizconNetworkModalOpen, isDeliveriesHubModalOpen, isRevenueModalOpen, isCommissionModalOpen, isExpensesModalOpen, setIsModalOpen]);

  const handleOpenModal = (idx: number, cardLabel?: string) => {
    if (cardLabel === '(Biz+Con)™') setIsBizconNetworkModalOpen(true);
    else if (cardLabel === 'Tips') setIsTipsModalOpen(true);
    else if (cardLabel === 'Views') setIsViewsModalOpen(true);
    else if (cardLabel === 'Share') setIsShareModalOpen(true);
    else if (cardLabel === 'Content') setIsPostsModalOpen(true);
    else if (cardLabel === 'Posts') setIsSocialPostsModalOpen(true);
    else if (cardLabel === 'Commission') setIsCommissionModalOpen(true);
    else if (cardLabel === 'Ambassador') onAmbassadorCardClick();
    else if (cardLabel === 'Manage Categories') props.openManageCategories();
    else if (cardLabel === 'Orders') onOrdersCardClick();
    else if (cardLabel === 'Manage Products') onProductsCardClick();
    else if (cardLabel === 'Deliveries') setIsDeliveriesHubModalOpen(true);
    else if (cardLabel === 'Revenue') setIsRevenueModalOpen(true);
    else if (cardLabel === 'Expenses') setIsExpensesModalOpen(true);
    else setOpenModal(idx);

    if (props.setIsModalOpen && cardLabel !== 'Orders' && cardLabel !== 'Manage Products') props.setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  };

  const handleCloseTipsModal = () => {
    setIsTipsModalOpen(false);
    if (spotlightStep === 'tips') {
      completeSpotlight();
    }
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  };

  const handleClosePostsModal = () => {
    setIsPostsModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseSocialPostsModal = () => {
    setIsSocialPostsModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseBizconNetworkModal = () => {
    setIsBizconNetworkModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseDeliveriesHubModal = () => {
    setIsDeliveriesHubModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseRevenueModal = () => {
    setIsRevenueModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseCommissionModal = () => {
    setIsCommissionModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseExpensesModal = () => {
    setIsExpensesModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };
  const modalVariants: Variants = { hidden: { opacity: 0, scale: 0.95, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } }, exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2, ease: 'easeOut' } } };

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
          className="col-span-2 sm:col-span-3 md:col-span-4 w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white font-bold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center dark:hover:shadow-lg dark:hover:shadow-blue-700/30"
        >
          <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:col-span-4 gap-2 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate={uiVisible ? 'visible' : 'hidden'}
        onAnimationComplete={() => onAnimationComplete?.()}
      >
        <style jsx>{`
                .card-blob { position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 70%); filter: blur(8px); animation: blobMove 4s infinite alternate ease-in-out; z-index: 0; }
                @keyframes blobMove { 0% { transform: scale(1) translateY(0); } 100% { transform: scale(1.05) translateY(3px); } }
                .dashboard-card { min-width: 0; max-width: 100%; word-wrap: break-word; overflow: hidden; }
                .ai-text-gradient {
                    background: linear-gradient(90deg, #fde047, #22d3ee, #a855f7, #ec4899, #4ade80, #f97316, #fde047);
                    background-size: 400% 100%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    color: transparent;
                    animation: ai-gradient-flow 10s linear infinite;
                }
                .ai-icon-glow {
                    animation: ai-icon-glow-anim 10s linear infinite;
                }
                @keyframes ai-gradient-flow {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                @keyframes ai-icon-glow-anim {
                    0%, 100% { stroke: #fde047; }
                    16% { stroke: #22d3ee; }
                    32% { stroke: #a855f7; }
                    48% { stroke: #ec4899; }
                    64% { stroke: #4ade80; }
                    80% { stroke: #f97316; }
                }
            `}</style>

        {cardsToRender.map((card, idx) => {
          if (card.label === 'Customers' && card.component === AdminCustomersCard) {
            return (
              <motion.div key="customers-card" variants={itemVariants}>
                <AdminCustomersCard storeId={props.storeId} onClick={() => { setIsCustomersModalOpen(true); if (props.setIsModalOpen) props.setIsModalOpen(true); }} gradient={customersCard.gradient} glowClass={customersCard.glowClass} />
              </motion.div>
            );
          }

          const Icon = card.icon;
          const isHorizontal = card.label === 'Share' || card.label === 'Tips' || card.label === 'Content' || card.label === '(Biz+Con)™';
          const isTipsCard = card.label === 'Tips';
          const isPostsCard = card.label === 'Content';
          const spotlightClasses = spotlightStep === 'tips' && isTipsCard ? 'relative z-50 pointer-events-auto' : '';

          if (isHorizontal) {
            return (
              <motion.div key={card.label} variants={itemVariants} className={`relative ${spotlightClasses}`}>
                <button className={`dashboard-card relative flex flex-row items-center justify-center rounded-2xl p-3 md:p-4 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${card.gradient} ${card.text} ${card.glowClass} w-full h-full min-h-[7rem]`} tabIndex={0} type="button" onClick={() => handleOpenModal(idx, card.label)}>
                  {isPostsCard && showPostsNotification && (<span className="absolute top-2 right-2 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>)}
                  <span className="card-blob" />
                  <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white bg-opacity-20 shadow`}><Icon className={`w-5 h-5 sm:w-6 sm:h-6 drop-shadow ${card.isAiCard ? 'ai-icon-glow' : ''}`} /></div>
                  <div className="flex flex-col items-center ml-3 min-w-0 z-10">
                    <div className={`text-base sm:text-lg font-bold drop-shadow ${card.isAiCard ? 'ai-text-gradient' : ''}`}>{card.label}</div>
                    {card.subtitle && <div className={`text-xs sm:text-sm font-medium opacity-90 text-center leading-tight ${card.isAiCard ? 'ai-text-gradient' : ''}`}>{card.subtitle}</div>}
                  </div>
                </button>
                {spotlightStep === 'tips' && isTipsCard && (<SpotlightTooltip text="Check here for helpful tips and stats about your dashboard." className="top-full mt-5 left-1/2 -translate-x-1/2" />)}
              </motion.div>
            );
          } else {
            return (
              <motion.div key={card.label} variants={itemVariants}>
                <button className={`dashboard-card relative flex flex-col items-center justify-center rounded-2xl p-2 sm:p-3 md:p-4 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${card.gradient} ${card.text} ${card.glowClass} w-full h-full min-h-[7rem]`} tabIndex={0} type="button" onClick={() => handleOpenModal(idx, card.label)}>
                  <span className="card-blob" />
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white bg-opacity-20 mb-1 sm:mb-2 shadow">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 drop-shadow" />
                  </div>
                  <div className="flex flex-col items-center min-w-0 z-10 w-full">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold drop-shadow">
                      {(() => {
                        const value = card.valueKey ? (props as any)[card.valueKey] : '';
                        if (card.label === 'Commission') return formatCurrencyForCard(props.totalCommission);
                        if (card.label === 'Bonus') return formatCurrencyForCard(props.totalReferralBonus);
                        if (card.label === 'Revenue') return formatCurrencyForCard(props.totalRevenue);
                        if (card.label === 'Expenses') return formatCurrencyForCard(props.totalExpenses + props.totalCommission);
                        if (card.label === 'Ambassador') return props.referrals;
                        if (card.label === 'Deliveries') return 0;
                        if (typeof value === 'number' || typeof value === 'string') return value;
                        return '';
                      })()}
                    </div>
                    <div className="text-xs sm:text-sm font-medium opacity-90 text-center px-1 leading-tight">
                      {card.label === 'Manage Categories' ? 'Categories' : card.label === 'Manage Products' ? 'Products' : card.label}
                    </div>
                    {card.subtitle && <div className="text-xs opacity-70 mt-1">{card.subtitle}</div>}
                  </div>
                </button>
              </motion.div>
            );
          }
        })}
      </motion.div>

      {/* === MODAL RENDERERS === */}

      <CustomersListModal storeId={props.storeId} isOpen={isCustomersModalOpen} onClose={() => { setIsCustomersModalOpen(false); if (props.setIsModalOpen) props.setIsModalOpen(false); }} />

      {isTipsModalOpen && (<TipsModal {...props as AdminHomeCardsProps & { handleClose: () => void; }} handleClose={handleCloseTipsModal} />)}

      {isViewsModalOpen && (<TotalViewsModal storeId={storeId} isOpen={isViewsModalOpen} onClose={() => { setIsViewsModalOpen(false); if (props.setIsModalOpen) props.setIsModalOpen(false); }} />)}

      {isShareModalOpen && (<StoreLinkModal {...props} isOpen={isShareModalOpen} handleClose={() => { setIsShareModalOpen(false); if (props.setIsModalOpen) props.setIsModalOpen(false); }} />)}

      {isPostsModalOpen && (<PostsComposerModal isOpen={isPostsModalOpen} onClose={handleClosePostsModal} storeId={props.storeId} contacts={props.contacts} products={props.products} storeName={props.storeName} />)}

      {isSocialPostsModalOpen && (
        <SocialPostsModal
          isOpen={isSocialPostsModalOpen}
          onClose={handleCloseSocialPostsModal}
          storeId={props.storeId}
          storeName={props.storeName || ''}
          products={props.products}
        />
      )}

      {isBizconNetworkModalOpen && (<BizconNetworkModal isOpen={isBizconNetworkModalOpen} onClose={handleCloseBizconNetworkModal} />)}

      {isDeliveriesHubModalOpen && (<DeliveriesHubModal isOpen={isDeliveriesHubModalOpen} onClose={handleCloseDeliveriesHubModal} storeId={storeId} />)}

      {isRevenueModalOpen && (<RevenueModal isOpen={isRevenueModalOpen} onClose={handleCloseRevenueModal} storeId={storeId} />)}

      {isCommissionModalOpen && (<CommissionModal isOpen={isCommissionModalOpen} onClose={handleCloseCommissionModal} storeId={storeId} />)}

      {isExpensesModalOpen && (
        <ExpensesModal
          isOpen={isExpensesModalOpen}
          onClose={handleCloseExpensesModal}
          totalCommission={props.totalCommission}
          totalExpenses={props.totalExpenses}
        />
      )}

      {openModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md" onClick={handleCloseModal}>
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalVariants} className="relative w-full max-w-sm sm:max-w-md md:max-w-lg mx-2 sm:mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {(() => {
              const card = cardsToRender[openModal];
              if (!card || !card.component || ['Views', 'Share', 'Content'].includes(card.label)) return null;
              const ModalComponent = card.component;
              const modalProps = { ...props, handleClose: handleCloseModal };
              return <ModalComponent {...modalProps} />;
            })()}
          </motion.div>
        </div>
      )}
    </section>
  );
}
