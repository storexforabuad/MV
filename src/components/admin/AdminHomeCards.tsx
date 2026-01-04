'use client';
import { Tag, Star, AlertTriangle, Eye, Gift, XCircle, RefreshCw, Archive, ShoppingCart, Share2, Lightbulb, Users, Percent, Send, Globe, Truck, TrendingUp, TrendingDown, Upload, Megaphone, CalendarDays, CheckCircle2, Briefcase, ShieldCheck } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useVendor } from '@/context/VendorContext';
import { motion, Variants } from 'framer-motion';
import { useSpotlightContext } from '@/context/SpotlightContext';

// Import modal components

import TotalViewsModal from './modals/TotalViewsModal';
import StoreLinkModal from './modals/StoreLinkModal';
import { AmbassadorHubModal } from './modals/AmbassadorHubModal';

import TipsModal from './modals/TipsModal';
import AccountModal from './modals/AccountModal';
import SpotlightTooltip from '../shared/SpotlightTooltip';
import PostsComposerModal from './modals/PostsComposerModal';
import AddPitchComposer from '../pitch/AddPitchComposer';
import AdminBookingsModal from './modals/AdminBookingsModal';
import SocialPostsModal from './modals/SocialPostsModal';
import { BizconNetworkModal } from './modals/BizconNetworkModal';
import { DeliveriesHubModal } from './modals/DeliveriesHubModal';
import RevenueModal from './modals/RevenueModal';
import CommissionModal from './modals/CommissionModal';
import PayCommissionModal from './modals/PayCommissionModal';
import ExpensesModal from './modals/ExpensesModal';
import { AdvertisingModal } from './modals/AdvertisingModal';
import { EventsModal } from './modals/EventsModal';
import SubscriptionModal from './modals/SubscriptionModal';

// Import the customer components
import { AdminCustomersCard } from './AdminCustomersCard';
import { CustomersListModal } from './CustomersListModal';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { WholesaleData } from '../../lib/db';
import { getFirestore, collection, onSnapshot, query, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { app as firebaseApp } from '../../lib/firebase';

interface AdminHomeCardsProps {
  products: Product[];
  categories: Category[];
  contacts: WholesaleData[];
  storeType?: string;
  totalProducts: number;
  totalCategories: number;
  totalViews: number;
  storeLink: string;
  referrals: number;

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
  ambassadorTier?: string;
  ceoEmail?: string; // For subscription modal
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
    gradient: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600',
    text: 'text-white',
    component: TipsModal,
    glowClass: 'dark:shadow-yellow-500/30 shadow-yellow-500/50',
  },
  {
    label: 'Events',
    icon: CalendarDays,
    gradient: 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-pink-500/30 shadow-pink-500/50',
  },
  /* {
    label: 'Advert',
    subtitle: 'Boost Sales',
    icon: Megaphone,
    gradient: 'bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-pink-500/30 shadow-pink-500/50',
  }, */

  {
    label: 'Share',
    subtitle: 'Content',
    icon: Send,
    gradient: 'bg-gradient-to-br from-purple-500 to-violet-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-violet-500/30 shadow-violet-500/50',
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
    gradient: 'bg-gradient-to-br from-amber-600 via-orange-700 to-yellow-800', // Default bronze, will be overridden
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-orange-500/30 shadow-orange-500/50',
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
  {
    label: 'Account',
    subtitle: 'Details',
    icon: Briefcase,
    gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    text: 'text-white',
    component: AccountModal,
    glowClass: 'dark:shadow-indigo-500/30 shadow-indigo-500/50',
  },
  {
    label: 'Subscription',
    subtitle: 'Manage',
    icon: ShieldCheck,
    gradient: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700',
    text: 'text-white',
    component: SubscriptionModal,
    glowClass: 'dark:shadow-teal-500/30 shadow-teal-500/50',
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

import { sendVendorNotification } from '@/app/actions/sendVendorNotification';

const handleTestNotification = async (storeId: string) => {
  if (!confirm('Send test notification?')) return;
  try {
    const result = await sendVendorNotification(storeId, 'TEST-ORDER-123', 'Test Customer');
    if (result.success) {
      alert('Test notification sent! Check your other device.');
    } else {
      alert(`Failed: ${result.error}`);
    }
  } catch (error: any) {
    alert(`Error: ${error.message}`);
  }
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
  const [isPayCommissionOpen, setIsPayCommissionOpen] = useState(false);
  const [isAddPitchOpen, setIsAddPitchOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isAdvertisingModalOpen, setIsAdvertisingModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [showPostsNotification, setShowPostsNotification] = useState(false);
  const [bankAccountName, setBankAccountName] = useState<string | null>(null);
  const [bankAccountNumber, setBankAccountNumber] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { setIsModalOpen, onRefresh, uiVisible, onAnimationComplete, onOrdersCardClick, onProductsCardClick, storeId, onAmbassadorCardClick } = props;
  const { vendor, promptLogin } = useVendor();

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

  // Fetch store bank details for Account card preview
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!storeId) return;
      try {
        const db = getFirestore(firebaseApp);
        const storeRef = doc(db, 'stores', storeId);
        const snap = await getDoc(storeRef);
        if (mounted && snap.exists()) {
          const data = snap.data() as any;
          setBankAccountName(data.bankAccountName || null);
          setBankAccountNumber(data.bankAccountNumber || null);
          setBankName(data.bankName || null);
        }
      } catch (err) {
        console.error('Failed to load store bank details', err);
      }
    })();
    return () => { mounted = false; };
  }, [storeId]);

  const ordersIndex = cardData.findIndex(card => card.label === 'Orders');
  const cardsToRender = [...cardData];
  const customersCard: typeof cardData[0] = {
    label: 'Customers',
    icon: Users,
    gradient: 'bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800',
    text: 'text-white',
    component: AdminCustomersCard,
    glowClass: 'dark:shadow-blue-600/30 shadow-blue-600/50'
  };

  if (ordersIndex !== -1) {
    cardsToRender.splice(ordersIndex + 1, 0, customersCard);
  }

  useEffect(() => {
    const modalIsOpen = openModal !== null || isTipsModalOpen || isCustomersModalOpen || isViewsModalOpen || isShareModalOpen || isPostsModalOpen || isSocialPostsModalOpen || isBizconNetworkModalOpen || isDeliveriesHubModalOpen || isRevenueModalOpen || isCommissionModalOpen || isExpensesModalOpen || isAdvertisingModalOpen || isEventsModalOpen || isSubscriptionModalOpen || isAccountModalOpen;
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
        setIsAdvertisingModalOpen(false);
        setIsEventsModalOpen(false);
        setIsSubscriptionModalOpen(false);
        setIsAccountModalOpen(false);
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
  }, [openModal, isTipsModalOpen, isCustomersModalOpen, isViewsModalOpen, isShareModalOpen, isPostsModalOpen, isSocialPostsModalOpen, isBizconNetworkModalOpen, isDeliveriesHubModalOpen, isRevenueModalOpen, isCommissionModalOpen, isExpensesModalOpen, isAdvertisingModalOpen, isEventsModalOpen, isSubscriptionModalOpen, isAccountModalOpen, setIsModalOpen]);

  const handleOpenModal = (idx: number, card: typeof cardData[0]) => {
    const { label, subtitle } = card;
    if (label === '(Biz+Con)™') setIsBizconNetworkModalOpen(true);
    else if (label === 'Tips') setIsTipsModalOpen(true);
    else if (label === 'Views') setIsViewsModalOpen(true);
    else if (label === 'Share') {
      if (subtitle === 'Content') setIsSocialPostsModalOpen(true);
      else setIsShareModalOpen(true);
    }
    else if (label === 'Content') setIsPostsModalOpen(true);
    else if (label === 'Commission') setIsCommissionModalOpen(true);
    else if (label === 'Ambassador') onAmbassadorCardClick();
    else if (label === 'Manage Categories') props.openManageCategories();
    else if (label === 'Orders') onOrdersCardClick();
    else if (label === 'Manage Products') onProductsCardClick();
    else if (label === 'Deliveries') setIsDeliveriesHubModalOpen(true);
    else if (label === 'Revenue') setIsRevenueModalOpen(true);
    else if (label === 'Expenses') setIsExpensesModalOpen(true);
    else if (label === 'Advert') setIsAdvertisingModalOpen(true);
    else if (label === 'Events') setIsEventsModalOpen(true);
    else if (label === 'Subscription') setIsSubscriptionModalOpen(true);
    else if (label === 'Account') setIsAccountModalOpen(true);
    else setOpenModal(idx);

    if (props.setIsModalOpen && label !== 'Orders' && label !== 'Manage Products' && label !== 'Ambassador' && label !== 'Manage Categories') props.setIsModalOpen(true);
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

  const handleCloseAdvertisingModal = () => {
    setIsAdvertisingModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseEventsModal = () => {
    setIsEventsModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseAccountModal = () => {
    setIsAccountModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };
  const modalVariants: Variants = { hidden: { opacity: 0, scale: 0.95, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } }, exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2, ease: 'easeOut' } } };

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={async () => {
            setRefreshing(true);
            await onRefresh(true);
            setRefreshing(false);
          }}
          disabled={refreshing}
          className="flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white font-bold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center dark:hover:shadow-lg dark:hover:shadow-blue-700/30"
        >
          <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        {props.storeType === 'sports' && (
          <>
            <button
              onClick={() => {
                if (!vendor || vendor.storeId !== storeId) return promptLogin(storeId);
                setIsPayCommissionOpen(true);
              }}
              className="ml-2 col-span-2 sm:col-span-3 md:col-span-4 w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium py-3 px-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              {(!vendor || vendor.storeId !== storeId) ? 'Sign in to Pay' : 'Pay Commission'}
            </button>
            <button
              onClick={() => {
                if (!vendor || vendor.storeId !== storeId) return promptLogin(storeId);
                setIsAddPitchOpen(true);
              }}
              className="ml-2 col-span-2 sm:col-span-3 md:col-span-4 w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium py-3 px-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              {(!vendor || vendor.storeId !== storeId) ? 'Sign in to Add Pitch' : 'Add Pitch'}
            </button>
            <button
              onClick={() => {
                if (!vendor || vendor.storeId !== storeId) return promptLogin(storeId);
                setIsBookingsOpen(true);
              }}
              className="ml-2 col-span-2 sm:col-span-3 md:col-span-4 w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium py-3 px-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              {(!vendor || vendor.storeId !== storeId) ? 'Sign in to View' : 'Bookings'}
            </button>
          </>
        )}
      </div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:col-span-4 gap-2 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate={uiVisible ? 'visible' : 'hidden'}
        onAnimationComplete={() => onAnimationComplete?.()}
      >
        <style jsx>{`
                .card-blob { position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 70%); filter: blur(8px); animation: blobMove 4s infinite alternate ease-in-out; z-index: 0; will-change: transform; }
                @keyframes blobMove { 0% { transform: scale(1) translateY(0); } 100% { transform: scale(1.05) translateY(3px); } }
                .dashboard-card { min-width: 0; max-width: 100%; word-wrap: break-word; overflow: hidden; transform: translateZ(0); }
                .ai-text-gradient {
                    background: linear-gradient(90deg, 
                        #fbbf24, /* amber-400 */
                        #84cc16, /* lime-500 */
                        #10b981, /* emerald-500 */
                        #14b8a6, /* teal-500 */
                        #06b6d4, /* cyan-500 */
                        #3b82f6, /* blue-500 */
                        #6366f1, /* indigo-500 */
                        #8b5cf6, /* violet-500 */
                        #ec4899, /* pink-500 */
                        #f43f5e, /* rose-500 */
                        #f97316, /* orange-500 */
                        #fbbf24  /* amber-400 - loop */
                    );
                    background-size: 200% 100%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    color: transparent;
                    animation: ai-gradient-flow 8s linear infinite;
                    will-change: background-position;
                }
                .ai-icon-glow {
                    animation: ai-icon-colors 8s linear infinite;
                    will-change: stroke;
                }
                @keyframes ai-gradient-flow {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                @keyframes ai-icon-colors {
                    0%, 100% { stroke: #fbbf24; } /* Amber */
                    10% { stroke: #84cc16; } /* Lime */
                    20% { stroke: #10b981; } /* Emerald */
                    30% { stroke: #14b8a6; } /* Teal */
                    40% { stroke: #06b6d4; } /* Cyan */
                    50% { stroke: #3b82f6; } /* Blue */
                    60% { stroke: #6366f1; } /* Indigo */
                    70% { stroke: #8b5cf6; } /* Violet */
                    80% { stroke: #ec4899; } /* Pink */
                    90% { stroke: #f43f5e; } /* Rose */
                }
            `}</style>

        {cardsToRender.map((card, idx) => {
          // Dynamic Ambassador card with tier-based color
          if (card.label === 'Ambassador') {
            const tier = (props.ambassadorTier || 'bronze').toLowerCase();
            const tierGradients = {
              bronze: 'bg-gradient-to-br from-amber-600 via-orange-700 to-yellow-800',
              silver: 'bg-gradient-to-br from-gray-400 via-slate-500 to-gray-600',
              gold: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600',
              platinum: 'bg-gradient-to-br from-slate-300 via-gray-400 to-zinc-500',
            };
            const tierGlows = {
              bronze: 'dark:shadow-orange-500/30 shadow-orange-500/50',
              silver: 'dark:shadow-gray-500/30 shadow-gray-500/50',
              gold: 'dark:shadow-yellow-500/30 shadow-yellow-500/50',
              platinum: 'dark:shadow-gray-400/30 shadow-gray-400/50',
            };
            const gradient = tierGradients[tier as keyof typeof tierGradients] || tierGradients.bronze;
            const glowClass = tierGlows[tier as keyof typeof tierGlows] || tierGlows.bronze;

            return (
              <motion.div key={`ambassador-${idx}`} variants={itemVariants}>
                <button className={`dashboard-card relative flex flex-col items-center justify-center rounded-2xl p-2 sm:p-3 md:p-4 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${gradient} text-white ${glowClass} w-full h-full min-h-[7rem]`} tabIndex={0} type="button" onClick={() => handleOpenModal(idx, card)}>
                  <span className="card-blob" />
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white bg-opacity-20 mb-1 sm:mb-2 shadow">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 drop-shadow" />
                  </div>
                  <div className="flex flex-col items-center min-w-0 z-10 w-full">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold drop-shadow">
                      {props.referrals}
                    </div>
                    <div className="text-xs sm:text-sm font-medium opacity-90 text-center px-1 leading-tight">
                      Ambassador
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          }

          if (card.label === 'Customers' && card.component === AdminCustomersCard) {
            return (
              <motion.div key="customers-card" variants={itemVariants}>
                <AdminCustomersCard storeId={props.storeId} onClick={() => { setIsCustomersModalOpen(true); if (props.setIsModalOpen) props.setIsModalOpen(true); }} gradient={customersCard.gradient} glowClass={customersCard.glowClass} />
              </motion.div>
            );
          }

          const Icon = card.icon;
          const isHorizontal = card.label === 'Share' || card.label === 'Tips' || card.label === 'Content' || card.label === '(Biz+Con)™' || card.label === 'Advert' || card.label === 'Account' || card.label === 'Subscription';
          const isTipsCard = card.label === 'Tips';
          const isPostsCard = card.label === 'Content';
          const spotlightClasses = spotlightStep === 'tips' && isTipsCard ? 'relative z-50 pointer-events-auto' : '';

          if (isHorizontal) {
            return (
              <motion.div key={`${card.label}-${idx}`} variants={itemVariants} className={`relative ${spotlightClasses}`}>
                <button className={`dashboard-card relative flex flex-row items-center justify-center rounded-2xl p-3 md:p-4 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${card.gradient} ${card.text} ${card.glowClass} w-full h-full min-h-[7rem]`} tabIndex={0} type="button" onClick={() => handleOpenModal(idx, card)}>
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
            // Special rendering for Account card to show bank preview + edit/add CTA
            if (card.label === 'Account') {
              return (
                <motion.div key={`account-${idx}`} variants={itemVariants}>
                  <button
                    className={`dashboard-card relative flex flex-col items-center justify-center rounded-2xl p-2 sm:p-3 md:p-4 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${card.gradient} ${card.text} ${card.glowClass} w-full h-full min-h-[7rem]`}
                    tabIndex={0}
                    type="button"
                    onClick={() => handleOpenModal(idx, card)}
                  >
                    <span className="card-blob" />
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white bg-opacity-20 mb-2 shadow">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 drop-shadow" />
                    </div>
                    <div className="flex flex-col items-center min-w-0 z-10 w-full">
                      <div className="text-lg sm:text-xl md:text-2xl font-bold drop-shadow">Account</div>
                      <div className="text-xs sm:text-sm font-medium opacity-90 text-center leading-tight mt-1">Details</div>
                    </div>
                  </button>
                </motion.div>
              );
            }

            return (
              <motion.div key={`${card.label}-${idx}`} variants={itemVariants}>
                <button className={`dashboard-card relative flex flex-col items-center justify-center rounded-2xl p-2 sm:p-3 md:p-4 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${card.gradient} ${card.text} ${card.glowClass} w-full h-full min-h-[7rem]`} tabIndex={0} type="button" onClick={() => handleOpenModal(idx, card)}>
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
                        if (card.label === 'Events') return 1;
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

      {/* End of Content Indicator */}
      <motion.div
        className="mt-8 mb-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600"
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: false, margin: "0px 0px -50px 0px" }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mb-4" />
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>You&apos;re all caught up</span>
        </div>
      </motion.div>

      {/* === MODAL RENDERERS === */}

      <CustomersListModal storeId={props.storeId} isOpen={isCustomersModalOpen} onClose={() => { setIsCustomersModalOpen(false); if (props.setIsModalOpen) props.setIsModalOpen(false); }} />

      {isTipsModalOpen && (<TipsModal {...props as AdminHomeCardsProps & { handleClose: () => void; }} handleClose={handleCloseTipsModal} />)}

      {isViewsModalOpen && (<TotalViewsModal storeId={storeId} isOpen={isViewsModalOpen} onClose={() => { setIsViewsModalOpen(false); if (props.setIsModalOpen) props.setIsModalOpen(false); }} />)}

      {isShareModalOpen && (<StoreLinkModal {...props} isOpen={isShareModalOpen} handleClose={() => { setIsShareModalOpen(false); if (props.setIsModalOpen) props.setIsModalOpen(false); }} />)}

      {isPostsModalOpen && (<PostsComposerModal isOpen={isPostsModalOpen} onClose={handleClosePostsModal} storeId={props.storeId} contacts={props.contacts} products={props.products} storeName={props.storeName} />)}

      {isSocialPostsModalOpen && (<SocialPostsModal isOpen={isSocialPostsModalOpen} onClose={handleCloseSocialPostsModal} storeId={props.storeId} storeName={props.storeName || 'Store'} products={props.products} categories={props.categories} />)}

      {isBizconNetworkModalOpen && (<BizconNetworkModal isOpen={isBizconNetworkModalOpen} onClose={handleCloseBizconNetworkModal} />)}

      {isDeliveriesHubModalOpen && (<DeliveriesHubModal isOpen={isDeliveriesHubModalOpen} onClose={handleCloseDeliveriesHubModal} storeId={storeId} />)}

      {isRevenueModalOpen && (<RevenueModal isOpen={isRevenueModalOpen} onClose={handleCloseRevenueModal} storeId={storeId} />)}

      {isCommissionModalOpen && (<CommissionModal isOpen={isCommissionModalOpen} onClose={handleCloseCommissionModal} storeId={storeId} />)}
      {props.storeType === 'sports' && isPayCommissionOpen && (<PayCommissionModal isOpen={isPayCommissionOpen} onClose={() => setIsPayCommissionOpen(false)} storeId={storeId} />)}
      {props.storeType === 'sports' && isAddPitchOpen && (<AddPitchComposer isOpen={isAddPitchOpen} onClose={() => setIsAddPitchOpen(false)} storeId={storeId} />)}
      {props.storeType === 'sports' && isBookingsOpen && (<AdminBookingsModal isOpen={isBookingsOpen} onClose={() => setIsBookingsOpen(false)} storeId={storeId} />)}

      {isExpensesModalOpen && (
        <ExpensesModal
          isOpen={isExpensesModalOpen}
          onClose={handleCloseExpensesModal}
          totalCommission={props.totalCommission}
          totalExpenses={props.totalExpenses}
        />
      )}

      {isAdvertisingModalOpen && (<AdvertisingModal isOpen={isAdvertisingModalOpen} onClose={handleCloseAdvertisingModal} />)}

      {isEventsModalOpen && (<EventsModal isOpen={isEventsModalOpen} onClose={handleCloseEventsModal} />)}

      {isSubscriptionModalOpen && (
        <SubscriptionModal
          handleClose={handleCloseSubscriptionModal}
          storeId={storeId}
          ceoEmail={props.ceoEmail}
          storeName={props.storeName}
        />
      )}

      {isAccountModalOpen && (
        <AccountModal
          isOpen={isAccountModalOpen}
          handleClose={handleCloseAccountModal}
          storeId={storeId}
        />
      )}
    </section>
  );
}

