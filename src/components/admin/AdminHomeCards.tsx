'use client';
import { Tag, Rocket, Star, AlertTriangle, Eye, Gift, XCircle, RefreshCw, Archive, ShoppingCart, Share2, Lightbulb, Users, Percent, Send, Globe, Truck, TrendingUp, TrendingDown, Upload, Megaphone, CalendarDays, CheckCircle2, Briefcase, ShieldCheck, Clock, AlertCircle, ExternalLink, Warehouse, Settings, ArrowLeft, Compass } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVendor } from '@/context/VendorContext';
import { motion, Variants } from 'framer-motion';
import { useSpotlightContext } from '@/context/SpotlightContext';

// Import modal components

import TotalViewsModal from './modals/TotalViewsModal';
import StoreLinkModal from './modals/StoreLinkModal';
import { AmbassadorHubModal } from './modals/AmbassadorHubModal';
import CirclesModal from './modals/CirclesModal';

import TipsModal from './modals/TipsModal';
import LaunchGuideModal from './modals/LaunchGuideModal';
import AccountModal from './modals/AccountModal';
import SpotlightTooltip from '../shared/SpotlightTooltip';
import PostsComposerModal from './modals/PostsComposerModal';
import AddPitchComposer from '../pitch/AddPitchComposer';
import AdminBookingsModal from './modals/AdminBookingsModal';
import SocialPostsModal from './modals/SocialPostsModal';
import { CompassNetworkModal } from './modals/CompassNetworkModal';
import { CompassBenefitsModal } from './modals/CompassBenefitsModal';
import { DeliveriesHubModal } from './modals/DeliveriesHubModal';
import RevenueModal from './modals/RevenueModal';
import CommissionModal from './modals/CommissionModal';
import PayCommissionModal from './modals/PayCommissionModal';
import ExpensesModal from './modals/ExpensesModal';
import { AdvertisingModal } from './modals/AdvertisingModal';
import { EventsModal } from './modals/EventsModal';
import WarehouseModal from './modals/WarehouseModal';
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
  onSubscriptionCardClick?: () => void;
  paymentFlow?: string;
}

const ReferralBonusModal = ({ totalReferralBonus, handleClose }: { totalReferralBonus: number, handleClose: () => void }) => (
  <div className="p-6 text-center">
    <Gift className="w-12 h-12 mx-auto text-pink-500 mb-4" />
    <h3 className="text-2xl font-bold mb-2">Total Referral Bonus</h3>
    <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
      ₦{totalReferralBonus.toFixed(2)}
    </p>
    <p className="text-sm text-text-secondary mt-2">This is 100% of the Compass 🧭 App Commission paid out as bonuses to referrers.</p>
    <button onClick={handleClose} className="mt-6 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">Close</button>
  </div>
);

const cardData: { label: string, subtitle?: string, valueKey?: keyof AdminHomeCardsProps, icon: React.ElementType, gradient: string, text: string, component: React.ElementType | null, glowClass: string, isAiCard?: boolean, colspan?: number, isWholesaleCard?: boolean, cardType?: 'metric' | 'action' }[] = [
  {
    label: 'Compass',
    icon: Compass,
    gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-indigo-700',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-orange-500/30 shadow-indigo-500/50',
    cardType: 'action',
  },
  {
    label: 'Launch',
    subtitle: 'Guide',
    icon: Rocket,
    gradient: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600',
    text: 'text-white',
    component: LaunchGuideModal,
    glowClass: 'dark:shadow-purple-500/30 shadow-purple-500/50',
    cardType: 'action',
  },
  {
    label: 'Tips',
    icon: Lightbulb,
    gradient: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600',
    text: 'text-white',
    component: TipsModal,
    glowClass: 'dark:shadow-yellow-500/30 shadow-yellow-500/50',
    cardType: 'action',
  },
  {
    label: 'Events',
    icon: CalendarDays,
    gradient: 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-pink-500/30 shadow-pink-500/50',
    cardType: 'action',
  },
  {
    label: 'Warehouse',
    icon: Warehouse,
    gradient: 'bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-700',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-orange-500/30 shadow-orange-500/50',
    cardType: 'action',
  },
  {
    label: 'Circles',
    icon: Users,
    gradient: 'linear-gradient(135deg,#34C759 0%,#28CD41 100%)',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-green-500/30 shadow-green-500/50',
    cardType: 'action',
  },
  {
    label: 'Share',
    icon: Send,
    gradient: 'linear-gradient(135deg,#FF9500 0%,#FF3B30 100%)',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-orange-600/30 shadow-orange-500/50',
    cardType: 'action',
  },
  {
    label: 'Revenue',
    valueKey: 'totalRevenue',
    icon: TrendingUp,
    gradient: 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-green-500/30 shadow-green-500/50',
    cardType: 'metric',
  },
  {
    label: 'Expenses',
    valueKey: 'totalExpenses',
    icon: TrendingDown,
    gradient: 'bg-gradient-to-br from-orange-500 via-red-500 to-red-600',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-orange-500/30 shadow-orange-500/50',
    cardType: 'metric',
  },
  {
    label: 'Ambassador',
    valueKey: 'referrals',
    icon: Star,
    gradient: 'bg-gradient-to-br from-amber-600 via-orange-700 to-yellow-800', // Default bronze, will be overridden
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-orange-500/30 shadow-orange-500/50',
    cardType: 'metric',
  },
  {
    label: 'Views',
    valueKey: 'totalViews',
    icon: Eye,
    gradient: 'linear-gradient(135deg,#06B6D4 0%,#3B82F6 100%)',
    text: 'text-white',
    component: TotalViewsModal,
    glowClass: 'dark:shadow-sky-600/30 shadow-sky-600/50',
    cardType: 'metric',
  },
  {
    label: 'Orders',
    valueKey: 'totalOrders',
    icon: ShoppingCart,
    gradient: 'linear-gradient(135deg,#F59E0B 0%,#F97316 100%)',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-amber-600/30 shadow-amber-500/50',
    cardType: 'metric',
  },
  {
    label: 'Deliveries',
    valueKey: 'deliveries',
    icon: Truck,
    gradient: 'bg-gradient-to-br from-lime-500 via-green-600 to-emerald-700',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-green-500/30 shadow-green-500/50',
    cardType: 'metric',
  },
  {
    label: 'Wholesale',
    icon: ShoppingCart,
    gradient: 'bg-gradient-to-br from-amber-600 via-orange-600 to-red-700',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-amber-600/50 shadow-amber-600/50',
    cardType: 'metric',
    isWholesaleCard: true,
  },
  {
    label: 'Manage Categories',
    valueKey: 'totalCategories',
    icon: Tag,
    gradient: 'linear-gradient(135deg,#FFD60A 0%,#FFCC00 100%)',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-rose-500/30 shadow-amber-500/50',
    cardType: 'metric',
  },
  {
    label: 'Manage Products',
    valueKey: 'totalProducts',
    icon: Archive,
    gradient: 'linear-gradient(135deg,#FF3B30 0%,#FF2D55 100%)',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-red-600/30 shadow-red-600/50',
    cardType: 'metric',
  },
  {
    label: 'Settings',
    icon: Settings,
    gradient: 'linear-gradient(135deg,#8E8E93 0%,#636366 100%)',
    text: 'text-white',
    component: AccountModal,
    glowClass: 'dark:shadow-gray-600/30 shadow-gray-500/50',
    cardType: 'action',
  },
  {
    label: 'Subscription',
    icon: ShieldCheck,
    gradient: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700',
    text: 'text-white',
    component: null, // Moved to AdminStorePageClient
    glowClass: 'dark:shadow-teal-500/30 shadow-teal-500/50',
    cardType: 'action',
  },
  {
    label: 'Customers',
    valueKey: 'totalContacts',
    icon: Users,
    gradient: 'bg-gradient-to-br from-indigo-500 via-blue-600 to-sky-700',
    text: 'text-white',
    component: null,
    glowClass: 'dark:shadow-indigo-500/30 shadow-indigo-500/50',
    cardType: 'metric',
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

// Subscription status helper functions
const getSubscriptionGradient = (status: string) => {
  switch (status) {
    case 'active': return 'bg-gradient-to-br from-green-400 via-emerald-500 to-green-600';
    case 'trial': return 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600';
    case 'past_due': return 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600';
    case 'expired': return 'bg-gradient-to-br from-red-400 via-red-500 to-rose-600';
    case 'cancelled': return 'bg-gradient-to-br from-gray-400 via-slate-500 to-gray-600';
    default: return 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600';
  }
};

const getSubscriptionGlow = (status: string) => {
  switch (status) {
    case 'active': return 'dark:shadow-green-500/30 shadow-green-500/50';
    case 'trial': return 'dark:shadow-blue-500/30 shadow-blue-500/50';
    case 'past_due': return 'dark:shadow-yellow-500/30 shadow-yellow-500/50';
    case 'expired': return 'dark:shadow-red-500/30 shadow-red-500/50';
    case 'cancelled': return 'dark:shadow-gray-500/30 shadow-gray-500/50';
    default: return 'dark:shadow-blue-500/30 shadow-blue-500/50';
  }
};

const getSubscriptionIcon = (status: string) => {
  switch (status) {
    case 'active': return CheckCircle2;
    case 'trial': return Clock;
    case 'past_due': return AlertTriangle;
    case 'expired': return AlertCircle;
    case 'cancelled': return XCircle;
    default: return Clock;
  }
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2, ease: 'easeOut' } }
};

/**
 * AnimatedNumber - Smoothly counts from 0 to the target value
 */
const AnimatedNumber = ({ value, duration = 800 }: { value: number | string; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  useEffect(() => {
    const raw = String(value);
    // Extract prefix (e.g. "₦"), numeric part, and suffix (e.g. "K", "M")
    const match = raw.match(/^([^\d]*?)([\d.]+)(.*)$/);
    if (!match || reducedMotion) {
      setDisplayValue(raw);
      return;
    }

    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr);
    if (isNaN(target) || target === 0) {
      setDisplayValue(raw);
      return;
    }

    const isDecimal = numStr.includes('.');
    const decimalPlaces = isDecimal ? (numStr.split('.')[1]?.length || 0) : 0;
    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setDisplayValue(`${prefix}${isDecimal ? current.toFixed(decimalPlaces) : Math.round(current)}${suffix}`);
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration, reducedMotion]);

  return <>{displayValue}</>;
};

/**
 * MetricCard Component - Moved outside to prevent forced re-mounting
 */
const MetricCard = ({ icon: Icon, label, count, gradient, glowClass, onClick, inlineStyle }: { icon: React.ElementType; label: string; count: string | number; gradient: string; glowClass: string; onClick: () => void; inlineStyle?: React.CSSProperties }) => (
  <motion.div variants={itemVariants} key={label} className="h-full">
    <button
      style={inlineStyle}
      className={`dashboard-card relative flex flex-col items-center justify-center gap-3 rounded-[2rem] p-4 sm:p-5 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${gradient} text-white ${glowClass} w-full min-h-[140px] h-full`}
      tabIndex={0}
      type="button"
      onClick={onClick}
    >
      <span className="card-blob" />
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-bold drop-shadow"><AnimatedNumber value={count} /></div>
      <div className="text-sm font-medium text-center opacity-90">
        {label === 'Manage Categories' ? 'Categories' :
          label === 'Manage Products' ? (inlineStyle ? 'Products' : 'Gigs') :
            label === 'Orders' ? 'Bookings' :
              label === 'Revenue' ? 'Earnings' :
                label}
      </div>
    </button>
  </motion.div>
);

export default function AdminHomeCards(props: AdminHomeCardsProps) {
  const router = useRouter();
  const { spotlightStep, completeSpotlight } = useSpotlightContext();
  const [openModal, setOpenModal] = useState<number | null>(null);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [isLaunchGuideModalOpen, setIsLaunchGuideModalOpen] = useState(false);
  const [isViewsModalOpen, setIsViewsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const [isPostsModalOpen, setIsPostsModalOpen] = useState(false);
  const [isSocialPostsModalOpen, setIsSocialPostsModalOpen] = useState(false);
  const [isCompassNetworkModalOpen, setIsCompassNetworkModalOpen] = useState(false);
  const [isCompassBenefitsModalOpen, setIsCompassBenefitsModalOpen] = useState(false);
  const [isDeliveriesHubModalOpen, setIsDeliveriesHubModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [isPayCommissionOpen, setIsPayCommissionOpen] = useState(false);
  const [isAddPitchOpen, setIsAddPitchOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isAdvertisingModalOpen, setIsAdvertisingModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);
  const [isCirclesModalOpen, setIsCirclesModalOpen] = useState(false);
  const [wholesaleStats, setWholesaleStats] = useState({
    activePartners: 0,
    pendingRequests: 0,
    monthlyRevenue: 0
  });
  const [showPostsNotification, setShowPostsNotification] = useState(false);
  const [bankAccountName, setBankAccountName] = useState<string | null>(null);
  const [bankAccountNumber, setBankAccountNumber] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const { setIsModalOpen, onRefresh, uiVisible, onAnimationComplete, onOrdersCardClick, onProductsCardClick, storeId, onAmbassadorCardClick, isRefreshing } = props;
  const { vendor, promptLogin } = useVendor();

  // Prefetch storefront route on mount so Back to Store is instant
  useEffect(() => {
    if (storeId) router.prefetch(`/${storeId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

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

  // Auto-refresh when cards become visible - REMOVED TO PREVENT RENDER LOOPS
  // Data is now prefetched by parent, manual refresh handles updates.
  /*
  useEffect(() => {
    if (uiVisible && !refreshing) {
      ...
    }
  }, [uiVisible]);
  */

  const isInfluencer = props.storeType === 'media-influencer';
  const isEscrow = props.paymentFlow === 'paystack_escrow';
  const isSpecialStore = isInfluencer || isEscrow;

  const allowedCards = ['Launch', 'Compass', 'Orders', 'Settings', 'Views', 'Manage Categories', 'Manage Products', 'Subscription', 'Circles', 'Revenue', 'Deliveries', 'Customers'];
  const cardsToRender = cardData.filter(card => {
    // Hide Circles for everyone for now
    if (card.label === 'Circles') return false;

    if (allowedCards.includes(card.label)) {
      if (card.label === 'Subscription' && isInfluencer) return false;

      // Hide specific cards for standard stores (not influencer and not escrow)
      if (!isSpecialStore) {
        const sensitiveCards = ['Compass', 'Revenue', 'Orders', 'Deliveries', 'Customers'];
        if (sensitiveCards.includes(card.label)) return false;
      }

      return true;
    }
    return false;
  });

  const previousModalState = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const modalIsOpen = openModal !== null || isTipsModalOpen || isLaunchGuideModalOpen || isCustomersModalOpen || isViewsModalOpen || isShareModalOpen || isPostsModalOpen || isSocialPostsModalOpen || isCompassNetworkModalOpen || isCompassBenefitsModalOpen || isDeliveriesHubModalOpen || isRevenueModalOpen || isCommissionModalOpen || isExpensesModalOpen || isAdvertisingModalOpen || isEventsModalOpen || isAccountModalOpen || isWarehouseModalOpen || isWholesaleModalOpen || isCirclesModalOpen;

    // Check if modal was literally JUST closed (transition from true to false)
    if (previousModalState.current && !modalIsOpen) {
      if (typeof onRefreshRef.current === 'function') {
        setTimeout(() => {
          onRefreshRef.current(false);
        }, 200);
      }
    }
    previousModalState.current = modalIsOpen;

    if (modalIsOpen) {
      window.history.pushState({ modalOpen: true }, '');
      const handlePopState = () => {
        setOpenModal(null);
        setIsTipsModalOpen(false);
        setIsLaunchGuideModalOpen(false);
        setIsCustomersModalOpen(false);
        setIsViewsModalOpen(false);
        setIsShareModalOpen(false);
        setIsPostsModalOpen(false);
        setIsSocialPostsModalOpen(false);
        setIsCompassNetworkModalOpen(false);
        setIsCompassBenefitsModalOpen(false);
        setIsDeliveriesHubModalOpen(false);
        setIsRevenueModalOpen(false);
        setIsCommissionModalOpen(false);
        setIsExpensesModalOpen(false);
        setIsAdvertisingModalOpen(false);
        setIsEventsModalOpen(false);
        setIsAccountModalOpen(false);
        setIsWarehouseModalOpen(false);
        setIsWholesaleModalOpen(false);
        setIsCirclesModalOpen(false);
        if (setIsModalOpen) setIsModalOpen(false);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [openModal, isTipsModalOpen, isLaunchGuideModalOpen, isCustomersModalOpen, isViewsModalOpen, isShareModalOpen, isPostsModalOpen, isSocialPostsModalOpen, isCompassNetworkModalOpen, isCompassBenefitsModalOpen, isDeliveriesHubModalOpen, isRevenueModalOpen, isCommissionModalOpen, isExpensesModalOpen, isAdvertisingModalOpen, isEventsModalOpen, isAccountModalOpen, isWarehouseModalOpen, isWholesaleModalOpen, isCirclesModalOpen, setIsModalOpen]);

  const handleOpenModal = (idx: number, card: typeof cardData[0]) => {
    if (isRefreshing) return; // Prevent opening modals during refresh

    // Only trigger a silent refresh if data is older than 30 seconds
    const now = Date.now();
    if (now - lastSyncTimeRef.current > 30000) {
      if (typeof onRefresh === 'function') {
        onRefresh(false);
      }
      lastSyncTimeRef.current = now;
    }

    const { label, subtitle } = card;
    if (label === 'Compass') setIsCompassNetworkModalOpen(true);
    else if (label === 'Launch') setIsLaunchGuideModalOpen(true);
    else if (label === 'Tips') setIsTipsModalOpen(true);
    else if (label === 'Views') setIsViewsModalOpen(true);
    else if (label === 'Share') setIsSocialPostsModalOpen(true);
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
    else if (label === 'Warehouse') setIsWarehouseModalOpen(true);
    else if (label === 'Wholesale') setIsWholesaleModalOpen(true);
    else if (label === 'Subscription') {
      if (props.onSubscriptionCardClick) props.onSubscriptionCardClick();
    }
    else if (label === 'Settings') setIsAccountModalOpen(true);
    else if (label === 'Circles') setIsCirclesModalOpen(true);
    else if (label === 'Customers') setIsCustomersModalOpen(true);
    else setOpenModal(idx);

    if (props.setIsModalOpen && label !== 'Orders' && label !== 'Manage Products' && label !== 'Ambassador' && label !== 'Manage Categories') props.setIsModalOpen(true);
  };

  const popHistoryIfExists = () => {
    if (typeof window !== 'undefined' && window.history.state?.modalOpen) {
      router.back();
      return true;
    }
    return false;
  };

  const handleCloseModal = () => {
    if (popHistoryIfExists()) return;
    setOpenModal(null);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  };

  const handleCloseTipsModal = () => {
    if (spotlightStep === 'tips') {
      completeSpotlight();
    }
    if (popHistoryIfExists()) return;
    setIsTipsModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  };

  const handleCloseLaunchGuideModal = () => {
    if (popHistoryIfExists()) return;
    setIsLaunchGuideModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  };

  const handleCloseCustomersModal = () => {
    if (popHistoryIfExists()) return;
    setIsCustomersModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  };

  const handleCloseViewsModal = () => {
    if (popHistoryIfExists()) return;
    setIsViewsModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  };

  const handleCloseShareModal = () => {
    if (popHistoryIfExists()) return;
    setIsShareModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  };

  const handleClosePostsModal = () => {
    if (popHistoryIfExists()) return;
    setIsPostsModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseSocialPostsModal = () => {
    if (popHistoryIfExists()) return;
    setIsSocialPostsModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseCompassNetworkModal = () => {
    if (popHistoryIfExists()) return;
    setIsCompassNetworkModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseCompassBenefitsModal = () => {
    if (popHistoryIfExists()) return;
    setIsCompassBenefitsModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseDeliveriesHubModal = () => {
    if (popHistoryIfExists()) return;
    setIsDeliveriesHubModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseRevenueModal = () => {
    if (popHistoryIfExists()) return;
    setIsRevenueModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseCommissionModal = () => {
    if (popHistoryIfExists()) return;
    setIsCommissionModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseExpensesModal = () => {
    if (popHistoryIfExists()) return;
    setIsExpensesModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseAdvertisingModal = () => {
    if (popHistoryIfExists()) return;
    setIsAdvertisingModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseEventsModal = () => {
    if (popHistoryIfExists()) return;
    setIsEventsModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }


  const handleCloseAccountModal = () => {
    if (popHistoryIfExists()) return;
    setIsAccountModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseWarehouseModal = () => {
    if (popHistoryIfExists()) return;
    setIsWarehouseModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseWholesaleModal = () => {
    if (popHistoryIfExists()) return;
    setIsWholesaleModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  const handleCloseCirclesModal = () => {
    if (popHistoryIfExists()) return;
    setIsCirclesModalOpen(false);
    if (props.setIsModalOpen) props.setIsModalOpen(false);
  }

  // Fetch wholesale stats for card display
  useEffect(() => {
    if (!storeId) return;

    let mounted = true;

    const fetchWholesaleStats = async () => {
      try {
        const db = getFirestore(firebaseApp);
        const storeRef = doc(db, 'stores', storeId);
        const storeSnap = await getDoc(storeRef);

        if (!mounted) return;

        if (storeSnap.exists()) {
          const storeData = storeSnap.data();
          const stats = storeData?.wholesaleStats || {};

          // Extract wholesale stats from store document
          const activePartners = stats.activePartners || 0;
          const pendingRequests = stats.pendingRequests || 0;
          const monthlyRevenue = stats.monthlyWholesaleRevenue || 0;

          if (mounted) {
            setWholesaleStats({
              activePartners,
              pendingRequests,
              monthlyRevenue
            });
          }
        }
      } catch (error) {
        console.error('Error fetching wholesale stats:', error);
        if (mounted) {
          setWholesaleStats({
            activePartners: 0,
            pendingRequests: 0,
            monthlyRevenue: 0
          });
        }
      }
    };

    fetchWholesaleStats();

    return () => {
      mounted = false;
    };
  }, [storeId, isWholesaleModalOpen]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.85, rotate: -2 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        mass: 0.8
      }
    }
  };

  const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2, ease: 'easeOut' } }
  };


  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="mb-4"
      >
        <button
          onClick={() => {
            router.push('/' + storeId);
          }}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold py-4 px-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
          </div>

          <div className="flex flex-col items-start text-left min-w-0">
            <span className="text-base font-bold tracking-tight truncate w-full">Back to Store</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate w-full">Return to your shop storefront</span>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-green-50 dark:group-hover:bg-green-900/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-green-500" />
            </div>
          </div>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.08 }}
        className="mb-4 flex items-center gap-2"
      >
        <button
          data-refresh-button
          onClick={async () => {
            await onRefresh(true);
          }}
          disabled={isRefreshing}
          className="flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white font-bold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center dark:hover:shadow-lg dark:hover:shadow-blue-700/30"
        >
          <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
      </motion.div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4"
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
          // allow inline CSS gradients (linear-gradient strings) via style
          const inlineStyle = card.gradient && card.gradient.startsWith && card.gradient.startsWith('linear-gradient') ? { background: card.gradient } : undefined;
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
              <motion.div key={card.label} variants={itemVariants} className="h-full">
                <button className={`dashboard-card relative flex flex-col items-center justify-center gap-3 rounded-[2rem] p-4 sm:p-5 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${gradient} text-white ${glowClass} w-full min-h-[140px] h-full`} tabIndex={0} type="button" onClick={() => handleOpenModal(idx, card)}>
                  <span className="card-blob" />
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20">
                    <Star className="w-6 h-6 drop-shadow" />
                  </div>
                  <div className="text-3xl font-bold drop-shadow"><AnimatedNumber value={props.referrals} /></div>
                  <div className="text-sm font-medium text-center opacity-90">Ambassador</div>
                </button>
              </motion.div>
            );
          }

          // Dynamic Subscription card - hidden for now
          if (card.label === 'Subscription') {
            return null;
            const status = props.subscriptionStatus || 'trial';
            const SubscriptionIcon = getSubscriptionIcon(status);
            const gradient = getSubscriptionGradient(status);
            const glowClass = getSubscriptionGlow(status);

            return (
              <motion.div key={card.label} variants={itemVariants} className="h-full">
                <button
                  className={`dashboard-card relative flex flex-row items-center justify-center gap-4 rounded-[2rem] p-4 sm:p-5 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${gradient} text-white ${glowClass} w-full min-h-[140px] h-full`}
                  tabIndex={0}
                  type="button"
                  onClick={() => handleOpenModal(idx, card)}
                >
                  <span className="card-blob" />
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white bg-opacity-20 shadow">
                    <SubscriptionIcon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow" />
                  </div>
                  <div className="flex flex-col items-center justify-center min-w-0 z-10">
                    <div className="text-lg sm:text-xl font-extrabold drop-shadow tracking-tight">
                      <span className="hidden sm:inline">Subscription</span>
                      <span className="sm:hidden">Sub</span>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          }


          // Wholesale card - simplified vertical layout
          if (card.label === 'Wholesale' && card.isWholesaleCard) {
            return (
              <motion.div key={card.label} variants={itemVariants} className="h-full">
                <button
                  onClick={() => handleOpenModal(idx, card)}
                  className={`dashboard-card relative flex flex-col items-center justify-center gap-3 rounded-[2rem] p-4 sm:p-5 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${card.gradient} text-white ${card.glowClass} w-full min-h-[140px] h-full`}
                  tabIndex={0}
                  type="button"
                >
                  <span className="card-blob" />

                  {/* Icon */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20">
                    <ShoppingCart className="w-6 h-6" />
                  </div>

                  {/* Active Partners Count */}
                  <div className="text-3xl font-bold"><AnimatedNumber value={wholesaleStats.activePartners} /></div>

                  {/* Card Label */}
                  <div className="text-sm font-medium text-center opacity-90">
                    {props.storeType === 'media-influencer' ? 'Sponsors' : 'Wholesale'}
                  </div>
                </button>
              </motion.div>
            );
          }

          const Icon = card.icon;
          const isTipsCard = card.label === 'Tips';
          const isPostsCard = card.label === 'Share';
          const spotlightClasses = spotlightStep === 'tips' && isTipsCard ? 'relative z-50 pointer-events-auto' : '';

          // Render metric cards (Revenue, Views, Products, Categories, Orders, Deliveries, Wholesale, etc.)
          if (card.cardType === 'metric') {
            const metricValue = (() => {
              const value = card.valueKey ? (props as any)[card.valueKey] : '';
              if (card.label === 'Commission') return formatCurrencyForCard(props.totalCommission);
              if (card.label === 'Bonus') return formatCurrencyForCard(props.totalReferralBonus);
              if (card.label === 'Revenue') return formatCurrencyForCard(props.totalRevenue);
              if (card.label === 'Expenses') return formatCurrencyForCard(props.totalExpenses + props.totalCommission);
              if (card.label === 'Ambassador') return props.referrals;
              if (card.label === 'Deliveries') return 0;
              if (card.label === 'Events') return 1;
              if (typeof value === 'number' || typeof value === 'string') return value;
              return '0';
            })();
            return <MetricCard key={card.label} icon={Icon} label={card.label} count={metricValue} gradient={card.gradient} glowClass={card.glowClass} onClick={() => handleOpenModal(idx, card)} inlineStyle={inlineStyle} />;
          }

          // Render action cards (Compass 🧭, Tips, Share, Settings, Subscription, Warehouse, Events)
          if (card.cardType === 'action') {
            return (
              <motion.div key={card.label} variants={itemVariants} className={`relative h-full ${spotlightClasses}`}>
                <button style={inlineStyle} className={`dashboard-card relative flex flex-row items-center justify-center gap-4 rounded-[2rem] p-4 sm:p-5 shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none overflow-hidden ${card.gradient || ''} ${card.text || ''} ${card.glowClass || ''} w-full min-h-[140px] h-full`} tabIndex={0} type="button" onClick={() => handleOpenModal(idx, card)}>
                  {isPostsCard && showPostsNotification && (<span className="absolute top-2 right-2 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>)}
                  <span className="card-blob" />
                  <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white bg-opacity-20 shadow`}><Icon className={`w-6 h-6 sm:w-7 sm:h-7 drop-shadow ${card.isAiCard ? 'ai-icon-glow' : ''}`} /></div>
                  <div className="flex flex-col items-center justify-center min-w-0 z-10">
                    <div className={`text-lg sm:text-xl font-extrabold drop-shadow tracking-tight ${card.isAiCard ? 'ai-text-gradient' : ''}`}>{card.label}</div>
                    {card.subtitle && <div className={`text-xs sm:text-sm font-semibold opacity-90 leading-tight ${card.isAiCard ? 'ai-text-gradient' : ''}`}>{card.subtitle}</div>}
                  </div>
                </button>
                {spotlightStep === 'tips' && isTipsCard && (<SpotlightTooltip text="Check here for helpful tips and stats about your dashboard." className="top-full mt-4 left-1/2 -translate-x-1/2" />)}
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
        viewport={{ once: true, margin: "0px 0px -50px 0px" }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mb-4" />
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>You&apos;re all caught up</span>
        </div>
      </motion.div>

      {/* === MODAL RENDERERS === */}

      <CustomersListModal
        storeId={props.storeId}
        isOpen={isCustomersModalOpen}
        onClose={handleCloseCustomersModal}
        storeType={props.storeType}
      />

      {isLaunchGuideModalOpen && (
        <LaunchGuideModal
          storeLink={props.storeLink}
          products={props.products}
          isOpen={isLaunchGuideModalOpen}
          onClose={handleCloseLaunchGuideModal}
          storeType={props.storeType}
        />
      )}

      {isTipsModalOpen && (<TipsModal {...props as AdminHomeCardsProps & { handleClose: () => void; }} handleClose={handleCloseTipsModal} />)}

      {isViewsModalOpen && (<TotalViewsModal storeId={storeId} isOpen={isViewsModalOpen} onClose={handleCloseViewsModal} />)}

      {isShareModalOpen && (<StoreLinkModal {...props} isOpen={isShareModalOpen} handleClose={handleCloseShareModal} />)}

      {isPostsModalOpen && (<PostsComposerModal isOpen={isPostsModalOpen} onClose={handleClosePostsModal} storeId={props.storeId} contacts={props.contacts} products={props.products} storeName={props.storeName} />)}

      {isSocialPostsModalOpen && (<SocialPostsModal isOpen={isSocialPostsModalOpen} onClose={handleCloseSocialPostsModal} storeId={props.storeId} storeName={props.storeName || 'Store'} products={props.products} categories={props.categories} />)}

      {isCompassNetworkModalOpen && (<CompassNetworkModal isOpen={isCompassNetworkModalOpen} onClose={handleCloseCompassNetworkModal} storeType={props.storeType} />)}

      {isCompassBenefitsModalOpen && (<CompassBenefitsModal isOpen={isCompassBenefitsModalOpen} onClose={handleCloseCompassBenefitsModal} />)}

      {isDeliveriesHubModalOpen && (<DeliveriesHubModal isOpen={isDeliveriesHubModalOpen} onClose={handleCloseDeliveriesHubModal} storeId={storeId} storeType={props.storeType} />)}

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

      {isAccountModalOpen && (
        <AccountModal
          isOpen={isAccountModalOpen}
          handleClose={handleCloseAccountModal}
          storeId={storeId}
        />
      )}

      {isWarehouseModalOpen && (
        <WarehouseModal
          isOpen={isWarehouseModalOpen}
          onClose={handleCloseWarehouseModal}
        />
      )}

      {isCirclesModalOpen && (
        <CirclesModal
          isOpen={isCirclesModalOpen}
          onClose={handleCloseCirclesModal}
          storeId={storeId}
        />
      )}
    </section>
  );
}
