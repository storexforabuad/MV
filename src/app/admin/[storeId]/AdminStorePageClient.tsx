
'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useVendor } from '@/context/VendorContext';
import { verifyVendorByPhone } from '@/app/actions/vendorActions';
import { useSearchParams } from 'next/navigation';
import {
  getProducts,
  getCategories,
  getContacts,
  WholesaleData,
  getStoreMeta,
  updateProduct,
  deleteProduct,
  addCategory,
  updateCategory,
  deleteCategory,
  fetchStoreOrders,
  StoreOrder
} from '../../../lib/db';
import { getCommissionAnalytics, CommissionEvent } from '@/app/actions/commissionActions';
import { getRevenueAnalytics, getReadyForDeliveryOrders } from '@/app/actions/orderActions'; // Import revenue and delivery analytics
import { requestNotificationPermission } from '../../../lib/firebase-messaging';
import { Product } from '../../../types/product';
import { isGeneralProduct } from '../../../utils/productHelpers';
import { Category } from '../../../types/category';
import { StoreMeta } from '../../../types/store';
import AdminHeader from '../../../components/admin/AdminHeader';
import AdminSkeleton from '../../../components/admin/AdminSkeleton';
import MobileNav from '../../../components/admin/MobileNav';
import FloatingActionButton from '../../../components/admin/FloatingActionButton';
import AdminHomeCards from '../../../components/admin/AdminHomeCards';
import WarehouseHub from '../../../components/admin/WarehouseHub';
import AdminInvoicePanel from '../../../components/admin/AdminInvoicePanel';
import InstallPrompt from '../../../components/InstallPrompt';
import dynamic from 'next/dynamic';
import PreviewSkeleton from '../../../components/admin/PreviewSkeleton';
import ActivityPage from '../../../components/admin/ActivityPage';
import { markOnboardingAsCompleted } from '../../../app/actions/onboardingActions';
import { useSpotlightContext } from '@/context/SpotlightContext';
import { Notification } from '../../../types/notification';
import { clearAdminSession } from '@/lib/adminSession';
const OnboardingFlow = dynamic(() => import('../../../components/admin/onboarding/OnboardingFlow'), { ssr: false });
const AddProductComposer = dynamic(() => import('../../../components/admin/AddProductComposer'), { ssr: false });
const AddVehicleComposer = dynamic(() => import('../../../components/admin/AddVehicleComposer'), { ssr: false });
const AddLivestockComposer = dynamic(() => import('../../../components/admin/AddLivestockComposer'), { ssr: false });
const AddFashionComposer = dynamic(() => import('../../../components/admin/AddFashionComposer'), { ssr: false });
const AddMenuComposer = dynamic(() => import('../../../components/admin/AddMenuComposer'), { ssr: false });
const ManageProductsModal = dynamic(() => import('../../../components/admin/ManageProductsModal'), { ssr: false });
const ManageCategoriesModal = dynamic(() => import('../../../components/admin/ManageCategoriesModal'), { ssr: false });
const AdminOrdersModal = dynamic(() => import('../../../components/admin/modals/AdminOrdersModal').then(mod => mod.AdminOrdersModal), { ssr: false });
const AmbassadorHubModal = dynamic(() => import('../../../components/admin/modals/AmbassadorHubModal').then(mod => mod.AmbassadorHubModal), { ssr: false });
const PostsComposerModal = dynamic(() => import('../../../components/admin/modals/PostsComposerModal'), { ssr: false });
const SocialPostsModal = dynamic(() => import('../../../components/admin/modals/SocialPostsModal'), { ssr: false });
const SubscriptionModal = dynamic(() => import('../../../components/admin/modals/SubscriptionModal'), { ssr: false });
const LogoutConfirmationModal = dynamic(() => import('../../../components/admin/modals/LogoutConfirmationModal'), { ssr: false });

interface Referral {
  id: string;
  businessName: string;
  businessNumber: string;
  businessCategory?: string;
  businessLocation?: string;
  referralNote?: string;
}

interface CommissionAnalyticsData {
  totalCommission: number;
  commissionHistory: CommissionEvent[];
}

// A new hook to fetch store orders
const useStoreOrders = (storeId: string, initialOrders: StoreOrder[]) => {
  const [orders, setOrders] = useState<StoreOrder[]>(initialOrders);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const fetchedOrders = await fetchStoreOrders(storeId);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to fetch store orders:", error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  return { orders, loading, refreshOrders: fetchOrders };
};

async function getReferrals(storeId: string): Promise<Referral[]> {
  if (!storeId) return [];
  try {
    const response = await fetch(`/api/stores/${storeId}/referrals`);
    if (!response.ok) {
      console.error("Failed to fetch referrals");
      return [];
    }
    return response.json();
  } catch (error) {
    console.error("Error in getReferrals:", error);
    return [];
  }
}

import { calculateCommissionAndBonus } from '../../../utils/calculations';

interface AdminStorePageClientProps {
  storeId: string;
  initialProducts: Product[];
  initialCategories: Category[];
  initialContacts: WholesaleData[];
  initialStoreMeta: StoreMeta | null;
  initialReferrals: Referral[];
  initialCommissionAnalytics: CommissionAnalyticsData;
  initialRevenueAnalytics: any;
  initialDeliveryOrders: StoreOrder[];
  initialOrders: StoreOrder[];
}

export default function AdminStorePageClient({
  storeId,
  initialProducts,
  initialCategories,
  initialContacts,
  initialStoreMeta,
  initialReferrals,
  initialCommissionAnalytics,
  initialRevenueAnalytics,
  initialDeliveryOrders,
  initialOrders
}: AdminStorePageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [contacts, setContacts] = useState<WholesaleData[]>(initialContacts);
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const [storeMeta, setStoreMeta] = useState<StoreMeta | null>(initialStoreMeta);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [activityVisitCount, setActivityVisitCount] = useState(0);
  const [homeVisitCount, setHomeVisitCount] = useState(0);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isPostsModalOpen, setIsPostsModalOpen] = useState(false);
  const [isSocialPostsModalOpen, setIsSocialPostsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAmbassadorHubModalOpen, setIsAmbassadorHubModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { spotlightStep, setSpotlightStep } = useSpotlightContext();
  const [shouldShowSpotlight, setShouldShowSpotlight] = useState(false);
  const [commissionAnalytics, setCommissionAnalytics] = useState<CommissionAnalyticsData>(initialCommissionAnalytics);
  const [totalReferralBonus, setTotalReferralBonus] = useState(0);
  const [realTotalRevenue, setRealTotalRevenue] = useState(initialRevenueAnalytics ? initialRevenueAnalytics.lifetimeRevenue + initialRevenueAnalytics.lifetimeBonus : 0);
  const [deliveriesCount, setDeliveriesCount] = useState(initialDeliveryOrders.length);
  const [isHomeCardModalOpen, setIsHomeCardModalOpen] = useState(false);
  const [ambassadorTier, setAmbassadorTier] = useState<string>('bronze');
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(Date.now());

  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  // Real Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Helper to generate notifications from real data
  const generateNotifications = useCallback((
    currentOrders: StoreOrder[],
    currentProducts: Product[],
    currentStoreMeta: StoreMeta | null
  ) => {
    const newNotifications: Notification[] = [];
    const now = Date.now();

    // 1. Order Notifications (Last 24 hours)
    const recentOrders = currentOrders.filter(o => {
      const orderDate = new Date(o.orderDate).getTime();
      return (now - orderDate) < 24 * 60 * 60 * 1000;
    }).slice(0, 3); // Max 3 recent orders

    recentOrders.forEach(order => {
      newNotifications.push({
        id: `order-${order.id}`,
        type: 'success',
        title: `New Order`,
        message: `${order.customerInfo?.name || 'A customer'} just placed an order.`,
        timestamp: new Date(order.orderDate).getTime(),
        actionLabel: 'View Order',
        isRead: false,
      });
    });

    // 2. Product Trending Notifications (High views)
    const trendingProducts = currentProducts
      .filter(p => (p.views || 0) > 20)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 2);

    trendingProducts.forEach(product => {
      newNotifications.push({
        id: `trending-${product.id}`,
        type: 'activity',
        title: 'Product Trending 🔥',
        message: `Your '${product.name}' is getting a lot of attention!`,
        timestamp: now - 3600000, // 1 hour ago roughly
        actionLabel: 'Boost Post',
        isRead: false,
      });
    });

    // 3. Low Stock Notifications (if applicable for physical goods)
    if (currentStoreMeta?.storeType !== 'digital-products' && currentStoreMeta?.storeType !== 'restaurant') {
      const lowStockProducts = currentProducts.filter(p =>
        p.productType === 'general' &&
        (p as any).quantity !== undefined &&
        (p as any).quantity <= 5 &&
        !(p as any).soldOut
      ).slice(0, 2);

      lowStockProducts.forEach(product => {
        newNotifications.push({
          id: `stock-${product.id}`,
          type: 'action',
          title: 'Low Stock Alert',
          message: `Only ${(product as any).quantity} '${product.name}' left.`,
          timestamp: now - 7200000,
          actionLabel: 'Update Stock',
          isRead: false,
        });
      });
      // 4. Subscription Notifications
      if (currentStoreMeta) {
        const isInfluencer = currentStoreMeta.isInfluencer;
        const isFreePlan = currentStoreMeta.isFreePlan;
        const status = currentStoreMeta.subscriptionStatus || 'trial';
        const isTrial = status === 'trial';
        const isActive = status === 'active';
        const isPastDue = status === 'past_due' || status === 'expired';

        // Use the correct properties from StoreMeta
        const renewalTimestamp = currentStoreMeta.subscriptionNextBillingDate
          ? (currentStoreMeta.subscriptionNextBillingDate as any).toMillis?.() || new Date(currentStoreMeta.subscriptionNextBillingDate as any).getTime()
          : null;

        const trialEndsTimestamp = currentStoreMeta.subscriptionTrialEndsAt
          ? (currentStoreMeta.subscriptionTrialEndsAt as any).toMillis?.() || new Date(currentStoreMeta.subscriptionTrialEndsAt as any).getTime()
          : null;

        const formatShortDate = (timestamp: number | null) => {
          if (!timestamp) return 'soon';
          return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        };

        if (isInfluencer || isFreePlan || isActive) {
          newNotifications.push({
            id: 'sub-active',
            type: 'success',
            title: 'PREMIUM ACTIVE',
            message: isTrial && trialEndsTimestamp
              ? `Trial auto-renews on ${formatShortDate(trialEndsTimestamp)}.`
              : renewalTimestamp
                ? `Subscription auto-renews on ${formatShortDate(renewalTimestamp)}.`
                : 'Your premium subscription is active.',
            timestamp: now, // Pin to top
            actionLabel: 'VIEW DETAILS',
            isRead: false,
          });
        } else if (isPastDue) {
          newNotifications.push({
            id: 'sub-expired',
            type: 'critical',
            title: 'SUBSCRIPTION EXPIRED',
            message: 'Your store is currently offline. Renew to keep selling.',
            timestamp: now, // Pin to top
            actionLabel: 'Upgrade Plan',
            isRead: false,
          });
        } else if (isTrial) {
          newNotifications.push({
            id: 'sub-trial',
            type: 'success',
            title: 'TRIAL ACTIVE',
            message: trialEndsTimestamp
              ? `Your trial ends on ${formatShortDate(trialEndsTimestamp)}.`
              : 'Your premium trial is active.',
            timestamp: now, // Pin to top
            actionLabel: 'VIEW DETAILS',
            isRead: false,
          });
        }
      }
    }

    setNotifications(newNotifications.sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationAction = (notification: Notification) => {
    if (notification.actionLabel === 'View Order') {
      setIsOrdersModalOpen(true);
    } else if (notification.actionLabel === 'Update Stock') {
      setIsManageModalOpen(true);
    } else if (notification.actionLabel === 'Upgrade Plan' || notification.actionLabel === 'VIEW DETAILS') {
      setIsSubscriptionModalOpen(true);
    } else if (notification.actionLabel === 'Boost Post') {
      setIsSocialPostsModalOpen(true);
    } else {
      toast.success(`Action: ${notification.actionLabel}`);
    }
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const { vendor, setVendor, loading: vendorLoading, promptLogin } = useVendor();
  const { orders, refreshOrders } = useStoreOrders(storeId, initialOrders);

  useEffect(() => {
    if (orders) {
      const { totalReferralBonus: calculatedBonus } = calculateCommissionAndBonus(orders);
      setTotalReferralBonus(calculatedBonus);
      generateNotifications(orders, products, storeMeta);
    }
  }, [orders, products, storeMeta, generateNotifications]);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (showRefresh) setIsRefreshing(true);
    setIsSyncing(true);
    try {
      const [fetchedProducts, fetchedCategories, fetchedContacts, fetchedStoreMeta, fetchedReferrals, commissionData, revenueData, deliveryOrders] = await Promise.all([
        getProducts(storeId),
        getCategories(storeId),
        getContacts(storeId),
        getStoreMeta(storeId),
        getReferrals(storeId),
        getCommissionAnalytics(storeId),
        getRevenueAnalytics(storeId), // Fetch revenue data
        getReadyForDeliveryOrders(storeId) // Fetch delivery orders
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setContacts(fetchedContacts);
      setStoreMeta(fetchedStoreMeta as StoreMeta);
      setReferrals(fetchedReferrals);
      setCommissionAnalytics(commissionData);

      if (revenueData) {
        setRealTotalRevenue(revenueData.lifetimeRevenue + revenueData.lifetimeBonus);
      }

      if (deliveryOrders) {
        setDeliveriesCount(deliveryOrders.length);
      }

      if (fetchedStoreMeta) {
        setAmbassadorTier((fetchedStoreMeta as any).ambassadorTier || 'bronze');
      }

      refreshOrders();
      generateNotifications(initialOrders, fetchedProducts, fetchedStoreMeta as StoreMeta); // We use initialOrders initially because useStoreOrders sets asynchronously, but we can also use a returned value if we refactored.
      // Better to wait for useStoreOrders effect or await the fetch. We'll generate them in the useEffect that watches orders.

      // UI state stability: We no longer toggle showOnboarding or uiVisible here
      // as it causes flickering during background refreshes.
    } catch {
      // handle error
    } finally {
      setIsRefreshing(false);
      setIsSyncing(false);
      setLoading(false);
      isFetchingRef.current = false;
      lastFetchTimeRef.current = Date.now();
    }
  }, [storeId, refreshOrders]);

  const handleManualRefresh = useCallback(() => fetchData(true), [fetchData]);
  const handleSilentSync = useCallback((showOverlay = false) => fetchData(showOverlay), [fetchData]);
  const handleReferralAdded = useCallback(() => fetchData(false), [fetchData]);

  useEffect(() => {
    if (!storeId) return;
    requestNotificationPermission(storeId);

    if (initialStoreMeta) {
      setAmbassadorTier((initialStoreMeta as any).ambassadorTier || 'bronze');
    }

    // Silent background sync on mount to guarantee fresh data,
    // especially when the PWA service worker serves a cached page shell.
    fetchData(false).finally(() => setInitialSyncDone(true));
  }, [storeId, initialStoreMeta, fetchData]);


  useEffect(() => {
    // Validate vendor from localStorage/context on admin page load
    // Wait for vendor initial loading to complete to avoid race where vendor is still being read from localStorage
    // Temporarily disable vendor verification/redirect so vendors can access admin freely.
    // To re-enable: remove the if (false) guard and restore original verification logic.
    if (false) {
      (async () => {
        if (!storeId) return;
        if (vendorLoading) return; // still initializing vendor from storage

        // If no vendor present, open vendor login modal and wait for login
        if (!vendor) {
          // open vendor login modal for this store
          try {
            promptLogin(storeId);
          } catch (e) {
            // fallback to redirect to storefront if promptLogin not available
            router.push(`/${storeId}`);
          }
          return;
        }

        try {
          const res = await verifyVendorByPhone(storeId, vendor.phone);
          if (!res.success) {
            // Allow a fallback when the stored vendor session explicitly targets this storeId
            // This handles cases where phone normalization mismatches occur but the vendor was previously
            // authenticated for the same store and saved in localStorage.
            if (vendor.storeId === storeId) {
              // treat as valid session
              return;
            }
            // clear and redirect to storefront when vendor is not valid for this store
            setVendor(null);
            router.push(`/${storeId}`);
          }
        } catch (err) {
          console.error('Error validating vendor on admin load', err);
          // On error, be conservative but allow vendor if their session storeId matches
          if (vendor.storeId === storeId) return;
          setVendor(null);
          router.push(`/${storeId}`);
        }
      })();
    }

    if (searchParams && searchParams.get('open') === 'posts') {
      setIsPostsModalOpen(true);
    }
    if (searchParams && searchParams.get('open') === 'ambassador-hub') {
      setIsAmbassadorHubModalOpen(true);
    }
    if (searchParams && searchParams.get('open') === 'orders') {
      const orderId = searchParams.get('orderId');
      if (orderId) {
        setHighlightOrderId(orderId);
      }
      setIsOrdersModalOpen(true);
    }
  }, [searchParams, vendor, vendorLoading]);

  const handleUpdateProduct = async (productId: string, updatedData: Partial<Product>) => {
    try {
      await updateProduct(storeId, productId, updatedData);
      await handleManualRefresh();
    } catch (error) {
      console.error("Failed to update product:", error);
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(storeId, productId);
      handleManualRefresh();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const newCategory = await addCategory(storeId, name);
      setCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error("Failed to add category:", error);
      handleManualRefresh();
    }
  };

  const handleUpdateCategory = async (categoryId: string, name: string) => {
    try {
      await updateCategory(storeId, categoryId, name);
      handleManualRefresh();
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(storeId, categoryId);
      handleManualRefresh();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  useEffect(() => {
    // We no longer load the preview tab, replaced by warehouse
  }, [activeSection]);

  // Reset scroll position when switching tabs & trigger activity animation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (activeSection === 'activity') {
      setActivityVisitCount(c => c + 1);
    }
    if (activeSection === 'home') {
      setHomeVisitCount(c => c + 1);
    }
  }, [activeSection]);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    setIsTransitioning(true);
    setShouldShowSpotlight(true);
    markOnboardingAsCompleted(storeId);
    localStorage.setItem('hasCompletedOnboarding', 'true');

    setTimeout(() => {
      setIsTransitioning(false);
      setUiVisible(true);
    }, 800);
  }

  const handleAnimationComplete = () => {
    if (shouldShowSpotlight) {
      setTimeout(() => {
        setSpotlightStep('tips');
      }, 500);
      setShouldShowSpotlight(false);
    }
  };

  const handleRefreshOverlayTap = () => {
    const refreshButton = document.querySelector('[data-refresh-button]');
    if (refreshButton) {
      refreshButton.classList.add('pulse-glow');
      setTimeout(() => {
        refreshButton.classList.remove('pulse-glow');
      }, 1500);
    }
    toast.success('Wait for refresh to complete');
  };

  if (showOnboarding === null || !initialSyncDone) return <AdminSkeleton />;

  if (isTransitioning) {
    return <AdminSkeleton />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} storeName={storeMeta?.name || ''} />;
  }

  const isModalOpen = isComposerOpen || isManageModalOpen || isManageCategoriesModalOpen || isOrdersModalOpen || isPostsModalOpen || isSocialPostsModalOpen || isAmbassadorHubModalOpen || isHomeCardModalOpen || isLogoutModalOpen || isSubscriptionModalOpen;

  const handleLogout = async () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    clearAdminSession(storeId);
    setVendor(null);
    router.push(`/${storeId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 transition-colors relative">
      {/* Refresh overlay - blocks interactions during refresh */}
      {isRefreshing && (
        <div
          onClick={handleRefreshOverlayTap}
          onTouchStart={handleRefreshOverlayTap}
          className="fixed inset-0 z-50 bg-transparent cursor-not-allowed lg:hidden"
          style={{ pointerEvents: 'auto' }}
        />
      )}

      <AdminHeader
        onLogout={handleLogout}
        isRefreshing={false}
        storeMeta={storeMeta}
      />

      {/* Install prompt for vendors to install their admin app */}
      <InstallPrompt storeId={storeId} />


      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Home Dashboard - Always mounted, visibility toggled */}
        <div className={`${activeSection !== 'home' ? 'hidden' : ''}`}>
          <div className={`mb-8 transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
            <AdminHomeCards
              key={homeVisitCount}
              products={products}
              categories={categories}
              contacts={contacts}
              setActiveSection={setActiveSection}
              storeLink={`/${storeId}`}
              storeType={storeMeta?.storeType}
              onRefresh={(showRefresh) => fetchData(showRefresh)}
              isRefreshing={isRefreshing}
              totalProducts={products.length}
              totalCategories={categories.length}
              totalViews={products.reduce((sum, p) => sum + (p.views || 0), 0) + (storeMeta?.storePageViews || 0)}
              debtors={0}
              subscriptionStatus={storeMeta?.subscriptionStatus || 'trial'}
              referrals={referrals.length}
              onReferralAdded={handleReferralAdded}
              totalContacts={contacts.reduce((sum, region) => sum + (region.contacts?.length || 0), 0)}
              storeId={storeId}
              totalOrders={orders.length}
              promoCaption={storeMeta?.promoCaption}
              uiVisible={uiVisible}
              storeName={storeMeta?.name}
              ceoEmail={storeMeta?.ceoEmail}
              totalRevenue={realTotalRevenue}
              onAnimationComplete={handleAnimationComplete}
              onOrdersCardClick={() => setIsOrdersModalOpen(true)}
              openManageCategories={() => setIsManageCategoriesModalOpen(true)}
              onProductsCardClick={() => setIsManageModalOpen(true)}
              onAmbassadorCardClick={() => setIsAmbassadorHubModalOpen(true)}
              totalCommission={commissionAnalytics.totalCommission}
              totalReferralBonus={totalReferralBonus}
              totalExpenses={0}
              deliveries={deliveriesCount}
              setIsModalOpen={setIsHomeCardModalOpen}
              ambassadorTier={ambassadorTier}
              onSubscriptionCardClick={() => setIsSubscriptionModalOpen(true)}
            />
            <div className="mt-6">
              {storeMeta?.storeType === 'sports' && <AdminInvoicePanel storeId={storeId} />}
            </div>
          </div>
        </div>

        {/* Warehouse View (Replaces Store Preview) */}
        <div className={`${activeSection !== 'warehouse' ? 'hidden' : ''} h-[calc(100vh-8rem)]`}>
          <WarehouseHub storeId={storeId} storeName={storeMeta?.name} />
        </div>

        {/* Activity Hub */}
        <div className={`${activeSection !== 'activity' ? 'hidden' : ''}`}>
          <ActivityPage
            key={activityVisitCount}
            storeId={storeId}
            notifications={notifications}
            onNotificationAction={handleNotificationAction}
            onDismissNotification={handleDismissNotification}
            openSocialModal={() => setIsSocialPostsModalOpen(true)}
            openSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            onAddProductClick={() => setIsComposerOpen(true)}
            storeMeta={storeMeta}
            products={products}
            orders={orders}
          />
        </div>
      </main>

      {storeMeta?.storeType === 'automotive' ? (
        <AddVehicleComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          storeId={storeId}
          categories={categories}
          onProductAdded={() => fetchData()}
          onAddCategory={handleAddCategory}
        />
      ) : storeMeta?.storeType === 'livestock' ? (
        <AddLivestockComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          storeId={storeId}
          categories={categories}
          onProductAdded={() => fetchData()}
          onAddCategory={handleAddCategory}
        />
      ) : storeMeta?.storeType === 'fashion' ? (
        <AddFashionComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          storeId={storeId}
          categories={categories}
          onProductAdded={() => fetchData()}
          onAddCategory={handleAddCategory}
          storeName={storeMeta?.name || ''}
          instagramHandle={storeMeta?.businessInstagram}
        />
      ) : storeMeta?.storeType === 'restaurant' ? (
        <AddMenuComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          storeId={storeId}
          categories={categories}
          onProductAdded={() => fetchData()}
          onAddCategory={handleAddCategory}
        />
      ) : (
        <AddProductComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          storeId={storeId}
          categories={categories}
          onProductAdded={() => fetchData()}
          onAddCategory={handleAddCategory}
        />
      )}

      <ManageProductsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        products={products}
        setProducts={setProducts}
        categories={categories}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onAddCategory={handleAddCategory}
      />

      <ManageCategoriesModal
        isOpen={isManageCategoriesModalOpen}
        onClose={() => setIsManageCategoriesModalOpen(false)}
        products={products}
        categories={categories}
        storeId={storeId}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <AdminOrdersModal
        isOpen={isOrdersModalOpen}
        onClose={() => {
          setIsOrdersModalOpen(false);
          setHighlightOrderId(null); // Clear highlight on close
        }}
        orders={orders}
        storeId={storeId}
        onOrderUpdated={refreshOrders}
        highlightOrderId={highlightOrderId}
      />

      <AmbassadorHubModal
        isOpen={isAmbassadorHubModalOpen}
        onClose={() => setIsAmbassadorHubModalOpen(false)}
        storeId={storeId}
        onReferralAdded={handleReferralAdded}
      />

      <PostsComposerModal
        isOpen={isPostsModalOpen}
        onClose={() => setIsPostsModalOpen(false)}
        storeId={storeId}
        contacts={contacts}
        products={products}
        storeName={storeMeta?.name}
      />

      <SocialPostsModal
        isOpen={isSocialPostsModalOpen}
        onClose={() => setIsSocialPostsModalOpen(false)}
        storeId={storeId}
        storeName={storeMeta?.name || ''}
        products={products}
        categories={categories}
      />

      <AnimatePresence>
        {isSubscriptionModalOpen && (
          <SubscriptionModal
            handleClose={() => {
              setIsSubscriptionModalOpen(false);
              setIsHomeCardModalOpen(false);
            }}
            storeId={storeId}
            ceoEmail={storeMeta?.ceoEmail}
            storeName={storeMeta?.name}
            storeType={storeMeta?.storeType}
            onOpenAmbassadorHub={() => {
              setIsSubscriptionModalOpen(false);
              setIsHomeCardModalOpen(false);
              setIsAmbassadorHubModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />

      <div className={`transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        {activeSection !== 'warehouse' && <FloatingActionButton isModalOpen={isModalOpen} />}
        {spotlightStep !== 'tips' && !isModalOpen &&
          <MobileNav
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onAddProductClick={() => setIsComposerOpen(true)}
            onManageProductsClick={() => setIsManageModalOpen(true)}
            onManageCategoriesClick={() => setIsManageCategoriesModalOpen(true)}
            isRefreshing={isRefreshing}
          />
        }
      </div>
    </div>
  );
}
